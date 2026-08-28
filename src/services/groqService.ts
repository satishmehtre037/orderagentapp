import { getGroqClient } from '../config/groq';
import { ENV } from '../config/env';
import { ConversationMessage, Business, BusinessConfig } from '../types/index';

/**
 * Groq model cascade.
 *
 * getResponse() previously tried ['qwen/qwen3.6-27b', 'allam-2-7b'] — neither of
 * which Groq serves. Every request 404'd, the loop swallowed the error, and the
 * handler fell through to hardcoded local text. The product looked like it was
 * answering with AI while the AI had never once been reached.
 *
 * These are the slugs Groq actually serves. GROQ_MODEL, when set, is tried first
 * so a newer model can be rolled out without a code change.
 */
const GROQ_MODEL_CASCADE = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.8-27b',
  'groq/compound-mini',
] as const;

function modelCascade(): string[] {
  const configured = ENV.GROQ_MODEL || process.env.GROQ_MODEL || '';
  const models = configured ? [configured, ...GROQ_MODEL_CASCADE] : [...GROQ_MODEL_CASCADE];
  // De-dupe in case GROQ_MODEL is already in the cascade.
  return [...new Set(models)];
}

/**
 * Executes a text request against the Groq API using system prompt and history.
 */
export async function getResponse(
  systemPrompt: string,
  conversationHistory: ConversationMessage[],
  newMessage: string,
  business?: Business,
  configs?: BusinessConfig[]
): Promise<string> {
  // Format historical messages into normalized role format
  const formattedHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  for (const msg of conversationHistory) {
    const isUser =
      msg.sender === 'inbound' || msg.sender === 'customer' || (msg as any).message_direction === 'inbound';
    const role: 'user' | 'assistant' = isUser ? 'user' : 'assistant';

    const textContent = msg.message || (msg as any).message_text || '';
    if (formattedHistory.length > 0 && formattedHistory[formattedHistory.length - 1].role === role) {
      formattedHistory[formattedHistory.length - 1].content += `\n${textContent}`;
    } else {
      formattedHistory.push({ role, content: textContent });
    }
  }

  // Append new user message (avoid duplicating if already present in history)
  const lastMsg = formattedHistory[formattedHistory.length - 1];
  if (!lastMsg || lastMsg.role !== 'user' || !lastMsg.content.includes(newMessage)) {
    if (lastMsg && lastMsg.role === 'user') {
      lastMsg.content += `\n${newMessage}`;
    } else {
      formattedHistory.push({ role: 'user', content: newMessage });
    }
  }

  const groqClient = getGroqClient();
  const failures: string[] = [];

  if (groqClient) {
    for (const model of modelCascade()) {
      try {
        console.log(`[Groq AI Service] Requesting model: ${model}...`);
        const completion = await groqClient.chat.completions.create({
          model,
          messages: [
            {
              role: 'system',
              content: `${systemPrompt}\n\n### MANDATORY RULES:\n1. ACCEPT ALL LIVE MENU & SERVICE ITEMS: If the customer asks to book an appointment, checkup, or service, confirm the slot, date, time, and details immediately.\n2. When user provides date/time (e.g. "20 august 2 pm"), CONFIRM the appointment warmly and append the JSON capture block.\n3. NEVER INVENT FACTS: do not state a phone number, token number, address, price, or timing that is not present in the business information above. If you don't have it, say you'll have the team confirm.\n4. STRICT DOMAIN GUARDRAIL: Never write code (Python, JS, etc.), do homework, or answer unrelated general queries. Politely refuse and state that you are exclusively the virtual assistant for this business.`,
            },
            ...formattedHistory.map((m) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            })),
          ],
          temperature: 0.2,
          max_tokens: 650,
        });

        const reply = cleanLLMOutput(completion.choices[0]?.message?.content || '');

        if (reply) {
          console.log(`[Groq AI Service] ✅ Generated response (${model}): ${reply.length} chars`);
          return reply;
        }
        failures.push(`${model}: empty response`);
      } catch (groqErr: any) {
        const detail = `${model}: ${groqErr?.status || '?'} ${groqErr?.message || groqErr}`;
        failures.push(detail);
        console.error(`[Groq AI Error] ${detail}`);
      }
    }
  } else {
    failures.push('GROQ_API_KEY missing or invalid');
  }

  // Every model failed. This is a real outage, not a normal code path — say so
  // loudly rather than quietly serving invented content as if it were AI output.
  console.error(
    `[Groq AI Service] ❌ ALL MODELS FAILED for ${business?.name || 'unknown business'}. ` +
      `Serving a safe catalogue reply. Failures: ${failures.join(' | ')}`
  );

  return buildSafeFallbackReply(newMessage, business, configs);
}

/**
 * The degraded reply used only when Groq is unreachable.
 *
 * It states nothing it cannot source from business_config. The previous version
 * invented an emergency hotline ("+91 98765 43210"), an emergency wing location,
 * and an OPD token number (`#OPD-${Math.floor(Math.random() * 30) + 1}`) — a
 * random integer presented to a patient as their queue position.
 */
function buildSafeFallbackReply(
  newMessage: string,
  business?: Business,
  configs?: BusinessConfig[]
): string {
  if (!business) {
    return `Hello! Thanks for reaching out. Our assistant is temporarily unavailable — a member of our team will reply to you shortly. 🙏`;
  }

  const configMap: Record<string, any> = {};
  (configs || []).forEach((c) => {
    configMap[c.config_key] = c.config_value;
  });

  const category = business.category || 'store';
  const lowerMsg = (newMessage || '').toLowerCase();

  // Emergency: route to numbers we can actually stand behind — the tenant's own
  // configured contact, plus India's national emergency lines.
  if (lowerMsg.includes('emergency') || lowerMsg.includes('urgent') || lowerMsg.includes('ambulance')) {
    const configured =
      configMap.emergency_contact || configMap.emergency_number || configMap.phone || configMap.contact_number;

    const lines = [`🚨 *Emergency — ${business.name}*`, ''];
    if (configured) {
      lines.push(`📞 *${business.name}:* ${configured}`);
    }
    lines.push(`📞 *Ambulance (national):* 108`, `📞 *Emergency services:* 112`, '');
    lines.push(`If this is a medical emergency, please call now rather than waiting for a reply here.`);
    return lines.join('\n');
  }

  let catalogList = '';

  if (category === 'bakery' && Array.isArray(configMap.menu_items)) {
    catalogList = configMap.menu_items
      .map((m: any) => `• *${m.name}* — ₹${m.price}${m.unit ? ` (${m.unit})` : ''}`)
      .join('\n');
  } else if (
    (category === 'salon' ||
      category === 'clinic' ||
      category === 'hospital' ||
      category === 'custom' ||
      category === 'real_estate' ||
      category === 'ca_firm') &&
    Array.isArray(configMap.services)
  ) {
    catalogList = configMap.services
      .map((s: any) => `• *${s.name}* — ₹${s.price}${s.duration ? ` (${s.duration})` : ''}`)
      .join('\n');
  } else if (category === 'gym' && Array.isArray(configMap.gym_plans)) {
    catalogList = configMap.gym_plans
      .map((g: any) => `• *${g.name}* — ₹${g.price}${g.duration ? ` (${g.duration})` : ''}`)
      .join('\n');
  } else if (category === 'cafe' && Array.isArray(configMap.cafe_menu)) {
    catalogList = configMap.cafe_menu
      .map((c: any) => `• *${c.name}* — ₹${c.price}${c.category ? ` (${c.category})` : ''}`)
      .join('\n');
  } else if (category === 'tuition' && Array.isArray(configMap.course_list)) {
    catalogList = configMap.course_list
      .map((t: any) => `• *${t.name}* — ${t.fee}${t.batch_timing ? ` [${t.batch_timing}]` : ''}`)
      .join('\n');
  } else if (category === 'retail' && Array.isArray(configMap.menu_items)) {
    catalogList = configMap.menu_items.map((m: any) => `• *${m.name}* — ₹${m.price}`).join('\n');
  }

  const staffList =
    Array.isArray(configMap.staff) && configMap.staff.length > 0
      ? `\n\n*Our Team:*\n` +
        configMap.staff.map((s: any) => `• ${s.name}${s.specialty ? ` (${s.specialty})` : ''}`).join('\n')
      : '';

  const hours = configMap.hours ? `\n\n🕒 *Hours:* ${configMap.hours}` : '';

  // No fabricated confirmations. A booking is not confirmed just because the
  // customer named a time — the team confirms it.
  return (
    `✨ *${business.name}* ✨\n\n` +
    `Thanks for your message! Our AI assistant is briefly unavailable, so a team member will confirm the details with you shortly.` +
    (catalogList ? `\n\nIn the meantime, here's what we offer:\n${catalogList}` : '') +
    staffList +
    hours
  );
}

/**
 * Fallback AI parser to extract structured orders, bookings, or leads
 * if the main conversational response did not include a JSON block.
 */
export async function extractStructuredCapture(
  conversationHistory: ConversationMessage[],
  category: string
): Promise<{ type: string; details: any } | null> {
  const groqClient = getGroqClient();
  if (!groqClient) return null;

  const defaultType = category === 'salon' ? 'booking' : category === 'tuition' ? 'lead' : 'order';
  const recentMessages = conversationHistory
    .slice(-6)
    .map(
      (m) =>
        `${m.sender === 'inbound' || m.sender === 'customer' ? 'Customer' : 'Business'}: ${
          m.message || (m as any).message_text || ''
        }`
    )
    .join('\n');

  const prompt = `Analyze this WhatsApp conversation between a customer and a ${category} business.
Did the customer confirm an order, book an appointment, or submit their student details?
If YES, output ONLY a valid JSON object in this exact format:
{
  "confirmed": true,
  "type": "${defaultType}",
  "details": {
    "items": [{"name": "Item or service name", "quantity": 1, "price": 100}],
    "total": 100,
    "fulfillment": "delivery or pickup or in-store",
    "delivery_address": "address if given",
    "notes": "Any special notes"
  }
}
If NO or just general inquiry, output ONLY:
{"confirmed": false}

Conversation:
${recentMessages}`;

  // Same cascade as getResponse — this used to hardcode 'qwen/qwen3.6-27b',
  // so structured capture never ran at all.
  for (const model of modelCascade()) {
    try {
      const completion = await groqClient.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) continue;

      const parsed = JSON.parse(content);
      if (parsed.confirmed && parsed.details) {
        return { type: parsed.type || defaultType, details: parsed.details };
      }
      // A valid "not confirmed" answer — no need to try further models.
      return null;
    } catch (err: any) {
      console.warn(`[AI Capture Extractor] Model ${model} failed: ${err?.message || err}`);
    }
  }

  console.error('[AI Capture Extractor] ❌ All models failed — no capture extracted.');
  return null;
}

export function cleanLLMOutput(raw: string): string {
  if (!raw) return '';
  let cleaned = raw.trim();

  // 1. Remove <think>...</think> XML blocks
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // 2. Remove markdown reasoning headings and chain-of-thought analysis
  cleaned = cleaned.replace(/\*\*Reasoning[\s\S]*?\*\*Demo Message[^\n]*\n+/gi, '').trim();
  cleaned = cleaned.replace(/\*\*Reasoning[\s\S]*?\n(?=>|Namaste|Hello|Thank you|Dear|Hi)/gi, '').trim();
  cleaned = cleaned
    .replace(
      /^(?:\*\*Reasoning.*?\*\*|\*\*Thought.*?\*\*|\*\*Approach.*?\*\*)[\s\S]*?(?=(?:Namaste|Hello|Thank you|Dear|Hi|\*|\n\n[A-Z]))/gi,
      ''
    )
    .trim();

  // 3. Strip quote symbols '>' at line starts if LLM wrapped output in blockquote
  cleaned = cleaned.replace(/^>\s?/gm, '').trim();

  // 4. Remove trailing meta-notes like "*After the prospect replies...*"
  cleaned = cleaned.replace(/\*After the (?:prospect|client|user) replies[\s\S]*?\*/gi, '').trim();

  return cleaned;
}

/**
 * Direct chat completion against Groq models with dynamic fallback cascade.
 * Throws when every model fails — callers must handle that rather than
 * substituting invented content.
 */
export async function getGroqChatCompletion(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  const groqClient = getGroqClient();
  if (!groqClient) {
    throw new Error('Groq client not initialized — GROQ_API_KEY is missing or invalid.');
  }

  const failures: string[] = [];

  for (const model of modelCascade()) {
    try {
      const completion = await groqClient.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content:
              'CRITICAL INSTRUCTION: Output ONLY the final customer-facing WhatsApp message. Never output reasoning, thoughts, numbered steps, or markdown explanations. Never invent phone numbers, prices, addresses, or reference numbers.',
          },
          ...messages,
        ],
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxTokens ?? 650,
      });

      const reply = cleanLLMOutput(completion.choices[0]?.message?.content || '');
      if (reply) return reply;
      failures.push(`${model}: empty response`);
    } catch (err: any) {
      failures.push(`${model}: ${err?.message || err}`);
      console.warn(`[Groq AI] Model ${model} failed (${err?.message}). Trying next...`);
    }
  }

  throw new Error(`All Groq models failed: ${failures.join(' | ')}`);
}
