import { groq, getGroqClient } from '../config/groq';
import { ENV } from '../config/env';
import { ConversationMessage, Business, BusinessConfig } from '../types/index';

/**
 * Executes a text request against Groq Llama 3.3/3.1 API using system prompt and history
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
    const isUser = msg.sender === 'inbound' || msg.sender === 'customer' || (msg as any).message_direction === 'inbound';
    const role: 'user' | 'assistant' = isUser ? 'user' : 'assistant';
    
    const textContent = msg.message || (msg as any).message_text || '';
    if (formattedHistory.length > 0 && formattedHistory[formattedHistory.length - 1].role === role) {
      formattedHistory[formattedHistory.length - 1].content += `\n${textContent}`;
    } else {
      formattedHistory.push({ role, content: textContent });
    }
  }

  // Append new user message
  if (formattedHistory.length > 0 && formattedHistory[formattedHistory.length - 1].role === 'user') {
    formattedHistory[formattedHistory.length - 1].content += `\n${newMessage}`;
  } else {
    formattedHistory.push({ role: 'user', content: newMessage });
  }

  // Execute with Groq Llama 3.3 / Llama 3.1
  const groqClient = getGroqClient();
  if (groqClient) {
    const groqModels = [
      process.env.GROQ_MODEL,
      'llama-3.1-8b-instant',
      'llama-3.3-70b-versatile',
      'llama3-8b-8192',
      'llama3-70b-8192',
      'gemma2-9b-it',
    ].filter(Boolean) as string[];

    for (const model of groqModels) {
      try {
        console.log(`[Groq AI Service] Requesting model: ${model}...`);
        const completion = await groqClient.chat.completions.create({
          model,
          messages: [
            {
              role: 'system',
              content: `${systemPrompt}\n\n### MANDATORY RULES:\n1. ACCEPT ALL LIVE MENU ITEMS: If the customer orders an item in the live catalog, confirm it immediately.\n2. STRICT DOMAIN GUARDRAIL: Never write code (Python, JS, etc.), do homework, or answer unrelated general queries. Politely refuse and state that you are exclusively the virtual assistant for this business.`,
            },
            ...formattedHistory.map((m) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            })),
          ],
          temperature: 0.2,
          max_tokens: 1024,
        });

        const reply = completion.choices[0]?.message?.content || '';
        if (reply) {
          console.log(`[Groq AI Service] ✅ Generated response (${model}): ${reply.length} chars`);
          return reply;
        }
      } catch (groqErr: any) {
        console.error(`[Groq AI Error] Model "${model}" failed (Status: ${groqErr?.status || 'unknown'}):`, groqErr?.message || groqErr);
      }
    }
  } else {
    console.error(`[Groq AI Error] GROQ_API_KEY is missing or invalid in environment.`);
  }

  // Smart local fallback responses if Groq API is offline or rate limited
  if (business) {
    const configMap: Record<string, any> = {};
    (configs || []).forEach((c) => {
      configMap[c.config_key] = c.config_value;
    });

    const category = business.category || 'store';
    let catalogList = '';

    if (category === 'bakery' && Array.isArray(configMap.menu_items)) {
      catalogList = configMap.menu_items.map((m: any) => `• *${m.name}* — ₹${m.price}${m.unit ? ` (${m.unit})` : ''}`).join('\n');
    } else if (category === 'salon' && Array.isArray(configMap.services)) {
      catalogList = configMap.services.map((s: any) => `• *${s.name}* — ₹${s.price}${s.duration ? ` (${s.duration})` : ''}`).join('\n');
    } else if (category === 'gym' && Array.isArray(configMap.gym_plans)) {
      catalogList = configMap.gym_plans.map((g: any) => `• *${g.name}* — ₹${g.price}${g.duration ? ` (${g.duration})` : ''}`).join('\n');
    } else if (category === 'cafe' && Array.isArray(configMap.cafe_menu)) {
      catalogList = configMap.cafe_menu.map((c: any) => `• *${c.name}* — ₹${c.price}${c.category ? ` (${c.category})` : ''}`).join('\n');
    } else if (category === 'tuition' && Array.isArray(configMap.course_list)) {
      catalogList = configMap.course_list.map((t: any) => `• *${t.name}* — ${t.fee}${t.batch_timing ? ` [${t.batch_timing}]` : ''}`).join('\n');
    }

    const staffList = Array.isArray(configMap.staff) && configMap.staff.length > 0
      ? `\n\n*Our Team:*\n` + configMap.staff.map((s: any) => `• ${s.name}${s.specialty ? ` (${s.specialty})` : ''}`).join('\n')
      : '';

    const hours = configMap.hours ? `\n\n🕒 *Hours:* ${configMap.hours}` : '';

    return `✨ *Welcome to ${business.name}!* ✨\n\nWe're excited to assist you! Here are our ${category === 'salon' ? 'services' : category === 'gym' ? 'membership plans' : 'offerings'}:\n${catalogList || 'Please ask about our available items and pricing.'}${staffList}${hours}\n\nHow can we help you today?`;
  }

  return `Hello! Thank you for reaching out to us on WhatsApp. How can we assist you with our menu, services, or bookings today?`;
}

/**
 * Fallback AI parser to extract structured orders, bookings, or leads
 * if the main conversational response did not include a JSON block.
 */
export async function extractStructuredCapture(
  conversationHistory: ConversationMessage[],
  category: string
): Promise<{ type: string; details: any } | null> {
  if (!ENV.GROQ_API_KEY) return null;

  try {
    const defaultType = category === 'salon' ? 'booking' : category === 'tuition' ? 'lead' : 'order';
    const recentMessages = conversationHistory
      .slice(-6)
      .map((m) => `${m.sender === 'inbound' || m.sender === 'customer' ? 'Customer' : 'Business'}: ${m.message || (m as any).message_text || ''}`)
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

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const content = completion.choices[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      if (parsed.confirmed && parsed.details) {
        return { type: parsed.type || defaultType, details: parsed.details };
      }
    }
  } catch (err: any) {
    console.warn('[AI Capture Extractor Notice]:', err?.message || err);
  }

  return null;
}

