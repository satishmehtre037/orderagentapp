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

  // Append new user message (avoid duplicating if already present in history)
  const lastMsg = formattedHistory[formattedHistory.length - 1];
  if (!lastMsg || lastMsg.role !== 'user' || !lastMsg.content.includes(newMessage)) {
    if (lastMsg && lastMsg.role === 'user') {
      lastMsg.content += `\n${newMessage}`;
    } else {
      formattedHistory.push({ role: 'user', content: newMessage });
    }
  }

  // Execute with Groq Llama 3.3 / Llama 3.1
  const groqClient = getGroqClient();
  if (groqClient) {
    const groqModels = [
      process.env.GROQ_MODEL,
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
      'qwen/qwen3.6-27b',
    ].filter(Boolean) as string[];

    for (const model of groqModels) {
      try {
        console.log(`[Groq AI Service] Requesting model: ${model}...`);
        const completion = await groqClient.chat.completions.create({
          model,
          messages: [
            {
              role: 'system',
              content: `${systemPrompt}\n\n### MANDATORY RULES:\n1. ACCEPT ALL LIVE MENU & SERVICE ITEMS: If the customer asks to book an appointment, checkup, or service, confirm the slot, date, time, and details immediately.\n2. When user provides date/time (e.g. "20 august 2 pm"), CONFIRM the appointment warmly and append the JSON capture block.\n3. EMERGENCY RESPONSE: If the patient/customer mentions an emergency or urgent medical care, immediately provide the 24/7 Hospital Emergency Hotline number and ask them to visit the Emergency Care Wing immediately.\n4. STRICT DOMAIN GUARDRAIL: Never write code (Python, JS, etc.), do homework, or answer unrelated general queries. Politely refuse and state that you are exclusively the virtual assistant for this business.`,
            },
            ...formattedHistory.map((m) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            })),
          ],
          temperature: 0.2,
          max_tokens: 1024,
        });

        let reply = completion.choices[0]?.message?.content || '';
        // Strip any thinking tags from reasoning models
        reply = reply.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

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
    const lowerMsg = newMessage.toLowerCase();

    // Check emergency first
    if (lowerMsg.includes('emergency') || lowerMsg.includes('urgent') || lowerMsg.includes('ambulance')) {
      return `🚨 *EMERGENCY RESPONSE — ${business.name}* 🚨\n\nIf this is a medical emergency, please call our 24/7 Emergency Line immediately:\n📞 *Emergency Hotline:* +91 98765 43210 / 108\n📍 *Emergency Wing:* Ground Floor, Casualty & Trauma Center\n\nOur trauma & critical care team is on standby 24/7.`;
    }

    // Check if the user is answering date/time or requesting an appointment
    const isDateTimeOrBooking =
      lowerMsg.includes('am') ||
      lowerMsg.includes('pm') ||
      lowerMsg.includes('august') ||
      lowerMsg.includes('september') ||
      lowerMsg.includes('october') ||
      lowerMsg.includes('november') ||
      lowerMsg.includes('december') ||
      lowerMsg.includes('tomorrow') ||
      lowerMsg.includes('today') ||
      lowerMsg.includes('clock') ||
      /\b\d{1,2}(:\d{2})?\s*(am|pm)?\b/i.test(lowerMsg);

    if (isDateTimeOrBooking && formattedHistory.length > 1) {
      if (category === 'hospital' || category === 'clinic') {
        return `✅ *Appointment Confirmed!*\n\nThank you for choosing *${business.name}*.\nWe have scheduled your consultation for: *${newMessage}*.\n\n🎟️ *Token Number:* #OPD-${Math.floor(Math.random() * 30) + 1}\n📍 *Location:* Main OPD Consultation Wing\n\nPlease arrive 10 minutes prior to your slot. If you need any assistance, feel free to message us here!`;
      } else if (category === 'salon') {
        return `✅ *Appointment Confirmed!*\n\nThank you for choosing *${business.name}*.\nYour slot has been reserved for: *${newMessage}*.\n\nWe look forward to pampering you!`;
      } else {
        return `✅ *Request Confirmed!*\n\nThank you for choosing *${business.name}*.\nYour request for *${newMessage}* has been received and confirmed.`;
      }
    }

    let catalogList = '';

    if (category === 'bakery' && Array.isArray(configMap.menu_items)) {
      catalogList = configMap.menu_items.map((m: any) => `• *${m.name}* — ₹${m.price}${m.unit ? ` (${m.unit})` : ''}`).join('\n');
    } else if ((category === 'salon' || category === 'clinic' || category === 'hospital' || category === 'custom' || category === 'real_estate' || category === 'ca_firm') && Array.isArray(configMap.services)) {
      catalogList = configMap.services.map((s: any) => `• *${s.name}* — ₹${s.price}${s.duration ? ` (${s.duration})` : ''}`).join('\n');
    } else if (category === 'gym' && Array.isArray(configMap.gym_plans)) {
      catalogList = configMap.gym_plans.map((g: any) => `• *${g.name}* — ₹${g.price}${g.duration ? ` (${g.duration})` : ''}`).join('\n');
    } else if (category === 'cafe' && Array.isArray(configMap.cafe_menu)) {
      catalogList = configMap.cafe_menu.map((c: any) => `• *${c.name}* — ₹${c.price}${c.category ? ` (${c.category})` : ''}`).join('\n');
    } else if (category === 'tuition' && Array.isArray(configMap.course_list)) {
      catalogList = configMap.course_list.map((t: any) => `• *${t.name}* — ${t.fee}${t.batch_timing ? ` [${t.batch_timing}]` : ''}`).join('\n');
    } else if (category === 'retail' && Array.isArray(configMap.menu_items)) {
      catalogList = configMap.menu_items.map((m: any) => `• *${m.name}* — ₹${m.price}`).join('\n');
    }

    const staffList = Array.isArray(configMap.staff) && configMap.staff.length > 0
      ? `\n\n*Our Team:*\n` + configMap.staff.map((s: any) => `• ${s.name}${s.specialty ? ` (${s.specialty})` : ''}`).join('\n')
      : '';

    const hours = configMap.hours ? `\n\n🕒 *Hours:* ${configMap.hours}` : '';

    return `✨ *Welcome to ${business.name}!* ✨\n\nWe're excited to assist you! Here are our ${category === 'salon' || category === 'clinic' || category === 'hospital' ? 'consultations & services' : category === 'gym' ? 'membership plans' : 'offerings'}:\n${catalogList || 'Please ask about our available items, doctor consultations, and timings.'}${staffList}${hours}\n\nHow can we help you today?`;
  }

  return `Hello! Thank you for reaching out to us on WhatsApp. How can we assist you with our services or bookings today?`;
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
      model: 'openai/gpt-oss-120b',
      messages: [{ role: 'user', content: prompt }],
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

/**
 * Direct chat completion against Groq models with dynamic fallback cascade
 */
export async function getGroqChatCompletion(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  const groqClient = getGroqClient();
  if (!groqClient) {
    throw new Error('Groq client not initialized');
  }

  const groqModels = [
    process.env.GROQ_MODEL,
    'qwen/qwen2.5-27b',
    'groq/compound',
    'groq/compound-mini',
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'llama3-8b-8192',
  ].filter(Boolean) as string[];

  for (const model of groqModels) {
    try {
      const completion = await groqClient.chat.completions.create({
        model,
        messages,
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxTokens ?? 1024,
      });

      const reply = completion.choices[0]?.message?.content?.trim();
      if (reply) return reply;
    } catch (err: any) {
      console.warn(`[Groq AI] Model ${model} failed (${err.message}). Trying next...`);
    }
  }

  throw new Error('All Groq models failed');
}


