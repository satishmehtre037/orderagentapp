import {
  getBusinessConfigs,
  getCategoryTemplate,
} from './businessService';
import { supabase } from '../config/supabase';
import { Business } from '../types/index';

// Set to false (or gate on env) in production to stop dumping full menus/pricing into logs.
const DEBUG = process.env.NODE_ENV !== 'production';
const log = (...args: any[]) => { if (DEBUG) console.log(...args); };
const warn = (...args: any[]) => console.warn(...args);

type CaptureType = 'booking' | 'lead' | 'order';

interface ConfigRow {
  config_key: string;
  config_value: unknown;
}

/** Thrown for any PromptBuilder-specific failure so callers can branch on `.code`. */
export class PromptBuilderError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'PromptBuilderError';
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// In-memory TTL + LRU cache
//
// Note: this is per-process. Fine for a single Node server or one warm
// serverless instance; if you scale to multiple instances/regions and need
// a shared cache, swap this module out for Redis (same get/set/invalidate
// shape below) — callers of buildSystemPrompt don't need to change.
// ---------------------------------------------------------------------------

interface CacheEntry {
  prompt: string;
  expiresAt: number;
  builtAt: number;
}

const CACHE_TTL_MS = Number(process.env.PROMPT_CACHE_TTL_MS) || 5 * 60 * 1000; // 5 min default
const CACHE_MAX_ENTRIES = Number(process.env.PROMPT_CACHE_MAX_ENTRIES) || 500;

const promptCache = new Map<string, CacheEntry>();

function cacheKey(businessId: string): string {
  return businessId;
}

function getCached(businessId: string): CacheEntry | null {
  const key = cacheKey(businessId);
  const entry = promptCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    promptCache.delete(key);
    return null;
  }
  // Touch for LRU: delete + reinsert moves it to the "most recent" end of Map's iteration order.
  promptCache.delete(key);
  promptCache.set(key, entry);
  return entry;
}

function setCached(businessId: string, prompt: string): void {
  const key = cacheKey(businessId);
  if (promptCache.size >= CACHE_MAX_ENTRIES && !promptCache.has(key)) {
    const oldestKey = promptCache.keys().next().value;
    if (oldestKey !== undefined) promptCache.delete(oldestKey);
  }
  promptCache.set(key, { prompt, expiresAt: Date.now() + CACHE_TTL_MS, builtAt: Date.now() });
}

/** Call this whenever a business's config/template is edited so stale prompts don't linger for up to CACHE_TTL_MS. */
export function invalidatePromptCache(businessId: string): void {
  promptCache.delete(cacheKey(businessId));
  log(`[PromptBuilder] Cache invalidated for business_id: ${businessId}`);
}

/** Nuke the whole cache — e.g. after a bulk template migration. */
export function clearPromptCache(): void {
  promptCache.clear();
  log('[PromptBuilder] Cache cleared entirely.');
}

export function getPromptCacheStats(): { size: number; maxEntries: number; ttlMs: number } {
  return { size: promptCache.size, maxEntries: CACHE_MAX_ENTRIES, ttlMs: CACHE_TTL_MS };
}

/** Prebuild + cache prompts for a batch of businesses (e.g. on server boot). Failures don't stop the batch. */
export async function warmPromptCache(businessIds: string[]): Promise<void> {
  const results = await Promise.allSettled(businessIds.map((id) => buildSystemPrompt(id)));
  const failed = results.filter((r) => r.status === 'rejected').length;
  log(`[PromptBuilder] Cache warm complete: ${businessIds.length - failed}/${businessIds.length} succeeded.`);
}

// ---------------------------------------------------------------------------
// Retry helper — Supabase/network calls get transient hiccups; retry a
// couple of times with backoff before giving up.
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(
  fn: () => Promise<T>,
  { retries = 2, baseDelayMs = 150, label = 'operation' }: { retries?: number; baseDelayMs?: number; label?: string } = {}
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        const delay = baseDelayMs * 2 ** attempt;
        warn(`[PromptBuilder] ${label} failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${delay}ms...`, err);
        await sleep(delay);
      }
    }
  }
  throw lastErr;
}

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateBusinessId(businessId: string): void {
  if (!businessId || typeof businessId !== 'string') {
    throw new PromptBuilderError('businessId is required and must be a non-empty string', 'INVALID_BUSINESS_ID');
  }
  if (!UUID_RE.test(businessId)) {
    warn(`[PromptBuilder Warning] businessId "${businessId}" doesn't look like a UUID — proceeding anyway.`);
  }
}

/**
 * Neutralizes triple-backtick fences inside user-editable config text (FAQ answers,
 * item names, notes, etc.) so a customer-entered value can't accidentally — or
 * deliberately — break out of the ```json capture block``` the model is instructed
 * to emit at the end of its replies.
 */
function sanitizeText(input: string): string {
  return input.replace(/```/g, '\u200b`\u200b`\u200b`');
}

// ---------------------------------------------------------------------------
// Fallback templates (used only if category_templates lookup fails/misses)
// ---------------------------------------------------------------------------

const CATEGORY_FALLBACK_TEMPLATES: Record<string, string> = {
  salon: `You are a polite, helpful AI receptionist for {{business_name}} (Salon & Spa).
Help clients with bookings, staff appointments, treatment details, and pricing.

Services:
{{services}}

Team:
{{staff}}

Hours:
{{hours}}`,
  bakery: `You are an expert AI ordering assistant for {{business_name}} (Bakery).
Help customers order cakes, pastries, snacks, and fresh bakes with delivery details.

Menu:
{{menu_items}}

Hours:
{{hours}}`,
  cafe: `You are a friendly AI cafe concierge for {{business_name}}.
Help customers with coffee, food menu, prices, and orders.

Menu:
{{cafe_menu}}

Hours:
{{hours}}`,
  gym: `You are a fitness counselor for {{business_name}} (Gym & Fitness Center).
Help with memberships, trainers, and trial passes.

Plans:
{{gym_plans}}

Trainers:
{{staff}}

Hours:
{{hours}}`,
  tuition: `You are an academic counselor for {{business_name}} (Tuition & Coaching Institute).
Help parents and students with course details, fees, batch timings, and demo class admissions.

Courses:
{{course_list}}

Admission Info:
{{admission_process}}

Hours:
{{hours}}`,
  clinic: `You are an empathetic, professional medical receptionist for {{business_name}} (Clinic & Healthcare Center).
Help patients book consultation appointments, check doctor OPD availability, view consultation tariffs, and clinic timings.

Doctors & Specialists:
{{staff}}

Treatments & Consultation Tariffs:
{{services}}

Clinic Hours:
{{hours}}`,
  hospital: `You are an empathetic, highly professional medical receptionist and triage assistant for {{business_name}} (Hospital & Multi-Specialty Healthcare Center).
Help patients book doctor consultation / OPD appointments, check doctor availability and departments, access diagnostic lab reports, and provide 24/7 emergency contact info.

Doctors & Specialists:
{{staff}}

Departments, OPD Tariffs & Consultations:
{{services}}

Hospital OPD & Emergency Hours:
{{hours}}`,
  retail: `You are an attentive, helpful shopping assistant for {{business_name}} (Boutique & Retail Store).
Help shoppers browse product catalogs, check sizes, verify stock, and place delivery orders.

Product Catalog:
{{menu_items}}

Store Hours:
{{hours}}`,
  real_estate: `You are an executive property concierge for {{business_name}} (Real Estate & Property Advisory).
Help prospective buyers and tenants explore properties, pricing, and schedule on-site visits.

Available Properties / Configurations:
{{services}}

Office Hours:
{{hours}}`,
  ca_firm: `You are the executive AI support assistant for {{business_name}} (Chartered Accountancy & Tax Advisory Firm).
Help clients and prospects with tax compliance, GST returns, ITR filings, ROC compliance, audit queries, and document checklist inquiries.

Services & Advisory Portfolio:
{{services}}
{{menu_items}}

Office Hours & Partner Availability:
{{hours}}`,
};

const DEFAULT_FALLBACK_TEMPLATE = `You are the official customer service assistant for {{business_name}}.
Help customers with inquiries, catalog items, pricing, and bookings.

Catalog / Services:
{{menu_items}}
{{services}}

Hours:
{{hours}}`;

const CAPTURE_TYPE_BY_CATEGORY: Record<string, CaptureType> = {
  salon: 'booking',
  clinic: 'booking',
  hospital: 'booking',
  tuition: 'lead',
  real_estate: 'lead',
  ca_firm: 'lead',
  bakery: 'order',
  cafe: 'order',
  retail: 'order',
  gym: 'lead',
  custom: 'order',
};

// ---------------------------------------------------------------------------
// Config value formatters — add a new config_key here instead of another
// if/else branch.
// ---------------------------------------------------------------------------

type Formatter = { format: (val: any[]) => string; label?: string };

const FORMATTERS: Record<string, Formatter> = {
  menu_items: {
    label: 'Live Menu Catalog',
    format: (val) =>
      val.map((m) => `🍰 *${m.name}* — ₹${m.price}${m.unit ? ` _(per ${m.unit})_` : ''}`).join('\n'),
  },
  cafe_menu: {
    label: 'Live Cafe Menu',
    format: (val) =>
      val.map((c) => `☕ *${c.name}* — ₹${c.price}${c.category ? ` _(${c.category})_` : ''}`).join('\n'),
  },
  services: {
    format: (val) =>
      val.map((s) => `✂️ *${s.name}* — ₹${s.price}${s.duration ? ` _(${s.duration})_` : ''}`).join('\n'),
  },
  gym_plans: {
    label: 'Live Gym Plans',
    format: (val) =>
      val.map((g) => `🏋️ *${g.name}* — ₹${g.price}${g.duration ? ` _(${g.duration})_` : ''}`).join('\n'),
  },
  staff: {
    format: (val) =>
      val.map((st) => `👤 *${st.name}*${st.specialty ? ` _(${st.specialty})_` : ''}`).join('\n'),
  },
  course_list: {
    format: (val) =>
      val.map((c) => `📚 *${c.name}* — Fee: ₹${c.fee}${c.batch_timing ? ` _(Timing: ${c.batch_timing})_` : ''}`).join('\n'),
  },
  faqs: {
    format: (val) => val.map((f: any) => `*Q: ${f.question}*\n_${f.answer}_`).join('\n\n'),
  },
};
FORMATTERS.courses = FORMATTERS.course_list; // alias, same shape as course_list

function formatConfigValue(key: string, val: unknown): string {
  try {
    const formatter = FORMATTERS[key];
    let out: string;
    if (formatter && Array.isArray(val)) {
      out = formatter.format(val);
      if (formatter.label) log(`[PromptBuilder] 📋 ${formatter.label} Injected:\n${out}`);
    } else if (typeof val === 'string') {
      out = val;
    } else {
      out = JSON.stringify(val, null, 2);
    }
    return sanitizeText(out);
  } catch (err) {
    warn(`[PromptBuilder Warning] Failed to format config "${key}", falling back to raw JSON:`, err);
    try {
      return sanitizeText(JSON.stringify(val));
    } catch {
      return '[Unformattable value]';
    }
  }
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function fetchBusiness(businessId: string): Promise<Business> {
  const { data, error } = await supabase.from('businesses').select('*').eq('id', businessId).single();
  if (error || !data) {
    throw new PromptBuilderError(`Business not found for ID: ${businessId}`, 'BUSINESS_NOT_FOUND');
  }
  return data as Business;
}

async function resolveBaseTemplate(category: string): Promise<string> {
  try {
    const templateObj = await getCategoryTemplate(category);
    if (templateObj?.prompt_template) return templateObj.prompt_template;
  } catch (err) {
    warn(`[PromptBuilder Warning] Template lookup failed for category "${category}":`, err);
  }
  const cat = (category || '').toLowerCase();
  return CATEGORY_FALLBACK_TEMPLATES[cat] ?? DEFAULT_FALLBACK_TEMPLATE;
}

function buildConfigMap(business: Business, configs: ConfigRow[]): Record<string, string> {
  const map: Record<string, string> = { business_name: business.name };
  for (const item of configs) {
    map[item.config_key] = formatConfigValue(item.config_key, item.config_value);
  }
  return map;
}

/**
 * Substitutes {key} and {{key}} placeholders with config values.
 *
 * This only matched the single-brace form. Every template in
 * CATEGORY_FALLBACK_TEMPLATES uses the double-brace form, so on the fallback
 * path the regex matched `{business_name}` *inside* `{{business_name}}`,
 * substituted it, and left the outer braces behind — the model received
 * "{Sharma Bakery}" and, for anything not in the config map, a literal
 * "{[Not provided]}". Both forms are now accepted.
 */
function injectPlaceholders(template: string, configMap: Record<string, string>): string {
  // Double-brace first: {{key}} would otherwise be consumed by the single-brace
  // pattern and leave stray braces around the substituted value.
  return template
    .replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key) => resolvePlaceholder(key, configMap))
    .replace(/\{\s*(\w+)\s*\}/g, (_match, key) => resolvePlaceholder(key, configMap));
}

function resolvePlaceholder(key: string, configMap: Record<string, string>): string {
  const value = configMap[key];
  if (value !== undefined && String(value).trim() !== '') return String(value);

  warn(`[PromptBuilder Warning] Missing config value for key: ${key}.`);
  return '[Not provided]';
}

// ---------------------------------------------------------------------------
// Prompt instruction blocks
// ---------------------------------------------------------------------------

function liveMenuOverrideBlock(businessName: string): string {
  return `### CRITICAL INSTRUCTION - LIVE MENU OVERRIDE:
The items and pricing listed below represent the LIVE, UP-TO-DATE catalog for ${businessName}. 
Even if past messages in the conversation history claimed an item was unavailable, ALWAYS check the current catalog below. If an item is listed below, IT IS IN STOCK AND FULLY AVAILABLE. Never claim an item is unavailable if it is in the list below.

`;
}

function captureInstructionBlock(captureType: CaptureType): string {
  return `\n\n### 📦 ORDER & BOOKING CAPTURE GUIDELINES:
- DO NOT output an order capture tag for initial greetings ('hi', 'hello', 'hey'), casual chat, general questions, or menu browsing.
- ONLY output the structured <order_capture> tag at the VERY END of your message when the customer EXPLICITLY CONFIRMS items, quantities, services, or books a specific date/time.

When an order or booking is confirmed, append this exact block at the very end:
<order_capture>
{
  "type": "${captureType}",
  "details": {
    "items": [{"name": "Item or Service Name", "quantity": 1, "price": 100}],
    "total": 100,
    "fulfillment": "delivery or pickup or in-salon",
    "delivery_address": "Customer address or Not specified",
    "appointment_time": "Date & Time if booked or Not specified",
    "notes": "Any special customer notes or preferences"
  }
}
</order_capture>

### CANCELLATION RULES:
- If a customer asks to cancel their existing order or booking, politely confirm the cancellation.
- Append <order_capture>{"action": "cancel"}</order_capture> at the end.`;
}

function scopeGuardBlock(businessName: string): string {
  return `\n\n### 🎯 SCOPE & FOCUS:
- You are exclusively the dedicated WhatsApp assistant for ${businessName}.
- Focus all interactions on assisting with ${businessName}'s menu, products, services, operating hours, and order/booking inquiries.
- If a user inquires about unrelated topics, courteously redirect them back to our offerings:
  "I am here to assist with ${businessName}'s menu, orders, and services. How may I help you today?"`;
}

function languageAndFormattingBlock(businessName: string): string {
  return `\n\n### 🌐 LANGUAGE & CONVERSATIONAL STYLE:
1. **DEFAULT LANGUAGE = POLISHED, PROFESSIONAL ENGLISH**:
   - Always communicate in warm, crisp, professional English by default.
   - For an initial greeting, welcome the customer warmly, display the live menu/services with prices, operating hours, and ask how to help.

2. **LANGUAGE MIRRORING (HINGLISH ONLY WHEN INITIATED BY CUSTOMER)**:
   - Only switch to Hindi/Hinglish if the customer explicitly initiates in Hindi/Hinglish (e.g. "bhaiya order pack kar dena", "kal shaam 5 baje").
   - If the customer speaks English, maintain standard professional English.

### 🎙️ INDIAN CONVERSATIONAL COMPREHENSION:
- Fluently understand common Indian WhatsApp terminology: "Bhaiya", "parcel", "pack kar do", "ready rakhna", "chahiye", "kitne ka hai", "kal shaam 5 baje", "1kg", "urgent".
- Intelligently extract items, quantities, dates, times, and delivery locations from free-form or voice-transcribed messages.

### 🧮 QUANTITY & ARITHMETIC RULES:
- Accurately calculate order totals: Total = Sum of (Quantity × Price).
- Default quantity is 1 if unspecified.

### ✨ WHATSAPP FORMATTING EXCELLENCE:
- Use emojis, clean bullet points (•), and bold headers (*Bold Title*) for readability.
- Keep follow-up replies concise and direct.
- When confirming an order or appointment, provide a clear structured summary with Itemized List, Date/Time, Delivery Address, and Total Amount.`;
}

function isValidUpiId(upi: string): boolean {
  // basic VPA pattern: name@bank
  return /^[\w.\-]{2,256}@[\w.\-]{2,64}$/.test(upi);
}

function upiInstructionBlock(businessName: string, upiId: string, paymentNote?: string): string {
  const cleanUpi = upiId.trim();
  const cleanBizName = encodeURIComponent(businessName.replace(/\s+/g, '+'));
  return `\n\n### 💳 INSTANT UPI PAYMENT AUTOMATION RULES:
- Store UPI ID: \`${cleanUpi}\`
- When confirming an order or booking with a total amount, ALWAYS provide the exact total and dynamic clickable UPI pay link in this structured format:

💰 *Total Amount:* ₹[Total]

📲 *Pay via any UPI App (GPay / PhonePe / Paytm / BHIM):*
👉 upi://pay?pa=${cleanUpi}&pn=${cleanBizName}&am=[Total]&cu=INR&tn=Order-${cleanBizName}
(Or send to UPI ID: \`${cleanUpi}\`)
${paymentNote ? `\n📝 _${paymentNote}_` : ''}

(Always replace [Total] with the exact calculated order sum in numbers, e.g. 650).`;
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

const SLOW_BUILD_WARN_MS = Number(process.env.PROMPT_SLOW_BUILD_MS) || 800;

/** Does the actual DB round-trips + assembly. No caching here — buildSystemPrompt owns that. */
async function buildFreshPrompt(businessId: string): Promise<string> {
  const business = await withRetry(() => fetchBusiness(businessId), { label: `fetchBusiness(${businessId})` });

  // Template resolution and config fetch don't depend on each other — run in parallel.
  const [baseTemplate, configs] = await Promise.all([
    resolveBaseTemplate(business.category),
    withRetry(() => getBusinessConfigs(businessId) as Promise<ConfigRow[]>, { label: `getBusinessConfigs(${businessId})` }),
  ]);

  const configMap = buildConfigMap(business, configs);
  log(`[PromptBuilder] Merging ${Object.keys(configMap).length} dynamic placeholders...`);

  let prompt = injectPlaceholders(baseTemplate, configMap);

  const captureType: CaptureType = CAPTURE_TYPE_BY_CATEGORY[business.category] ?? 'order';

  prompt =
    liveMenuOverrideBlock(business.name) +
    prompt +
    captureInstructionBlock(captureType) +
    scopeGuardBlock(business.name) +
    languageAndFormattingBlock(business.name);

  const upiId = configs.find((c) => c.config_key === 'upi_id')?.config_value;
  const paymentNote = configs.find((c) => c.config_key === 'payment_note')?.config_value;
  const autoSendPayment = configs.find((c) => c.config_key === 'auto_send_payment_link')?.config_value !== false;

  if (typeof upiId === 'string' && upiId.trim() && autoSendPayment) {
    if (!isValidUpiId(upiId.trim())) {
      warn(`[PromptBuilder Warning] UPI ID "${upiId}" doesn't look valid — skipping payment block.`);
    } else {
      prompt += upiInstructionBlock(business.name, upiId, typeof paymentNote === 'string' ? paymentNote : undefined);
    }
  }

  return prompt;
}

export interface BuildSystemPromptOptions {
  /** Skip the cache and rebuild from the DB, refreshing the cached copy afterward. */
  forceRefresh?: boolean;
}

/**
 * Builds a category-aware system prompt dynamically by merging
 * category_templates with business_config rows for the tenant.
 *
 * Cached per businessId for CACHE_TTL_MS (default 5 min) so a busy WhatsApp
 * thread doesn't hit Supabase on every single inbound message. Call
 * `invalidatePromptCache(businessId)` after the tenant edits their config or
 * template so the next message picks up the change immediately instead of
 * waiting out the TTL.
 */
export async function buildSystemPrompt(businessId: string, options: BuildSystemPromptOptions = {}): Promise<string> {
  validateBusinessId(businessId);

  if (!options.forceRefresh) {
    const cached = getCached(businessId);
    if (cached) {
      log(`[PromptBuilder] Cache HIT for business_id: ${businessId} (age ${Date.now() - cached.builtAt}ms)`);
      return cached.prompt;
    }
  }

  log(`[PromptBuilder] Cache MISS for business_id: ${businessId} — building fresh prompt`);
  const start = Date.now();
  const prompt = await buildFreshPrompt(businessId);
  const elapsed = Date.now() - start;

  if (elapsed > SLOW_BUILD_WARN_MS) {
    warn(`[PromptBuilder] Slow prompt build for ${businessId}: ${elapsed}ms`);
  } else {
    log(`[PromptBuilder] Prompt built in ${elapsed}ms`);
  }

  setCached(businessId, prompt);
  log(`[PromptBuilder] System prompt built successfully (${prompt.length} chars)`);
  return prompt;
}

/** Same as buildSystemPrompt but also returns cache/timing metadata — handy for debug endpoints or logging dashboards. */
export async function buildSystemPromptWithMeta(
  businessId: string,
  options: BuildSystemPromptOptions = {}
): Promise<{ prompt: string; cached: boolean; length: number; businessId: string; generatedAt: string }> {
  const wasCached = !options.forceRefresh && !!getCached(businessId);
  const prompt = await buildSystemPrompt(businessId, options);
  return {
    prompt,
    cached: wasCached,
    length: prompt.length,
    businessId,
    generatedAt: new Date().toISOString(),
  };
}

// ===========================================================================
// Specialized CA Firm Automation Suite Prompt Builders
// ===========================================================================

export function buildCASupportPrompt(
  firmName: string,
  clientName: string,
  complianceRows: Array<{ compliance_type: string; due_date: string; status: string }>,
  docRows: Array<{ document_name: string; compliance_type: string; status: string }>
): string {
  const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const complianceLines = complianceRows.length
    ? complianceRows.map((r) => `- ${r.compliance_type}: due ${r.due_date}, status ${r.status}`).join('\n')
    : '- No compliance records currently on file.';

  const docLines = docRows.length
    ? docRows.map((r) => `- ${r.document_name} (${r.compliance_type}): ${r.status}`).join('\n')
    : '- No pending document requests.';

  return `You are the executive AI support assistant for ${firmName}, a Chartered Accountancy & Tax Advisory firm in India. Today is ${todayStr}.
Client Name: ${clientName}

Client Live Compliance Calendar:
${complianceLines}

Client Document Status:
${docLines}

### Strict Guidelines:
1. Answer GST, ITR, TDS, ROC, and tax compliance queries clearly, crisply, and professionally.
2. Use ONLY the live data above for this client's specific due dates, pending documents, or filing statuses. NEVER invent or hallucinate dates or tax figures.
3. If an inquiry requires complex tax planning or official signing/certification, politely clarify that a Chartered Accountant / Partner from the team will review and connect directly.
4. Keep WhatsApp responses concise (3-5 lines), well-structured with bullet points where appropriate.
5. Default to clean, professional English. If the client speaks in Hindi/Hinglish, you may politely mirror their language.
6. Sign off as "Team ${firmName}".`;
}

export function buildCALeadQualificationPrompt(firmName: string): string {
  const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  return `You are the lead-qualification AI assistant for ${firmName}, a Chartered Accountancy & Advisory firm in India. Today is ${todayStr}.
You are chatting on WhatsApp with a prospective client who has just reached out.

Your objectives:
1. Warmly acknowledge their inquiry in a crisp, courteous, professional manner.
2. Ask 1-2 focused questions at a time (never a long questionnaire) to identify:
   - Service needed (e.g. GST registration/filing, ITR filing, Company/LLP incorporation, Tax Audit, Bookkeeping, ROC compliance, etc.)
   - Business entity type (Individual / Proprietorship / Partnership / Private Limited / LLP)
   - Urgency / timeline.
3. Once the basic requirement is clear, let them know that a senior CA from the team will connect shortly with the exact roadmap and quotation.
4. Keep messages concise (2-4 lines). Never quote arbitrary pricing yourself; state that the partner will provide a customized quote.
5. Default to polished English; switch to Hinglish only if the prospect initiated in Hinglish.`;
}

export function buildCALeadClassifierPrompt(userMessage: string, assistantReply: string): string {
  return `You are a classification assistant for a CA firm's lead pipeline.
Based on this conversation exchange, output STRICT JSON only (no markdown, no backticks, no preamble):
{"requirement": "<GST Registration / ITR Filing / Company Incorporation / Tax Audit / Bookkeeping / ROC Compliance / Other / Unclear>", "business_type": "<Individual / Proprietorship / Partnership / Company / Unclear>", "urgency": "<High / Medium / Low / Unclear>", "score": "<Hot / Warm / Cold>"}

Scoring Rules:
- Score "Hot" if urgency is High, immediate deadline, or explicit intent to start now.
- Score "Warm" if interested in service but timeline is flexible.
- Score "Cold" if vague inquiry or just casual browsing.

Prospect Message: ${userMessage}
Assistant Reply: ${assistantReply}`;
}

export function buildCADocumentRequestPrompt(firmName: string, clientName: string, complianceType: string, docList: string): string {
  return `You are writing a direct, friendly WhatsApp document checklist request to client "${clientName}" on behalf of "${firmName}" for their upcoming "${complianceType}" filing.

Exact document checklist to request:
${docList}

STRICT INSTRUCTIONS:
- Output ONLY the ready-to-send WhatsApp message.
- NEVER include thinking, reasoning, analysis, headings like "Final Message", or meta-notes.
- Keep it 3-5 lines, warm, and professional.
- Sign off as "Team ${firmName}".`;
}

export function buildCAComplianceReminderPrompt(
  firmName: string,
  clientName: string,
  complianceType: string,
  dueDate: string,
  stage: 'friendly_7d' | 'reminder_3d' | 'urgent_1d' | 'due_today' | 'overdue',
  daysOverdue: number
): string {
  return `Write a concise, professional compliance deadline reminder (3-5 lines) from ${firmName} to client "${clientName}".
Compliance: ${complianceType}
Due Date: ${dueDate}
Stage: ${stage} (${stage === 'friendly_7d' ? 'Gentle heads up' : stage === 'reminder_3d' ? 'Clear reminder' : stage === 'urgent_1d' ? 'Urgent tone, due tomorrow' : stage === 'due_today' ? 'Due today, immediate action requested' : `Overdue by ${daysOverdue} days, firm but polite warning of possible late fee/penalty risk`})

Tone must strictly match the stage. Ask them to share any remaining documents or confirmation to avoid delayed filing. Sign off as "Team ${firmName}".`;
}

export function buildCADocumentFollowupPrompt(
  firmName: string,
  clientName: string,
  documentName: string,
  complianceType: string,
  attemptNumber: number
): string {
  return `Write a short, professional follow-up message (WhatsApp/Email friendly, 2-4 lines) from ${firmName} reminding client "${clientName}" to share their pending document "${documentName}" for "${complianceType}".
This is follow-up attempt #${attemptNumber} (${attemptNumber === 1 ? 'Gentle reminder' : attemptNumber === 2 ? 'Clear follow-up' : 'Firm reminder mentioning that delay will impact filing timeline'}).
Ask them to upload or reply with the document at the earliest. Sign off as "Team ${firmName}".`;
}

export function buildCALeadFollowupPrompt(
  firmName: string,
  leadName: string,
  requirement: string,
  attemptNumber: number
): string {
  return `Write a short, friendly, non-intrusive follow-up message (2-4 lines) from ${firmName} to prospective client "${leadName}" regarding their inquiry about "${requirement}".
This is follow-up attempt #${attemptNumber}. Keep it conversational, helpful, and invite them to ask any questions or schedule a quick call. Sign off as "Team ${firmName}".`;
}

export function buildCAInvoiceReminderPrompt(
  firmName: string,
  clientName: string,
  invoiceId: string,
  amount: number,
  currency: string,
  dueDate: string,
  stage: 'upcoming_3d' | 'due_today' | 'overdue_mild' | 'overdue_moderate' | 'overdue_severe',
  daysOverdue: number
): string {
  return `Write a professional payment reminder (3-5 lines) from ${firmName} to client "${clientName}".
Invoice ID: ${invoiceId}
Amount Due: ${currency} ${amount}
Due Date: ${dueDate}
Stage: ${stage} (${stage === 'upcoming_3d' ? 'Friendly upcoming notice' : stage === 'due_today' ? 'Due today' : stage === 'overdue_mild' ? 'Polite overdue reminder' : stage === 'overdue_moderate' ? 'Firm overdue reminder (8-15 days)' : `Severely overdue (${daysOverdue} days), formal request for settlement`})

Stay professional and courteous at all times. Include a request to settle the invoice or share the UTR/transaction details if already paid. Sign off as "Accounts Team, ${firmName}".`;
}

export function buildCAPaymentThanksPrompt(
  firmName: string,
  clientName: string,
  invoiceId: string,
  amount: number,
  currency: string
): string {
  return `Write a warm, professional payment receipt acknowledgement (2-3 lines) from ${firmName} to "${clientName}" confirming receipt of ${currency} ${amount} for Invoice #${invoiceId}. Sign off as "Accounts Team, ${firmName}".`;
}