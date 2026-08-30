import { ENV } from '../config/env';
import { ConversationMessage, Business, BusinessConfig, CapturedPayload, CaptureType } from '../types/index';
import * as groqService from './groqService';

/**
 * Claude & AgentRouter Service
 * 
 * Provides primary LLM routing to Anthropic Claude (via AgentRouter or direct Anthropic API)
 * with automated, zero-downtime fallback to Groq (Llama 3.3 70B) if quota is exhausted.
 */

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Direct request to AgentRouter (supporting both OpenAI /v1/chat/completions for GLM/GPT and Anthropic /v1/messages for Claude)
 */
async function callAgentRouterAPI(
  systemPrompt: string,
  messages: ClaudeMessage[],
  options: { temperature?: number; maxTokens?: number; model?: string } = {}
): Promise<string> {
  const token = ENV.ANTHROPIC_AUTH_TOKEN;
  if (!token) {
    throw new Error('ANTHROPIC_AUTH_TOKEN / AgentRouter token is not configured in environment.');
  }

  const baseUrl = (ENV.ANTHROPIC_BASE_URL || 'https://agentrouter.org').replace(/\/+$/, '');
  const model = options.model || ENV.ANTHROPIC_MODEL || 'glm-5.3';

  // Sanitize messages
  const sanitizedMessages: ClaudeMessage[] = [];
  for (const m of messages) {
    if (!m.content || !m.content.trim()) continue;
    const last = sanitizedMessages[sanitizedMessages.length - 1];
    if (last && last.role === m.role) {
      last.content += `\n${m.content}`;
    } else {
      sanitizedMessages.push({ role: m.role, content: m.content });
    }
  }

  if (sanitizedMessages.length === 0) {
    sanitizedMessages.push({ role: 'user', content: 'Hello' });
  }

  if (sanitizedMessages[0].role === 'assistant') {
    sanitizedMessages.unshift({ role: 'user', content: 'Hi' });
  }

  const isOpenAiStandard =
    baseUrl.includes('/v1') ||
    baseUrl.includes('/v4') ||
    baseUrl.includes('kiraai.vn') ||
    baseUrl.includes('bigmodel.cn') ||
    baseUrl.includes('openai.com');

  // 1. Direct OpenAI Chat Completions Protocol (for Kira AI, BigModel, OpenAI endpoints)
  if (isOpenAiStandard) {
    const chatUrl = baseUrl.endsWith('/chat/completions')
      ? baseUrl
      : `${baseUrl}/chat/completions`;

    console.log(`[AI Service] Requesting model: ${model} via OpenAI gateway ${chatUrl}...`);

    const openAiMessages = [
      { role: 'system', content: systemPrompt },
      ...sanitizedMessages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const res = await fetch(chatUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        model,
        messages: openAiMessages,
        temperature: options.temperature ?? 0.2,
        max_tokens: options.maxTokens ?? 1024,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`OpenAI-compatible API (${chatUrl}) returned HTTP ${res.status}: ${errText || res.statusText}`);
    }

    const data = await res.json();
    const textContent = data?.choices?.[0]?.message?.content?.trim();
    if (!textContent) throw new Error('API returned empty choices response.');
    return groqService.cleanLLMOutput(textContent);
  }

  console.log(`[AgentRouter] Requesting model: ${model} via ${baseUrl}/v1/messages...`);

  // 2. Anthropic Messages Protocol (/v1/messages) — standard on AgentRouter for GLM-5.3 & Claude
  try {
    const res = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': token,
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'cline/1.0.0',
      },
      body: JSON.stringify({
        model,
        system: systemPrompt,
        messages: sanitizedMessages,
        temperature: options.temperature ?? 0.2,
        max_tokens: options.maxTokens ?? 1024,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (res.ok) {
      const data = await res.json();
      const textContent = data?.content
        ?.filter((c: any) => c.type === 'text')
        ?.map((c: any) => c.text)
        ?.join('\n')
        ?.trim();

      if (textContent) {
        return groqService.cleanLLMOutput(textContent);
      }
    } else {
      const errText = await res.text().catch(() => '');
      console.warn(`[AgentRouter /v1/messages HTTP ${res.status}]: ${errText.slice(0, 150)}`);
    }
  } catch (err: any) {
    console.warn(`[AgentRouter /v1/messages Error]: ${err?.message || err}`);
  }

  // 3. Fallback: AgentRouter OpenAI Chat Completions Protocol (/v1/chat/completions)
  console.log(`[AgentRouter] Falling back to ${baseUrl}/v1/chat/completions...`);
  const openAiMessages = [
    { role: 'system', content: systemPrompt },
    ...sanitizedMessages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'User-Agent': 'cline/1.0.0',
    },
    body: JSON.stringify({
      model,
      messages: openAiMessages,
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? 1024,
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`AgentRouter API returned HTTP ${res.status}: ${errorText || res.statusText}`);
  }

  const data = await res.json();
  const textContent = data?.choices?.[0]?.message?.content?.trim();
  if (!textContent) throw new Error('AgentRouter API returned empty response.');
  return groqService.cleanLLMOutput(textContent);
}

/**
 * Main conversational response entry point with automated AgentRouter (GLM / Claude) -> Groq fallback cascade
 */
export async function getResponse(
  systemPrompt: string,
  conversationHistory: ConversationMessage[],
  newMessage: string,
  business?: Business,
  configs?: BusinessConfig[]
): Promise<string> {
  const provider = (ENV.AI_PROVIDER || 'auto').toLowerCase();

  // If explicitly configured to use Groq, auto, or fast, delegate immediately to Groq LPU
  if (provider === 'groq' || provider === 'auto' || provider === 'fast') {
    return groqService.getResponse(systemPrompt, conversationHistory, newMessage, business, configs);
  }

  // Format history
  const formattedHistory: ClaudeMessage[] = [];
  for (const msg of conversationHistory) {
    const isUser =
      msg.sender === 'inbound' || msg.sender === 'customer' || (msg as any).message_direction === 'inbound';
    const role: 'user' | 'assistant' = isUser ? 'user' : 'assistant';
    const textContent = msg.message || (msg as any).message_text || '';
    if (textContent.trim()) {
      formattedHistory.push({ role, content: textContent });
    }
  }

  // Append new user message
  const lastMsg = formattedHistory[formattedHistory.length - 1];
  if (!lastMsg || lastMsg.role !== 'user' || !lastMsg.content.includes(newMessage)) {
    if (lastMsg && lastMsg.role === 'user') {
      lastMsg.content += `\n${newMessage}`;
    } else {
      formattedHistory.push({ role: 'user', content: newMessage });
    }
  }

  // Mandatory system guardrail block
  const fullSystemPrompt = `${systemPrompt}\n\n### MANDATORY RULES:\n1. ACCEPT ALL LIVE MENU & SERVICE ITEMS: If the customer asks to book an appointment, checkup, or service, confirm the slot, date, time, and details immediately.\n2. When user provides date/time (e.g. "20 august 2 pm"), CONFIRM the appointment warmly and append the JSON capture block.\n3. NEVER INVENT FACTS: do not state a phone number, token number, address, price, or timing that is not present in the business information above. If you don't have it, say you'll have the team confirm.\n4. STRICT DOMAIN GUARDRAIL: Never write code (Python, JS, etc.), do homework, or answer unrelated general queries. Politely refuse and state that you are exclusively the virtual assistant for this business.`;

  // 1. Try AgentRouter (GLM-5.3 / Claude) Primary
  if (ENV.ANTHROPIC_AUTH_TOKEN) {
    try {
      const response = await callAgentRouterAPI(fullSystemPrompt, formattedHistory);
      console.log(`[AgentRouter] ✅ Response generated successfully (${response.length} chars).`);
      return response;
    } catch (err: any) {
      console.warn(`[AgentRouter Warning] Primary AgentRouter call failed (${err?.message || err}). Falling back to Groq...`);
    }
  } else {
    console.log('[AI Router] AgentRouter token not set, using Groq as primary.');
  }

  // 2. Automated Fallback to Groq LPU
  return groqService.getResponse(systemPrompt, conversationHistory, newMessage, business, configs);
}

/**
 * General chat completion with Claude -> Groq fallback (used by CA & Hospital engines)
 */
export async function getChatCompletion(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  const systemMessage = messages.find((m) => m.role === 'system')?.content || '';
  const chatMessages: ClaudeMessage[] = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  if (ENV.ANTHROPIC_AUTH_TOKEN) {
    try {
      return await callAgentRouterAPI(systemMessage, chatMessages, options);
    } catch (err: any) {
      console.warn(`[AgentRouter Warning] Chat completion failed (${err?.message || err}). Falling back to Groq...`);
    }
  }

  return groqService.getGroqChatCompletion(messages, options);
}

/**
 * Extraction of structured JSON capture blocks from conversation history
 */
export async function extractStructuredCapture(
  conversationHistory: ConversationMessage[],
  category: string
): Promise<{ type: string; details: any } | null> {
  return groqService.extractStructuredCapture(conversationHistory, category);
}
