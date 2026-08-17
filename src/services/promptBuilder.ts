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
  tuition: 'lead',
  real_estate: 'lead',
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

function injectPlaceholders(template: string, configMap: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_match, key) => {
    if (configMap[key] !== undefined) return configMap[key];
    warn(`[PromptBuilder Warning] Missing config value for key: ${key}. Defaulting to empty.`);
    return '[Not provided]';
  });
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
  return `\n\n### CRITICAL ORDER & BOOKING CAPTURE INSTRUCTION:
- DO NOT output a JSON capture block for greetings ('hi', 'hello', 'hey'), casual talk, general questions, or menu inquiries.
- ONLY output a JSON capture block at the very end of your message when the customer EXPLICITLY CONFIRMS a specific item/service order with quantity or books a specific appointment date/time.

When an order/booking is confirmed, append this JSON block at the very end:
\`\`\`json
{
  "capture": {
    "type": "${captureType}",
    "details": {
      "items": [{"name": "Specific Service or Item Name", "quantity": 1, "price": 100}],
      "total": 100,
      "fulfillment": "delivery or pickup or in-salon",
      "delivery_address": "Address or Not specified",
      "appointment_time": "Time if booked",
      "notes": "Order or booking notes"
    }
  }
}
\`\`\`

### CANCELLATION RULES:
- If a customer asks to cancel their order, booking, or appointment, politely confirm that their order has been cancelled and express that you look forward to serving them next time.
- Append {"capture": {"action": "cancel"}} at the end.`;
}

function scopeGuardBlock(businessName: string): string {
  return `\n\n### STRICT SCOPE & OFF-TOPIC GUARDRAIL:
- You are EXCLUSIVELY the virtual customer support assistant for ${businessName}.
- You MUST NEVER write code (e.g. Python, Java, JavaScript, C++), solve math problems, write essays, answer general knowledge/trivia, or act as an open-ended AI assistant.
- If the user asks for programming code, homework help, politics, trivia, or anything outside of ${businessName}'s menu, products, pricing, orders, and store timings, POLITELY DECLINE and redirect them:
  "I am the virtual assistant for ${businessName} and can only assist with our products, menu, orders, and store services. How may I help you today?"`;
}

function languageAndFormattingBlock(businessName: string): string {
  return `\n\n### 🌐 STRICT LANGUAGE & ELEGANCE GUIDELINES:
1. **DEFAULT LANGUAGE = POLISHED, PROFESSIONAL ENGLISH**:
   - By default, you MUST ALWAYS communicate in crisp, elegant, professional English.
   - When a customer greets in English ("Hi", "Hey", "Heyy", "Hello") or types in English, you MUST ALWAYS respond in elegant, structured English.
   - For a first greeting, ALWAYS format cleanly like this:
     ✨ *Welcome to ${businessName}!* ✨

     We're excited to assist you! Here are our services:
     • *Deluxe Haircut & Blowdry* — ₹450 _(45 mins)_
     • *Hydrating Facial Treatment* — ₹1200 _(60 mins)_

     *Our Team:*
     • Ankita (Senior Stylist)
     • Rahul (Specialist)

     🕒 *Hours:* Mon - Sun, 9:00 AM - 9:00 PM

     How can we help you today?

2. **LANGUAGE MIRRORING (HINGLISH ONLY WHEN CUSTOMER INITIATES)**:
   - ONLY use Hinglish/Hindi if the customer's incoming message is explicitly in Hindi or Hinglish (e.g. *"bhaiya cake ready rakhna"*, *"kitna time lagega"*, *"kal sham 5 baje"*).
   - If the customer speaks English, NEVER use Hindi greetings like "Namaste", "Swagat hai", "madad kar dunga", "bata dijiye". Keep it strictly in high-end, professional English.

### 🎙️ VERNACULAR & HINGLISH COMPREHENSION:
You have native-level understanding of Indian WhatsApp communication, including Hinglish and transcribed voice notes:
- Fluently comprehend: *"Bhaiya", "parcel kar do", "pack kar dena", "ready rakhna", "chahiye", "kitne ka hai", "kal sham 5 baje", "aaj raat 9 baje", "1kg", "urgent delivery"*.
- Intelligent Information Extraction:
  - If a customer says: *"Bhaiya kal sham 5 baje 1kg pineapple cake ready rakhna, delivery Dadar west me chahiye."*
    → Extract: Item = '1kg Pineapple Cake', Time = 'Tomorrow 5:00 PM', Address = 'Dadar West', Fulfillment = 'delivery'.
  - If a customer says: *"Kal subah 11 baje haircut aur facial ke liye appointment fix karo"*
    → Extract: Services = 'Haircut, Facial', Appointment Time = 'Tomorrow 11:00 AM'.
- If the customer communicated in Hinglish, reply warmly in Hinglish (*"Namaste! Aapka order confirm ho gaya hai 🎉"*). If they spoke English, reply strictly in English.

### 🧮 STRICT QUANTITY & ARITHMETIC RULES:
- Carefully extract the EXACT quantity requested by the customer (e.g. "1 paneer sandwich" = EXACTLY 1 quantity; "3 sandwiches" = 3 quantity; "aadha kilo" = 0.5 kg).
- If the customer does not mention a quantity, default to EXACTLY 1.
- Total Amount MUST be calculated mathematically: Total = sum of (Quantity × Price).

### ✨ AESTHETIC & PROFESSIONAL WHATSAPP FORMATTING GUIDELINES:
- **Tone**: Warm, elegant, polished, and attentive like a 5-star concierge.
- **NEVER** sound robotic or informal.
- **Greetings & Menu Inquiries**: When a customer sends a greeting (e.g. "Hi", "Hello", "Hey", "Good morning") or asks about menu, services, or prices, ALWAYS warmly introduce ${businessName} and present the live services/catalog and team cleanly.
- **Focused Follow-ups**: If the customer is in the middle of placing an order or asking a specific inquiry, respond directly and concisely without unnecessarily repeating the whole catalog.
- **Listings**: Always format items cleanly with emojis and bold headers:
  • *Item Name* — ₹Price _(details)_
- **Booking & Order Confirmations**: Format with structured bold labels:
  🎉 *APPOINTMENT CONFIRMED* 🎉
  
  • *Service:* [Service Name] (₹[Price])
  • *Stylist/Staff:* [Staff Name]
  • *Date & Time:* [Date & Time]
  
  💰 *Total Amount:* ₹[Total]
  📍 *Location:* [Store Address]`;
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