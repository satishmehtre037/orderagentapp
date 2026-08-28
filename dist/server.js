var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/config/env.ts
var env_exports = {};
__export(env_exports, {
  ENV: () => ENV
});
import dotenv from "dotenv";
var ENV, requiredEnvVars, missingVars;
var init_env = __esm({
  "src/config/env.ts"() {
    dotenv.config({ path: ".env", override: true });
    dotenv.config({ path: ".env.local", override: true });
    ENV = {
      SUPABASE_URL: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || "",
      GROQ_API_KEY: process.env.GROQ_API_KEY || "",
      /** Primary Groq model. Must be a slug Groq actually serves — see groqService. */
      GROQ_MODEL: process.env.GROQ_MODEL || "",
      WHATSAPP_CLOUD_API_TOKEN: process.env.WHATSAPP_CLOUD_API_TOKEN || "",
      WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
      WHATSAPP_VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN || "",
      /** Meta App Secret — used to validate the x-hub-signature-256 webhook header. */
      WHATSAPP_APP_SECRET: process.env.WHATSAPP_APP_SECRET || "",
      /** The business WhatsApp number Meta sends from (display number, digits only). */
      WHATSAPP_BUSINESS_NUMBER: (process.env.WHATSAPP_BUSINESS_NUMBER || "").replace(/\D/g, ""),
      /** Operator number that receives inbound-lead alerts. Empty = alerts disabled. */
      ADMIN_ALERT_NUMBER: (process.env.ADMIN_ALERT_NUMBER || "").replace(/\D/g, ""),
      /** Google Places API key. Without it, lead sourcing is disabled (never faked). */
      GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY || "",
      RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || "",
      RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || "",
      /**
       * Razorpay plan id for the ₹999/mo subscription. Left empty when unset: this
       * used to default to 'plan_monthly_999_bizbot', an id Razorpay has never
       * issued, so subscription creation failed with an opaque API error instead of
       * saying the plan id was missing.
       */
      RAZORPAY_PLAN_ID: process.env.RAZORPAY_PLAN_ID || "",
      RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || "",
      /** Anthropic / AgentRouter API Key or Bearer Token */
      ANTHROPIC_AUTH_TOKEN: process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_API_KEY || "sk-YC1gMWBHv5joaFyRGVJ0TGedqQjmcYQ3F1IO1uQnssJSIi3s",
      /** Anthropic Base URL (e.g. https://agentrouter.org or https://api.anthropic.com) */
      ANTHROPIC_BASE_URL: (process.env.ANTHROPIC_BASE_URL || "https://agentrouter.org").replace(/\/+$/, ""),
      /** AgentRouter / Model slug (e.g. glm-5.3, claude-3-5-sonnet-20241022) */
      ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL || "glm-5.3",
      /** Preferred AI Provider: 'agentrouter', 'claude', 'groq', or 'auto' */
      AI_PROVIDER: process.env.AI_PROVIDER || "agentrouter",
      PORT: parseInt(process.env.PORT || "3001", 10)
    };
    requiredEnvVars = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
    missingVars = requiredEnvVars.filter((key) => !ENV[key]);
    if (!ENV.GROQ_API_KEY) {
      console.warn(`\u26A0\uFE0F [Config Warning] GROQ_API_KEY is not set in .env.`);
    }
    if (!ENV.WHATSAPP_VERIFY_TOKEN) {
      console.warn(
        `\u26A0\uFE0F [Config Warning] WHATSAPP_VERIFY_TOKEN is not set. Meta webhook verification will be REJECTED until it is.`
      );
    }
    if (!ENV.WHATSAPP_APP_SECRET) {
      console.warn(
        `\u26A0\uFE0F [Config Warning] WHATSAPP_APP_SECRET is not set. Inbound webhook payload signatures cannot be verified.`
      );
    }
    if (missingVars.length > 0) {
      console.warn(`\u26A0\uFE0F [Config Warning] Missing environment variables: ${missingVars.join(", ")}. Set them in .env.`);
    }
  }
});

// src/config/groq.ts
var groq_exports = {};
__export(groq_exports, {
  getGroqClient: () => getGroqClient,
  groq: () => groq
});
import { Groq } from "groq-sdk";
function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY || ENV.GROQ_API_KEY;
  if (!apiKey || apiKey === "placeholder-api-key") {
    return null;
  }
  return new Groq({ apiKey });
}
var groq;
var init_groq = __esm({
  "src/config/groq.ts"() {
    init_env();
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY || ENV.GROQ_API_KEY || "placeholder-api-key"
    });
  }
});

// src/server.ts
init_env();
import express from "express";
import cors from "cors";

// src/routes/health.ts
import { Router } from "express";
var router = Router();
router.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
router.get("/health/config", (_req, res) => {
  const groqKey = process.env.GROQ_API_KEY || "";
  res.json({
    status: "ok",
    hasGroqKey: Boolean(groqKey && groqKey !== "placeholder-api-key"),
    groqKeyPrefix: groqKey ? `${groqKey.slice(0, 6)}...` : "MISSING",
    hasSupabaseKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    hasWhatsappToken: Boolean(process.env.WHATSAPP_CLOUD_API_TOKEN),
    nodeEnv: process.env.NODE_ENV || "production",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
router.get("/test-groq", async (_req, res) => {
  try {
    const { getGroqClient: getGroqClient2 } = await Promise.resolve().then(() => (init_groq(), groq_exports));
    const groqClient = getGroqClient2();
    if (!groqClient) {
      return res.status(500).json({ error: "Groq client failed to initialize. Check GROQ_API_KEY." });
    }
    let availableModels = [];
    let listError = null;
    try {
      const modelsList = await groqClient.models.list();
      availableModels = (modelsList.data || []).map((m) => m.id);
    } catch (listErr) {
      listError = listErr?.message || String(listErr);
    }
    if (availableModels.length === 0) {
      return res.json({
        success: false,
        error: "No models found for this Groq API Key.",
        listError,
        groqKeyPrefix: (process.env.GROQ_API_KEY || "").slice(0, 8),
        tip: "Please generate a standard free API Key at https://console.groq.com/keys and update GROQ_API_KEY in Render environment variables."
      });
    }
    const priorityModels = [
      "qwen/qwen2.5-27b",
      "groq/compound",
      "groq/compound-mini",
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
      "llama3-8b-8192"
    ];
    const modelToUse = priorityModels.find((m) => availableModels.includes(m)) || availableModels[0];
    const completion = await groqClient.chat.completions.create({
      model: modelToUse,
      messages: [
        { role: "user", content: 'Say "Groq AI is active and operational!"' }
      ],
      max_tokens: 30
    });
    return res.json({
      success: true,
      modelUsed: modelToUse,
      availableModelsCount: availableModels.length,
      availableModels,
      response: completion.choices[0]?.message?.content
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err?.message || err,
      status: err?.status,
      code: err?.code
    });
  }
});
router.get("/test-agentrouter", async (_req, res) => {
  try {
    const { ENV: ENV2 } = await Promise.resolve().then(() => (init_env(), env_exports));
    const token = ENV2.ANTHROPIC_AUTH_TOKEN || "sk-YC1gMWBHv5joaFyRGVJ0TGedqQjmcYQ3F1IO1uQnssJSIi3s";
    const baseUrl = (ENV2.ANTHROPIC_BASE_URL || "https://agentrouter.org").replace(/\/+$/, "");
    const model = ENV2.ANTHROPIC_MODEL || "glm-5.3";
    const testPayload = {
      model,
      messages: [
        { role: "system", content: "You are a test assistant." },
        { role: "user", content: 'Say "AgentRouter GLM-5.3 is connected and working!"' }
      ],
      temperature: 0.1,
      max_tokens: 50
    };
    const startTime = Date.now();
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "User-Agent": "cline/1.0.0"
      },
      body: JSON.stringify(testPayload),
      signal: AbortSignal.timeout(15e3)
    });
    const elapsedMs = Date.now() - startTime;
    const status = response.status;
    const headers = Object.fromEntries(response.headers.entries());
    const rawText = await response.text();
    let jsonBody = null;
    try {
      jsonBody = JSON.parse(rawText);
    } catch {
      jsonBody = rawText;
    }
    return res.status(response.ok ? 200 : 502).json({
      success: response.ok,
      status,
      elapsedMs,
      tokenPrefix: token.slice(0, 10) + "...",
      baseUrl,
      model,
      headers: {
        "cf-ray": headers["cf-ray"],
        "content-type": headers["content-type"],
        "x-request-id": headers["x-request-id"] || headers["request-id"]
      },
      body: jsonBody
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err?.message || String(err),
      stack: err?.stack
    });
  }
});
router.get("/", (_req, res) => {
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>BizBot OS | Backend Core Engine</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background-color: #FBF9F4;
          color: #1A1A1A;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          padding: 20px;
        }
        .card {
          background: #FFFFFF;
          border: 2px solid #E5DFD3;
          border-radius: 12px;
          padding: 32px;
          max-width: 550px;
          box-shadow: 0 4px 12px rgba(15, 61, 62, 0.08);
        }
        .badge {
          display: inline-block;
          background: #E0EBE9;
          color: #0F3D3E;
          font-weight: bold;
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 12px;
        }
        h1 {
          font-size: 24px;
          color: #0F3D3E;
          margin: 0 0 8px 0;
        }
        p {
          font-size: 14px;
          color: #666666;
          line-height: 1.5;
          margin-bottom: 24px;
        }
        .links {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .btn {
          display: block;
          text-align: center;
          background: #0F3D3E;
          color: #FFFFFF;
          text-decoration: none;
          padding: 12px 20px;
          border-radius: 6px;
          font-weight: bold;
          font-size: 14px;
          transition: background 0.2s;
        }
        .btn:hover {
          background: #145253;
        }
        .btn-outline {
          background: transparent;
          color: #0F3D3E;
          border: 1.5px solid #0F3D3E;
        }
        .btn-outline:hover {
          background: #E0EBE9;
        }
        .footer {
          margin-top: 24px;
          font-size: 12px;
          color: #888888;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <span class="badge">\u25CF Server Active (Port 3002)</span>
        <h1>BizBot OS Backend Engine</h1>
        <p>This is the Node.js/Express API server providing Meta WhatsApp webhooks, Razorpay billing integrations, and Groq Llama 3.3 AI prompt processing.</p>
        
        <div class="links">
          <a href="http://localhost:3004/dashboard" class="btn">Go to Next.js Owner Portal (Port 3004) &rarr;</a>
          <a href="/health" class="btn btn-outline">Check Health Status (/health)</a>
        </div>

        <div class="footer">
          BizBot OS Phase 4 \u2014 Express Backend Engine
        </div>
      </div>
    </body>
    </html>
  `);
});
var health_default = router;

// src/routes/webhook.ts
import { Router as Router2 } from "express";

// src/services/inboundPipeline.ts
init_env();
import crypto from "crypto";

// src/config/supabase.ts
init_env();
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
if (!ENV.SUPABASE_URL || !ENV.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("\u26A0\uFE0F [Supabase] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in .env");
}
var supabase = createClient(
  ENV.SUPABASE_URL || "https://placeholder.supabase.co",
  ENV.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      fetch: fetch.bind(globalThis)
    },
    realtime: {
      transport: WebSocket
    }
  }
);

// src/services/businessService.ts
init_env();
function numberVariants(whatsappNumber) {
  const digits = (whatsappNumber || "").replace(/\D/g, "");
  const last10 = digits.slice(-10);
  const variants = /* @__PURE__ */ new Set([whatsappNumber, digits, `+${digits}`]);
  if (last10.length === 10) {
    variants.add(last10);
    variants.add(`91${last10}`);
    variants.add(`+91${last10}`);
  }
  return [...variants].filter(Boolean);
}
async function getBusinessByWhatsappNumber(whatsappNumber) {
  if (!whatsappNumber) {
    console.warn("[DB Service] getBusinessByWhatsappNumber called with an empty number.");
    return null;
  }
  const variants = numberVariants(whatsappNumber);
  const { data, error } = await supabase.from("businesses").select("*").in("whatsapp_number", variants).limit(1).maybeSingle();
  if (error) {
    console.error(`[DB Service Error] Error fetching business by number ${whatsappNumber}:`, error.message);
    return null;
  }
  if (!data) {
    console.warn(
      `[DB Service] \u274C No business registered for ${whatsappNumber}. Refusing to serve another tenant's data. Register the number in onboarding.`
    );
    return null;
  }
  console.log(`[DB Service] Found business: "${data.name}" (${data.id}) | Category: ${data.category}`);
  return data;
}
async function resolveOperatorBusinessId() {
  const configured = ENV.WHATSAPP_BUSINESS_NUMBER;
  if (!configured) {
    console.warn(
      "[DB Service] WHATSAPP_BUSINESS_NUMBER is not set \u2014 cannot attribute admin activity to a business. Rows will be written with business_id = null."
    );
    return null;
  }
  const { data, error } = await supabase.from("businesses").select("id").in("whatsapp_number", numberVariants(configured)).limit(1).maybeSingle();
  if (error) {
    console.error("[DB Service Error] Failed to resolve operator business:", error.message);
    return null;
  }
  if (!data) {
    console.warn(`[DB Service] No business row matches WHATSAPP_BUSINESS_NUMBER (${configured}).`);
    return null;
  }
  return data.id;
}
async function getBusinessConfigs(businessId) {
  console.log(`[DB Service] Fetching configs for business_id: ${businessId}`);
  const { data, error } = await supabase.from("business_config").select("*").eq("business_id", businessId);
  if (error) {
    console.error(`[DB Service Error] Error fetching configs for business ${businessId}:`, error);
    return [];
  }
  console.log(`[DB Service] Loaded ${data.length} config items for business ${businessId}`);
  return data;
}
async function getCategoryTemplate(category) {
  console.log(`[DB Service] Fetching category template for: ${category}`);
  const { data, error } = await supabase.from("category_templates").select("*").eq("category", category).single();
  if (error) {
    console.error(`[DB Service Error] Error fetching template for category ${category}:`, error);
    return null;
  }
  return data;
}
async function getRecentConversations(businessId, customerNumber, limit = 10) {
  console.log(`[DB Service] Fetching last ${limit} messages for customer ${customerNumber}`);
  const { data, error } = await supabase.from("conversations").select("*").eq("business_id", businessId).eq("customer_number", customerNumber).order("created_at", { ascending: false }).limit(limit);
  if (error) {
    console.error(`[DB Service Error] Error fetching chat history:`, error);
    return [];
  }
  return data.reverse();
}
async function saveConversationMessage(businessId, customerNumber, direction, text) {
  console.log(`[DB Service] Saving ${direction} message for business ${businessId} to customer ${customerNumber}`);
  const { data, error } = await supabase.from("conversations").insert([
    {
      business_id: businessId,
      customer_number: customerNumber,
      message_direction: direction,
      message_text: text
    }
  ]).select("*").single();
  if (error) {
    console.error(`[DB Service Error] Error saving conversation message:`, error);
    return null;
  }
  console.log(`[DB Service] Message saved successfully (ID: ${data.id})`);
  return data;
}
async function saveCapturedRecord(businessId, type, customerNumber, details) {
  console.log(`[DB Service] \u{1F3AF} Storing/Updating captured ${type.toUpperCase()} record for customer ${customerNumber}`);
  const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1e3).toISOString();
  const { data: existingRecord } = await supabase.from("orders_bookings_leads").select("*").eq("business_id", businessId).eq("customer_number", customerNumber).in("status", ["new", "confirmed"]).gte("created_at", twentyMinutesAgo).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (existingRecord) {
    console.log(`[DB Service] \u{1F504} Updating existing active ${type} (${existingRecord.id}) with fresh details to prevent duplicate entries.`);
    const mergedDetails = {
      ...typeof existingRecord.details === "object" ? existingRecord.details : {},
      ...details
    };
    const { data: updatedRecord, error: updateErr } = await supabase.from("orders_bookings_leads").update({
      details: mergedDetails,
      type: type || existingRecord.type
    }).eq("id", existingRecord.id).select("*").single();
    if (updateErr) {
      console.error(`[DB Service Error] Error updating existing record:`, updateErr);
      return existingRecord;
    }
    return updatedRecord;
  }
  const { data, error } = await supabase.from("orders_bookings_leads").insert([
    {
      business_id: businessId,
      type,
      customer_number: customerNumber,
      details,
      status: "new"
    }
  ]).select("*").single();
  if (error) {
    console.error(`[DB Service Error] Error saving captured record:`, error);
    return null;
  }
  console.log(`[DB Service] \u{1F4CC} Record captured successfully (ID: ${data.id})`);
  return data;
}
async function cancelOrdersForCustomer(businessId, customerNumber, cancelAll = false) {
  console.log(`[DB Service] \u274C Cancelling ${cancelAll ? "ALL" : "latest"} active order(s) for customer ${customerNumber}`);
  if (cancelAll) {
    const { data: updatedOrders, error } = await supabase.from("orders_bookings_leads").update({ status: "cancelled" }).eq("business_id", businessId).eq("customer_number", customerNumber).in("status", ["new", "confirmed"]).select("id");
    if (error) {
      console.error(`[DB Service Error] Failed to cancel all orders:`, error);
      return 0;
    }
    const count = updatedOrders?.length || 0;
    console.log(`[DB Service] \u2705 Successfully cancelled ${count} order(s) for customer ${customerNumber}!`);
    return count;
  } else {
    const { data: latestOrder } = await supabase.from("orders_bookings_leads").select("id").eq("business_id", businessId).eq("customer_number", customerNumber).in("status", ["new", "confirmed"]).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!latestOrder) {
      console.warn(`[DB Service] No active order found to cancel for customer ${customerNumber}`);
      return 0;
    }
    const { error: updateErr } = await supabase.from("orders_bookings_leads").update({ status: "cancelled" }).eq("id", latestOrder.id);
    if (updateErr) {
      console.error(`[DB Service Error] Failed to update order to cancelled:`, updateErr);
      return 0;
    }
    console.log(`[DB Service] \u2705 Order ${latestOrder.id} successfully updated to 'cancelled'!`);
    return 1;
  }
}

// src/services/promptBuilder.ts
var DEBUG = process.env.NODE_ENV !== "production";
var log = (...args) => {
  if (DEBUG) console.log(...args);
};
var warn = (...args) => console.warn(...args);
var PromptBuilderError = class extends Error {
  code;
  constructor(message, code) {
    super(message);
    this.name = "PromptBuilderError";
    this.code = code;
  }
};
var CACHE_TTL_MS = Number(process.env.PROMPT_CACHE_TTL_MS) || 5 * 60 * 1e3;
var CACHE_MAX_ENTRIES = Number(process.env.PROMPT_CACHE_MAX_ENTRIES) || 500;
var promptCache = /* @__PURE__ */ new Map();
function cacheKey(businessId) {
  return businessId;
}
function getCached(businessId) {
  const key = cacheKey(businessId);
  const entry = promptCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    promptCache.delete(key);
    return null;
  }
  promptCache.delete(key);
  promptCache.set(key, entry);
  return entry;
}
function setCached(businessId, prompt) {
  const key = cacheKey(businessId);
  if (promptCache.size >= CACHE_MAX_ENTRIES && !promptCache.has(key)) {
    const oldestKey = promptCache.keys().next().value;
    if (oldestKey !== void 0) promptCache.delete(oldestKey);
  }
  promptCache.set(key, { prompt, expiresAt: Date.now() + CACHE_TTL_MS, builtAt: Date.now() });
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function withRetry(fn, { retries = 2, baseDelayMs = 150, label = "operation" } = {}) {
  let lastErr;
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
var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function validateBusinessId(businessId) {
  if (!businessId || typeof businessId !== "string") {
    throw new PromptBuilderError("businessId is required and must be a non-empty string", "INVALID_BUSINESS_ID");
  }
  if (!UUID_RE.test(businessId)) {
    warn(`[PromptBuilder Warning] businessId "${businessId}" doesn't look like a UUID \u2014 proceeding anyway.`);
  }
}
function sanitizeText(input) {
  return input.replace(/```/g, "\u200B`\u200B`\u200B`");
}
var CATEGORY_FALLBACK_TEMPLATES = {
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
{{hours}}`
};
var DEFAULT_FALLBACK_TEMPLATE = `You are the official customer service assistant for {{business_name}}.
Help customers with inquiries, catalog items, pricing, and bookings.

Catalog / Services:
{{menu_items}}
{{services}}

Hours:
{{hours}}`;
var CAPTURE_TYPE_BY_CATEGORY = {
  salon: "booking",
  clinic: "booking",
  hospital: "booking",
  tuition: "lead",
  real_estate: "lead",
  ca_firm: "lead",
  bakery: "order",
  cafe: "order",
  retail: "order",
  gym: "lead",
  custom: "order"
};
var FORMATTERS = {
  menu_items: {
    label: "Live Menu Catalog",
    format: (val) => val.map((m) => `\u{1F370} *${m.name}* \u2014 \u20B9${m.price}${m.unit ? ` _(per ${m.unit})_` : ""}`).join("\n")
  },
  cafe_menu: {
    label: "Live Cafe Menu",
    format: (val) => val.map((c) => `\u2615 *${c.name}* \u2014 \u20B9${c.price}${c.category ? ` _(${c.category})_` : ""}`).join("\n")
  },
  services: {
    format: (val) => val.map((s) => `\u2702\uFE0F *${s.name}* \u2014 \u20B9${s.price}${s.duration ? ` _(${s.duration})_` : ""}`).join("\n")
  },
  gym_plans: {
    label: "Live Gym Plans",
    format: (val) => val.map((g) => `\u{1F3CB}\uFE0F *${g.name}* \u2014 \u20B9${g.price}${g.duration ? ` _(${g.duration})_` : ""}`).join("\n")
  },
  staff: {
    format: (val) => val.map((st) => `\u{1F464} *${st.name}*${st.specialty ? ` _(${st.specialty})_` : ""}`).join("\n")
  },
  course_list: {
    format: (val) => val.map((c) => `\u{1F4DA} *${c.name}* \u2014 Fee: \u20B9${c.fee}${c.batch_timing ? ` _(Timing: ${c.batch_timing})_` : ""}`).join("\n")
  },
  faqs: {
    format: (val) => val.map((f) => `*Q: ${f.question}*
_${f.answer}_`).join("\n\n")
  }
};
FORMATTERS.courses = FORMATTERS.course_list;
function formatConfigValue(key, val) {
  try {
    const formatter = FORMATTERS[key];
    let out;
    if (formatter && Array.isArray(val)) {
      out = formatter.format(val);
      if (formatter.label) log(`[PromptBuilder] \u{1F4CB} ${formatter.label} Injected:
${out}`);
    } else if (typeof val === "string") {
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
      return "[Unformattable value]";
    }
  }
}
async function fetchBusiness(businessId) {
  const { data, error } = await supabase.from("businesses").select("*").eq("id", businessId).single();
  if (error || !data) {
    throw new PromptBuilderError(`Business not found for ID: ${businessId}`, "BUSINESS_NOT_FOUND");
  }
  return data;
}
async function resolveBaseTemplate(category) {
  try {
    const templateObj = await getCategoryTemplate(category);
    if (templateObj?.prompt_template) return templateObj.prompt_template;
  } catch (err) {
    warn(`[PromptBuilder Warning] Template lookup failed for category "${category}":`, err);
  }
  const cat = (category || "").toLowerCase();
  return CATEGORY_FALLBACK_TEMPLATES[cat] ?? DEFAULT_FALLBACK_TEMPLATE;
}
function buildConfigMap(business, configs) {
  const map = { business_name: business.name };
  for (const item of configs) {
    map[item.config_key] = formatConfigValue(item.config_key, item.config_value);
  }
  return map;
}
function injectPlaceholders(template, configMap) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key) => resolvePlaceholder(key, configMap)).replace(/\{\s*(\w+)\s*\}/g, (_match, key) => resolvePlaceholder(key, configMap));
}
function resolvePlaceholder(key, configMap) {
  const value = configMap[key];
  if (value !== void 0 && String(value).trim() !== "") return String(value);
  warn(`[PromptBuilder Warning] Missing config value for key: ${key}.`);
  return "[Not provided]";
}
function liveMenuOverrideBlock(businessName) {
  return `### CRITICAL INSTRUCTION - LIVE MENU OVERRIDE:
The items and pricing listed below represent the LIVE, UP-TO-DATE catalog for ${businessName}. 
Even if past messages in the conversation history claimed an item was unavailable, ALWAYS check the current catalog below. If an item is listed below, IT IS IN STOCK AND FULLY AVAILABLE. Never claim an item is unavailable if it is in the list below.

`;
}
function captureInstructionBlock(captureType) {
  return `

### \u{1F4E6} ORDER & BOOKING CAPTURE GUIDELINES:
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
function scopeGuardBlock(businessName) {
  return `

### \u{1F3AF} SCOPE & FOCUS:
- You are exclusively the dedicated WhatsApp assistant for ${businessName}.
- Focus all interactions on assisting with ${businessName}'s menu, products, services, operating hours, and order/booking inquiries.
- If a user inquires about unrelated topics, courteously redirect them back to our offerings:
  "I am here to assist with ${businessName}'s menu, orders, and services. How may I help you today?"`;
}
function languageAndFormattingBlock(businessName) {
  return `

### \u{1F310} LANGUAGE & CONVERSATIONAL STYLE:
1. **DEFAULT LANGUAGE = POLISHED, PROFESSIONAL ENGLISH**:
   - Always communicate in warm, crisp, professional English by default.
   - For an initial greeting, welcome the customer warmly, display the live menu/services with prices, operating hours, and ask how to help.

2. **LANGUAGE MIRRORING (HINGLISH ONLY WHEN INITIATED BY CUSTOMER)**:
   - Only switch to Hindi/Hinglish if the customer explicitly initiates in Hindi/Hinglish (e.g. "bhaiya order pack kar dena", "kal shaam 5 baje").
   - If the customer speaks English, maintain standard professional English.

### \u{1F399}\uFE0F INDIAN CONVERSATIONAL COMPREHENSION:
- Fluently understand common Indian WhatsApp terminology: "Bhaiya", "parcel", "pack kar do", "ready rakhna", "chahiye", "kitne ka hai", "kal shaam 5 baje", "1kg", "urgent".
- Intelligently extract items, quantities, dates, times, and delivery locations from free-form or voice-transcribed messages.

### \u{1F9EE} QUANTITY & ARITHMETIC RULES:
- Accurately calculate order totals: Total = Sum of (Quantity \xD7 Price).
- Default quantity is 1 if unspecified.

### \u2728 WHATSAPP FORMATTING EXCELLENCE:
- Use emojis, clean bullet points (\u2022), and bold headers (*Bold Title*) for readability.
- Keep follow-up replies concise and direct.
- When confirming an order or appointment, provide a clear structured summary with Itemized List, Date/Time, Delivery Address, and Total Amount.`;
}
function isValidUpiId(upi) {
  return /^[\w.\-]{2,256}@[\w.\-]{2,64}$/.test(upi);
}
function upiInstructionBlock(businessName, upiId, paymentNote) {
  const cleanUpi = upiId.trim();
  const cleanBizName = encodeURIComponent(businessName.replace(/\s+/g, "+"));
  return `

### \u{1F4B3} INSTANT UPI PAYMENT AUTOMATION RULES:
- Store UPI ID: \`${cleanUpi}\`
- When confirming an order or booking with a total amount, ALWAYS provide the exact total and dynamic clickable UPI pay link in this structured format:

\u{1F4B0} *Total Amount:* \u20B9[Total]

\u{1F4F2} *Pay via any UPI App (GPay / PhonePe / Paytm / BHIM):*
\u{1F449} upi://pay?pa=${cleanUpi}&pn=${cleanBizName}&am=[Total]&cu=INR&tn=Order-${cleanBizName}
(Or send to UPI ID: \`${cleanUpi}\`)
${paymentNote ? `
\u{1F4DD} _${paymentNote}_` : ""}

(Always replace [Total] with the exact calculated order sum in numbers, e.g. 650).`;
}
var SLOW_BUILD_WARN_MS = Number(process.env.PROMPT_SLOW_BUILD_MS) || 800;
async function buildFreshPrompt(businessId) {
  const business = await withRetry(() => fetchBusiness(businessId), { label: `fetchBusiness(${businessId})` });
  const [baseTemplate, configs] = await Promise.all([
    resolveBaseTemplate(business.category),
    withRetry(() => getBusinessConfigs(businessId), { label: `getBusinessConfigs(${businessId})` })
  ]);
  const configMap = buildConfigMap(business, configs);
  log(`[PromptBuilder] Merging ${Object.keys(configMap).length} dynamic placeholders...`);
  let prompt = injectPlaceholders(baseTemplate, configMap);
  const captureType = CAPTURE_TYPE_BY_CATEGORY[business.category] ?? "order";
  prompt = liveMenuOverrideBlock(business.name) + prompt + captureInstructionBlock(captureType) + scopeGuardBlock(business.name) + languageAndFormattingBlock(business.name);
  const upiId = configs.find((c) => c.config_key === "upi_id")?.config_value;
  const paymentNote = configs.find((c) => c.config_key === "payment_note")?.config_value;
  const autoSendPayment = configs.find((c) => c.config_key === "auto_send_payment_link")?.config_value !== false;
  if (typeof upiId === "string" && upiId.trim() && autoSendPayment) {
    if (!isValidUpiId(upiId.trim())) {
      warn(`[PromptBuilder Warning] UPI ID "${upiId}" doesn't look valid \u2014 skipping payment block.`);
    } else {
      prompt += upiInstructionBlock(business.name, upiId, typeof paymentNote === "string" ? paymentNote : void 0);
    }
  }
  return prompt;
}
async function buildSystemPrompt(businessId, options = {}) {
  validateBusinessId(businessId);
  if (!options.forceRefresh) {
    const cached = getCached(businessId);
    if (cached) {
      log(`[PromptBuilder] Cache HIT for business_id: ${businessId} (age ${Date.now() - cached.builtAt}ms)`);
      return cached.prompt;
    }
  }
  log(`[PromptBuilder] Cache MISS for business_id: ${businessId} \u2014 building fresh prompt`);
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
function buildCASupportPrompt(firmName, clientName, complianceRows, docRows) {
  const todayStr = (/* @__PURE__ */ new Date()).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const complianceLines = complianceRows.length ? complianceRows.map((r) => `- ${r.compliance_type}: due ${r.due_date}, status ${r.status}`).join("\n") : "- No compliance records currently on file.";
  const docLines = docRows.length ? docRows.map((r) => `- ${r.document_name} (${r.compliance_type}): ${r.status}`).join("\n") : "- No pending document requests.";
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
function buildCALeadQualificationPrompt(firmName) {
  const todayStr = (/* @__PURE__ */ new Date()).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
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
function buildCALeadClassifierPrompt(userMessage, assistantReply) {
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
function buildCADocumentRequestPrompt(firmName, clientName, complianceType, docList) {
  return `You are writing a direct, friendly WhatsApp document checklist request to client "${clientName}" on behalf of "${firmName}" for their upcoming "${complianceType}" filing.

Exact document checklist to request:
${docList}

STRICT INSTRUCTIONS:
- Output ONLY the ready-to-send WhatsApp message.
- NEVER include thinking, reasoning, analysis, headings like "Final Message", or meta-notes.
- Keep it 3-5 lines, warm, and professional.
- Sign off as "Team ${firmName}".`;
}
function buildCAComplianceReminderPrompt(firmName, clientName, complianceType, dueDate, stage, daysOverdue) {
  return `Write a concise, professional compliance deadline reminder (3-5 lines) from ${firmName} to client "${clientName}".
Compliance: ${complianceType}
Due Date: ${dueDate}
Stage: ${stage} (${stage === "friendly_7d" ? "Gentle heads up" : stage === "reminder_3d" ? "Clear reminder" : stage === "urgent_1d" ? "Urgent tone, due tomorrow" : stage === "due_today" ? "Due today, immediate action requested" : `Overdue by ${daysOverdue} days, firm but polite warning of possible late fee/penalty risk`})

Tone must strictly match the stage. Ask them to share any remaining documents or confirmation to avoid delayed filing. Sign off as "Team ${firmName}".`;
}
function buildCADocumentFollowupPrompt(firmName, clientName, documentName, complianceType, attemptNumber) {
  return `Write a short, professional follow-up message (WhatsApp/Email friendly, 2-4 lines) from ${firmName} reminding client "${clientName}" to share their pending document "${documentName}" for "${complianceType}".
This is follow-up attempt #${attemptNumber} (${attemptNumber === 1 ? "Gentle reminder" : attemptNumber === 2 ? "Clear follow-up" : "Firm reminder mentioning that delay will impact filing timeline"}).
Ask them to upload or reply with the document at the earliest. Sign off as "Team ${firmName}".`;
}
function buildCALeadFollowupPrompt(firmName, leadName, requirement, attemptNumber) {
  return `Write a short, friendly, non-intrusive follow-up message (2-4 lines) from ${firmName} to prospective client "${leadName}" regarding their inquiry about "${requirement}".
This is follow-up attempt #${attemptNumber}. Keep it conversational, helpful, and invite them to ask any questions or schedule a quick call. Sign off as "Team ${firmName}".`;
}
function buildCAInvoiceReminderPrompt(firmName, clientName, invoiceId, amount, currency, dueDate, stage, daysOverdue) {
  return `Write a professional payment reminder (3-5 lines) from ${firmName} to client "${clientName}".
Invoice ID: ${invoiceId}
Amount Due: ${currency} ${amount}
Due Date: ${dueDate}
Stage: ${stage} (${stage === "upcoming_3d" ? "Friendly upcoming notice" : stage === "due_today" ? "Due today" : stage === "overdue_mild" ? "Polite overdue reminder" : stage === "overdue_moderate" ? "Firm overdue reminder (8-15 days)" : `Severely overdue (${daysOverdue} days), formal request for settlement`})

Stay professional and courteous at all times. Include a request to settle the invoice or share the UTR/transaction details if already paid. Sign off as "Accounts Team, ${firmName}".`;
}
function buildCAPaymentThanksPrompt(firmName, clientName, invoiceId, amount, currency) {
  return `Write a warm, professional payment receipt acknowledgement (2-3 lines) from ${firmName} to "${clientName}" confirming receipt of ${currency} ${amount} for Invoice #${invoiceId}. Sign off as "Accounts Team, ${firmName}".`;
}

// src/services/claudeService.ts
init_env();

// src/services/groqService.ts
init_groq();
init_env();
var GROQ_MODEL_CASCADE = [
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "qwen/qwen3.8-27b",
  "groq/compound-mini"
];
function modelCascade() {
  const configured = ENV.GROQ_MODEL || process.env.GROQ_MODEL || "";
  const models = configured ? [configured, ...GROQ_MODEL_CASCADE] : [...GROQ_MODEL_CASCADE];
  return [...new Set(models)];
}
async function getResponse(systemPrompt, conversationHistory, newMessage, business, configs) {
  const formattedHistory = [];
  for (const msg of conversationHistory) {
    const isUser = msg.sender === "inbound" || msg.sender === "customer" || msg.message_direction === "inbound";
    const role = isUser ? "user" : "assistant";
    const textContent = msg.message || msg.message_text || "";
    if (formattedHistory.length > 0 && formattedHistory[formattedHistory.length - 1].role === role) {
      formattedHistory[formattedHistory.length - 1].content += `
${textContent}`;
    } else {
      formattedHistory.push({ role, content: textContent });
    }
  }
  const lastMsg = formattedHistory[formattedHistory.length - 1];
  if (!lastMsg || lastMsg.role !== "user" || !lastMsg.content.includes(newMessage)) {
    if (lastMsg && lastMsg.role === "user") {
      lastMsg.content += `
${newMessage}`;
    } else {
      formattedHistory.push({ role: "user", content: newMessage });
    }
  }
  const groqClient = getGroqClient();
  const failures = [];
  if (groqClient) {
    for (const model of modelCascade()) {
      try {
        console.log(`[Groq AI Service] Requesting model: ${model}...`);
        const completion = await groqClient.chat.completions.create({
          model,
          messages: [
            {
              role: "system",
              content: `${systemPrompt}

### MANDATORY RULES:
1. ACCEPT ALL LIVE MENU & SERVICE ITEMS: If the customer asks to book an appointment, checkup, or service, confirm the slot, date, time, and details immediately.
2. When user provides date/time (e.g. "20 august 2 pm"), CONFIRM the appointment warmly and append the JSON capture block.
3. NEVER INVENT FACTS: do not state a phone number, token number, address, price, or timing that is not present in the business information above. If you don't have it, say you'll have the team confirm.
4. STRICT DOMAIN GUARDRAIL: Never write code (Python, JS, etc.), do homework, or answer unrelated general queries. Politely refuse and state that you are exclusively the virtual assistant for this business.`
            },
            ...formattedHistory.map((m) => ({
              role: m.role,
              content: m.content
            }))
          ],
          temperature: 0.2,
          max_tokens: 650
        });
        const reply = cleanLLMOutput(completion.choices[0]?.message?.content || "");
        if (reply) {
          console.log(`[Groq AI Service] \u2705 Generated response (${model}): ${reply.length} chars`);
          return reply;
        }
        failures.push(`${model}: empty response`);
      } catch (groqErr) {
        const detail = `${model}: ${groqErr?.status || "?"} ${groqErr?.message || groqErr}`;
        failures.push(detail);
        console.error(`[Groq AI Error] ${detail}`);
      }
    }
  } else {
    failures.push("GROQ_API_KEY missing or invalid");
  }
  console.error(
    `[Groq AI Service] \u274C ALL MODELS FAILED for ${business?.name || "unknown business"}. Serving a safe catalogue reply. Failures: ${failures.join(" | ")}`
  );
  return buildSafeFallbackReply(newMessage, business, configs);
}
function buildSafeFallbackReply(newMessage, business, configs) {
  if (!business) {
    return `Hello! Thanks for reaching out. Our assistant is temporarily unavailable \u2014 a member of our team will reply to you shortly. \u{1F64F}`;
  }
  const configMap = {};
  (configs || []).forEach((c) => {
    configMap[c.config_key] = c.config_value;
  });
  const category = business.category || "store";
  const lowerMsg = (newMessage || "").toLowerCase();
  if (lowerMsg.includes("emergency") || lowerMsg.includes("urgent") || lowerMsg.includes("ambulance")) {
    const configured = configMap.emergency_contact || configMap.emergency_number || configMap.phone || configMap.contact_number;
    const lines = [`\u{1F6A8} *Emergency \u2014 ${business.name}*`, ""];
    if (configured) {
      lines.push(`\u{1F4DE} *${business.name}:* ${configured}`);
    }
    lines.push(`\u{1F4DE} *Ambulance (national):* 108`, `\u{1F4DE} *Emergency services:* 112`, "");
    lines.push(`If this is a medical emergency, please call now rather than waiting for a reply here.`);
    return lines.join("\n");
  }
  let catalogList = "";
  if (category === "bakery" && Array.isArray(configMap.menu_items)) {
    catalogList = configMap.menu_items.map((m) => `\u2022 *${m.name}* \u2014 \u20B9${m.price}${m.unit ? ` (${m.unit})` : ""}`).join("\n");
  } else if ((category === "salon" || category === "clinic" || category === "hospital" || category === "custom" || category === "real_estate" || category === "ca_firm") && Array.isArray(configMap.services)) {
    catalogList = configMap.services.map((s) => `\u2022 *${s.name}* \u2014 \u20B9${s.price}${s.duration ? ` (${s.duration})` : ""}`).join("\n");
  } else if (category === "gym" && Array.isArray(configMap.gym_plans)) {
    catalogList = configMap.gym_plans.map((g) => `\u2022 *${g.name}* \u2014 \u20B9${g.price}${g.duration ? ` (${g.duration})` : ""}`).join("\n");
  } else if (category === "cafe" && Array.isArray(configMap.cafe_menu)) {
    catalogList = configMap.cafe_menu.map((c) => `\u2022 *${c.name}* \u2014 \u20B9${c.price}${c.category ? ` (${c.category})` : ""}`).join("\n");
  } else if (category === "tuition" && Array.isArray(configMap.course_list)) {
    catalogList = configMap.course_list.map((t) => `\u2022 *${t.name}* \u2014 ${t.fee}${t.batch_timing ? ` [${t.batch_timing}]` : ""}`).join("\n");
  } else if (category === "retail" && Array.isArray(configMap.menu_items)) {
    catalogList = configMap.menu_items.map((m) => `\u2022 *${m.name}* \u2014 \u20B9${m.price}`).join("\n");
  }
  const staffList = Array.isArray(configMap.staff) && configMap.staff.length > 0 ? `

*Our Team:*
` + configMap.staff.map((s) => `\u2022 ${s.name}${s.specialty ? ` (${s.specialty})` : ""}`).join("\n") : "";
  const hours = configMap.hours ? `

\u{1F552} *Hours:* ${configMap.hours}` : "";
  return `\u2728 *${business.name}* \u2728

Thanks for your message! Our AI assistant is briefly unavailable, so a team member will confirm the details with you shortly.` + (catalogList ? `

In the meantime, here's what we offer:
${catalogList}` : "") + staffList + hours;
}
async function extractStructuredCapture(conversationHistory, category) {
  const groqClient = getGroqClient();
  if (!groqClient) return null;
  const defaultType = category === "salon" ? "booking" : category === "tuition" ? "lead" : "order";
  const recentMessages = conversationHistory.slice(-6).map(
    (m) => `${m.sender === "inbound" || m.sender === "customer" ? "Customer" : "Business"}: ${m.message || m.message_text || ""}`
  ).join("\n");
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
  for (const model of modelCascade()) {
    try {
      const completion = await groqClient.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        response_format: { type: "json_object" }
      });
      const content = completion.choices[0]?.message?.content;
      if (!content) continue;
      const parsed = JSON.parse(content);
      if (parsed.confirmed && parsed.details) {
        return { type: parsed.type || defaultType, details: parsed.details };
      }
      return null;
    } catch (err) {
      console.warn(`[AI Capture Extractor] Model ${model} failed: ${err?.message || err}`);
    }
  }
  console.error("[AI Capture Extractor] \u274C All models failed \u2014 no capture extracted.");
  return null;
}
function cleanLLMOutput(raw) {
  if (!raw) return "";
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  cleaned = cleaned.replace(/\*\*Reasoning[\s\S]*?\*\*Demo Message[^\n]*\n+/gi, "").trim();
  cleaned = cleaned.replace(/\*\*Reasoning[\s\S]*?\n(?=>|Namaste|Hello|Thank you|Dear|Hi)/gi, "").trim();
  cleaned = cleaned.replace(
    /^(?:\*\*Reasoning.*?\*\*|\*\*Thought.*?\*\*|\*\*Approach.*?\*\*)[\s\S]*?(?=(?:Namaste|Hello|Thank you|Dear|Hi|\*|\n\n[A-Z]))/gi,
    ""
  ).trim();
  cleaned = cleaned.replace(/^>\s?/gm, "").trim();
  cleaned = cleaned.replace(/\*After the (?:prospect|client|user) replies[\s\S]*?\*/gi, "").trim();
  return cleaned;
}
async function getGroqChatCompletion(messages, options = {}) {
  const groqClient = getGroqClient();
  if (!groqClient) {
    throw new Error("Groq client not initialized \u2014 GROQ_API_KEY is missing or invalid.");
  }
  const failures = [];
  for (const model of modelCascade()) {
    try {
      const completion = await groqClient.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: "CRITICAL INSTRUCTION: Output ONLY the final customer-facing WhatsApp message. Never output reasoning, thoughts, numbered steps, or markdown explanations. Never invent phone numbers, prices, addresses, or reference numbers."
          },
          ...messages
        ],
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxTokens ?? 650
      });
      const reply = cleanLLMOutput(completion.choices[0]?.message?.content || "");
      if (reply) return reply;
      failures.push(`${model}: empty response`);
    } catch (err) {
      failures.push(`${model}: ${err?.message || err}`);
      console.warn(`[Groq AI] Model ${model} failed (${err?.message}). Trying next...`);
    }
  }
  throw new Error(`All Groq models failed: ${failures.join(" | ")}`);
}

// src/services/claudeService.ts
async function callAgentRouterAPI(systemPrompt, messages, options = {}) {
  const token = ENV.ANTHROPIC_AUTH_TOKEN;
  if (!token) {
    throw new Error("ANTHROPIC_AUTH_TOKEN / AgentRouter token is not configured in environment.");
  }
  const baseUrl = (ENV.ANTHROPIC_BASE_URL || "https://agentrouter.org").replace(/\/+$/, "");
  const model = options.model || ENV.ANTHROPIC_MODEL || "glm-5.3";
  const sanitizedMessages = [];
  for (const m of messages) {
    if (!m.content || !m.content.trim()) continue;
    const last = sanitizedMessages[sanitizedMessages.length - 1];
    if (last && last.role === m.role) {
      last.content += `
${m.content}`;
    } else {
      sanitizedMessages.push({ role: m.role, content: m.content });
    }
  }
  if (sanitizedMessages.length === 0) {
    sanitizedMessages.push({ role: "user", content: "Hello" });
  }
  if (sanitizedMessages[0].role === "assistant") {
    sanitizedMessages.unshift({ role: "user", content: "Hi" });
  }
  const isOpenAiStandard = baseUrl.includes("/v1") || baseUrl.includes("/v4") || baseUrl.includes("kiraai.vn") || baseUrl.includes("bigmodel.cn") || baseUrl.includes("openai.com");
  if (isOpenAiStandard) {
    const chatUrl = baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl}/chat/completions`;
    console.log(`[AI Service] Requesting model: ${model} via OpenAI gateway ${chatUrl}...`);
    const openAiMessages2 = [
      { role: "system", content: systemPrompt },
      ...sanitizedMessages.map((m) => ({ role: m.role, content: m.content }))
    ];
    const res2 = await fetch(chatUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        model,
        messages: openAiMessages2,
        temperature: options.temperature ?? 0.2,
        max_tokens: options.maxTokens ?? 1024
      }),
      signal: AbortSignal.timeout(15e3)
    });
    if (!res2.ok) {
      const errText = await res2.text().catch(() => "");
      throw new Error(`OpenAI-compatible API (${chatUrl}) returned HTTP ${res2.status}: ${errText || res2.statusText}`);
    }
    const data2 = await res2.json();
    const textContent2 = data2?.choices?.[0]?.message?.content?.trim();
    if (!textContent2) throw new Error("API returned empty choices response.");
    return cleanLLMOutput(textContent2);
  }
  console.log(`[AgentRouter] Requesting model: ${model} via ${baseUrl}/v1/messages...`);
  try {
    const res2 = await fetch(`${baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": token,
        "Authorization": `Bearer ${token}`,
        "User-Agent": "cline/1.0.0"
      },
      body: JSON.stringify({
        model,
        system: systemPrompt,
        messages: sanitizedMessages,
        temperature: options.temperature ?? 0.2,
        max_tokens: options.maxTokens ?? 1024
      }),
      signal: AbortSignal.timeout(15e3)
    });
    if (res2.ok) {
      const data2 = await res2.json();
      const textContent2 = data2?.content?.filter((c) => c.type === "text")?.map((c) => c.text)?.join("\n")?.trim();
      if (textContent2) {
        return cleanLLMOutput(textContent2);
      }
    } else {
      const errText = await res2.text().catch(() => "");
      console.warn(`[AgentRouter /v1/messages HTTP ${res2.status}]: ${errText.slice(0, 150)}`);
    }
  } catch (err) {
    console.warn(`[AgentRouter /v1/messages Error]: ${err?.message || err}`);
  }
  console.log(`[AgentRouter] Falling back to ${baseUrl}/v1/chat/completions...`);
  const openAiMessages = [
    { role: "system", content: systemPrompt },
    ...sanitizedMessages.map((m) => ({ role: m.role, content: m.content }))
  ];
  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "User-Agent": "cline/1.0.0"
    },
    body: JSON.stringify({
      model,
      messages: openAiMessages,
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? 1024
    }),
    signal: AbortSignal.timeout(15e3)
  });
  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`AgentRouter API returned HTTP ${res.status}: ${errorText || res.statusText}`);
  }
  const data = await res.json();
  const textContent = data?.choices?.[0]?.message?.content?.trim();
  if (!textContent) throw new Error("AgentRouter API returned empty response.");
  return cleanLLMOutput(textContent);
}
async function getResponse2(systemPrompt, conversationHistory, newMessage, business, configs) {
  const provider = (ENV.AI_PROVIDER || "auto").toLowerCase();
  if (provider === "groq") {
    return getResponse(systemPrompt, conversationHistory, newMessage, business, configs);
  }
  const formattedHistory = [];
  for (const msg of conversationHistory) {
    const isUser = msg.sender === "inbound" || msg.sender === "customer" || msg.message_direction === "inbound";
    const role = isUser ? "user" : "assistant";
    const textContent = msg.message || msg.message_text || "";
    if (textContent.trim()) {
      formattedHistory.push({ role, content: textContent });
    }
  }
  const lastMsg = formattedHistory[formattedHistory.length - 1];
  if (!lastMsg || lastMsg.role !== "user" || !lastMsg.content.includes(newMessage)) {
    if (lastMsg && lastMsg.role === "user") {
      lastMsg.content += `
${newMessage}`;
    } else {
      formattedHistory.push({ role: "user", content: newMessage });
    }
  }
  const fullSystemPrompt = `${systemPrompt}

### MANDATORY RULES:
1. ACCEPT ALL LIVE MENU & SERVICE ITEMS: If the customer asks to book an appointment, checkup, or service, confirm the slot, date, time, and details immediately.
2. When user provides date/time (e.g. "20 august 2 pm"), CONFIRM the appointment warmly and append the JSON capture block.
3. NEVER INVENT FACTS: do not state a phone number, token number, address, price, or timing that is not present in the business information above. If you don't have it, say you'll have the team confirm.
4. STRICT DOMAIN GUARDRAIL: Never write code (Python, JS, etc.), do homework, or answer unrelated general queries. Politely refuse and state that you are exclusively the virtual assistant for this business.`;
  if (ENV.ANTHROPIC_AUTH_TOKEN) {
    try {
      const response = await callAgentRouterAPI(fullSystemPrompt, formattedHistory);
      console.log(`[AgentRouter] \u2705 Response generated successfully (${response.length} chars).`);
      return response;
    } catch (err) {
      console.warn(`[AgentRouter Warning] Primary AgentRouter call failed (${err?.message || err}). Falling back to Groq...`);
    }
  } else {
    console.log("[AI Router] AgentRouter token not set, using Groq as primary.");
  }
  return getResponse(systemPrompt, conversationHistory, newMessage, business, configs);
}
async function extractStructuredCapture2(conversationHistory, category) {
  return extractStructuredCapture(conversationHistory, category);
}

// src/services/whatsappService.ts
init_env();
var GRAPH_VERSION = "v20.0";
function formatWhatsAppMessage(text) {
  return text.replace(/```(?:json)?[\s\S]*?```/gi, "").replace(/\{[\s\S]*?"(?:type|capture|details|items)"[\s\S]*?\}/gi, "").replace(/^[\s]*\*\s+\*([^*]+)\*/gm, "\u2022 *$1*").replace(/^[\s]*\*\s+/gm, "\u2022 ").replace(/\*\*([^*]+)\*\*/g, "*$1*").replace(/\n{3,}/g, "\n\n").trim();
}
function credentials() {
  const token = ENV.WHATSAPP_CLOUD_API_TOKEN || process.env.WHATSAPP_CLOUD_API_TOKEN || "";
  const phoneNumberId = ENV.WHATSAPP_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID || "";
  if (!token || !phoneNumberId) return null;
  return { token, phoneNumberId };
}
async function postToGraph(payload, label) {
  const creds = credentials();
  if (!creds) {
    const error = "WHATSAPP_CLOUD_API_TOKEN / WHATSAPP_PHONE_NUMBER_ID are not configured \u2014 message NOT sent.";
    console.error(`[WhatsApp Service] \u274C ${label}: ${error}`);
    return { success: false, error, notConfigured: true };
  }
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${creds.phoneNumberId}/messages`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${creds.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      const error = data?.error?.message || `Meta API returned ${res.status}`;
      console.error(`[WhatsApp Service] \u274C ${label} failed: ${error}`);
      return { success: false, error };
    }
    const messageId = data?.messages?.[0]?.id;
    console.log(`[WhatsApp Service] \u2705 ${label} delivered to ${payload.to} (${messageId || "OK"})`);
    return { success: true, messageId };
  } catch (err) {
    const error = err?.message || String(err);
    console.error(`[WhatsApp Service] \u274C ${label} network error: ${error}`);
    return { success: false, error };
  }
}
async function sendMessage(toNumber, businessWhatsappNumber, message) {
  const formattedMessage = formatWhatsAppMessage(message);
  let cleanToNumber = (toNumber || "").replace(/\D/g, "");
  if (!cleanToNumber) {
    return { success: false, error: "No recipient number supplied." };
  }
  if (cleanToNumber.length === 10) {
    cleanToNumber = `91${cleanToNumber}`;
  }
  return postToGraph(
    {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanToNumber,
      type: "text",
      text: { preview_url: false, body: formattedMessage }
    },
    `text\u2192${cleanToNumber}`
  );
}
async function sendInteractiveButtonsMessage(toNumber, businessWhatsappNumber, bodyText, buttons) {
  const formattedMessage = formatWhatsAppMessage(bodyText);
  let cleanToNumber = (toNumber || "").replace(/\D/g, "");
  if (!cleanToNumber) {
    return { success: false, error: "No recipient number supplied." };
  }
  if (cleanToNumber.length === 10) {
    cleanToNumber = `91${cleanToNumber}`;
  }
  const validButtons = buttons.slice(0, 3).map((btn) => ({
    type: "reply",
    reply: { id: btn.id.slice(0, 256), title: btn.title.slice(0, 20) }
  }));
  const trimmedBody = formattedMessage.length > 1e3 ? formattedMessage.slice(0, 990) + "..." : formattedMessage;
  const result = await postToGraph(
    {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanToNumber,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: trimmedBody },
        action: { buttons: validButtons }
      }
    },
    `buttons\u2192${cleanToNumber}`
  );
  if (result.success || result.notConfigured) return result;
  console.warn(`[WhatsApp Service] Retrying ${cleanToNumber} as plain text after interactive rejection.`);
  return sendMessage(toNumber, businessWhatsappNumber, formattedMessage);
}
async function sendWhatsAppMessage(toNumber, message, businessWhatsappNumber = ENV.WHATSAPP_BUSINESS_NUMBER) {
  return sendMessage(toNumber, businessWhatsappNumber, message);
}

// src/services/whisperService.ts
init_groq();
async function downloadWhatsAppMedia(mediaId) {
  const token = process.env.WHATSAPP_CLOUD_API_TOKEN;
  if (!token) {
    throw new Error("[Whisper Service Error] WHATSAPP_CLOUD_API_TOKEN is not configured.");
  }
  console.log(`[Whisper Service] \u{1F4E5} Fetching media URL for Media ID: ${mediaId}...`);
  const metaRes = await fetch(`https://graph.facebook.com/v20.0/${mediaId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!metaRes.ok) {
    const errText = await metaRes.text();
    throw new Error(`[Whisper Service Error] Failed to get media URL (${metaRes.status}): ${errText}`);
  }
  const metaData = await metaRes.json();
  if (!metaData.url) {
    throw new Error(`[Whisper Service Error] No download URL returned for Media ID: ${mediaId}`);
  }
  console.log(`[Whisper Service] \u{1F4E5} Downloading audio stream from Meta CDN...`);
  const mediaRes = await fetch(metaData.url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!mediaRes.ok) {
    throw new Error(`[Whisper Service Error] Failed to download audio binary (${mediaRes.status})`);
  }
  const arrayBuffer = await mediaRes.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    mimeType: metaData.mime_type || "audio/ogg"
  };
}
async function transcribeAudioWithGroq(audioBuffer, filename = "voicenote.ogg") {
  const groqClient = getGroqClient() || groq;
  console.log(`[Whisper Service] \u{1F399}\uFE0F Processing audio buffer (${audioBuffer.byteLength} bytes) with Groq Whisper...`);
  const uint8Array = new Uint8Array(audioBuffer);
  const blob = new Blob([uint8Array], { type: "audio/ogg" });
  const file = new File([blob], filename, { type: "audio/ogg" });
  const whisperModels = ["whisper-large-v3-turbo", "whisper-large-v3"];
  for (const model of whisperModels) {
    try {
      console.log(`[Whisper Service] Sending audio to Groq model: ${model}...`);
      const transcription = await groqClient.audio.transcriptions.create({
        file,
        model,
        prompt: "Hinglish, Hindi, Indian English, Marathi, Tamil, Telugu, WhatsApp voice note ordering food, salon booking, cake, gym membership, bhaiya, parcel, delivery",
        response_format: "text",
        temperature: 0
      });
      const resultText = typeof transcription === "string" ? transcription.trim() : typeof transcription?.text === "string" ? transcription.text.trim() : "";
      if (resultText) {
        console.log(`[Whisper Service] \u2705 Transcription successful (${model}): "${resultText}"`);
        return resultText;
      }
    } catch (err) {
      console.warn(`[Whisper Service Warning] Model "${model}" failed:`, err?.message || err);
    }
  }
  throw new Error("[Whisper Service Error] All Groq Whisper models failed to transcribe audio.");
}

// src/services/partnerAlertService.ts
async function sendPartnerAlert(alert) {
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_PARTNER_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_PARTNER_CHAT_ID;
  const adminWhatsAppNumber = process.env.ADMIN_WHATSAPP_NUMBER || process.env.PARTNER_WHATSAPP_NUMBER;
  const formattedDetails = Object.entries(alert.details).filter(([_, val]) => val !== void 0 && val !== null && val !== "").map(([key, val]) => `*${key.replace(/_/g, " ").toUpperCase()}:* ${val}`).join("\n");
  const messageText = alert.rawMessage || `\u{1F6A8} *${alert.title}*

${formattedDetails}

_Time: ${(/* @__PURE__ */ new Date()).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}_`;
  let sent = false;
  if (telegramBotToken && telegramChatId) {
    try {
      const tgRes = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: messageText,
          parse_mode: "Markdown"
        })
      });
      if (tgRes.ok) {
        console.log(`[PartnerAlert] Telegram alert dispatched successfully: ${alert.title}`);
        sent = true;
      } else {
        const errText = await tgRes.text();
        console.warn(`[PartnerAlert] Telegram alert failed (${tgRes.status}):`, errText);
      }
    } catch (tgErr) {
      console.error("[PartnerAlert] Telegram API error:", tgErr.message);
    }
  }
  if (!sent && adminWhatsAppNumber) {
    try {
      await sendWhatsAppMessage(adminWhatsAppNumber, messageText);
      console.log(`[PartnerAlert] WhatsApp fallback alert sent to partner: ${adminWhatsAppNumber}`);
      sent = true;
    } catch (waErr) {
      console.error("[PartnerAlert] WhatsApp alert failed:", waErr.message);
    }
  }
  if (!sent) {
    console.log(`[PartnerAlert Logged (No webhook target configured)]: ${alert.title}
${messageText}`);
  }
  return sent;
}

// src/services/caService.ts
function normalizePhoneNumber(phone) {
  if (!phone) return "";
  return phone.replace(/\D/g, "");
}
async function findCAClient(identifier) {
  const cleanPhone = identifier.phone ? normalizePhoneNumber(identifier.phone) : "";
  const last10 = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;
  const cleanEmail = identifier.email?.trim().toLowerCase() || "";
  try {
    let query = supabase.from("ca_clients").select("*");
    if (cleanPhone && cleanEmail) {
      query = query.or(`phone.ilike.%${last10}%,email.ilike.%${cleanEmail}%`);
    } else if (cleanPhone) {
      query = query.or(`phone.ilike.%${cleanPhone}%,phone.ilike.%${last10}%`);
    } else if (cleanEmail) {
      query = query.ilike("email", cleanEmail);
    } else {
      return null;
    }
    const { data: clientData } = await query.limit(1).maybeSingle();
    if (clientData) {
      return clientData;
    }
    if (last10) {
      const { data: compData } = await supabase.from("ca_compliance_calendar").select("*").or(`phone.ilike.%${cleanPhone}%,phone.ilike.%${last10}%`).limit(1).maybeSingle();
      if (compData) {
        return {
          id: compData.client_id || `temp-${last10}`,
          business_id: compData.business_id || identifier.businessId,
          client_name: compData.client_name || "Valued Client",
          phone: compData.phone || cleanPhone,
          email: compData.email,
          entity_type: "Proprietorship",
          status: "Active",
          created_at: (/* @__PURE__ */ new Date()).toISOString(),
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      const { data: docData } = await supabase.from("ca_documents_tracker").select("*").or(`phone.ilike.%${cleanPhone}%,phone.ilike.%${last10}%`).limit(1).maybeSingle();
      if (docData) {
        return {
          id: docData.client_id || `temp-${last10}`,
          business_id: docData.business_id || identifier.businessId,
          client_name: docData.client_name || "Valued Client",
          phone: docData.phone || cleanPhone,
          entity_type: "Proprietorship",
          status: "Active",
          created_at: (/* @__PURE__ */ new Date()).toISOString(),
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
    }
    return null;
  } catch (err) {
    console.error("[CAService] findCAClient exception:", err.message);
    return null;
  }
}
async function getClientCompliances(clientId, phone) {
  try {
    const cleanPhone = phone ? normalizePhoneNumber(phone) : "";
    const last10 = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;
    let query = supabase.from("ca_compliance_calendar").select("*");
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isValidUuid = clientId && uuidRegex.test(clientId);
    if (isValidUuid && last10) {
      query = query.or(`client_id.eq.${clientId},phone.ilike.%${last10}%`);
    } else if (isValidUuid) {
      query = query.eq("client_id", clientId);
    } else if (last10) {
      query = query.or(`phone.ilike.%${cleanPhone}%,phone.ilike.%${last10}%`);
    } else {
      return [];
    }
    const { data, error } = await query.order("due_date", { ascending: true });
    if (error) {
      console.warn("[CAService] getClientCompliances error:", error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("[CAService] getClientCompliances exception:", err.message);
    return [];
  }
}
async function getClientDocuments(clientId, phone) {
  try {
    const cleanPhone = phone ? normalizePhoneNumber(phone) : "";
    const last10 = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;
    let query = supabase.from("ca_documents_tracker").select("*");
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isValidUuid = clientId && uuidRegex.test(clientId);
    if (isValidUuid && last10) {
      query = query.or(`client_id.eq.${clientId},phone.ilike.%${last10}%`);
    } else if (isValidUuid) {
      query = query.eq("client_id", clientId);
    } else if (last10) {
      query = query.or(`phone.ilike.%${cleanPhone}%,phone.ilike.%${last10}%`);
    } else {
      return [];
    }
    const { data, error } = await query.order("requested_date", { ascending: false });
    if (error) {
      console.warn("[CAService] getClientDocuments error:", error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("[CAService] getClientDocuments exception:", err.message);
    return [];
  }
}
async function handleCAClientQuery(client, userMessage, channel = "whatsapp", firmName = "Webcore CA & Advisory") {
  const lowerMsg = userMessage.trim().toLowerCase();
  if (lowerMsg === "confirm" || lowerMsg === "proceed" || lowerMsg === "yes" || lowerMsg === "accepted" || lowerMsg.startsWith("confirm") || lowerMsg.startsWith("proceed")) {
    const welcomeConfirm = `\u{1F389} *Welcome to ${firmName}!* \u{1F3DB}\uFE0F

Dear ${client.client_name},
Thank you for confirming! Your engagement has been officially confirmed and activated.

\u{1F4CB} *Next Steps:*
1\uFE0F\u20E3 Our team is setting up your compliance ledger.
2\uFE0F\u20E3 We will send you your tailored document checklist shortly.
3\uFE0F\u20E3 You can ask questions in this chat 24/7 regarding your tax deadlines or filing status!

We look forward to serving you!`;
    await logCAQuery({
      business_id: client.business_id,
      client_id: client.id,
      phone: client.phone,
      email: client.email,
      channel,
      query_text: userMessage,
      ai_response: welcomeConfirm
    });
    return welcomeConfirm;
  }
  const [compliances, documents] = await Promise.all([
    getClientCompliances(client.id, client.phone),
    getClientDocuments(client.id, client.phone)
  ]);
  const systemPrompt = buildCASupportPrompt(firmName, client.client_name, compliances, documents);
  const aiReply = await getGroqChatCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage }
    ],
    { temperature: 0.2 }
  );
  await logCAQuery({
    business_id: client.business_id,
    client_id: client.id,
    phone: client.phone,
    email: client.email,
    channel,
    query_text: userMessage,
    ai_response: aiReply
  });
  return aiReply;
}
async function processIncomingDocument(client, media, firmName = "Webcore CA & Advisory") {
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validBusinessId = client.business_id && uuidRegex.test(client.business_id) ? client.business_id : null;
    const validClientId = client.id && uuidRegex.test(client.id) ? client.id : null;
    const cleanPhone = normalizePhoneNumber(client.phone);
    const last10 = cleanPhone.slice(-10);
    const { data: pendingDocs } = await supabase.from("ca_documents_tracker").select("*").eq("status", "Pending").order("requested_date", { ascending: true });
    const clientPending = (pendingDocs || []).filter((doc) => {
      if (validClientId && doc.client_id === validClientId) return true;
      if (!doc.phone) return false;
      const docClean = normalizePhoneNumber(doc.phone);
      return docClean === cleanPhone || last10 && docClean.endsWith(last10);
    });
    const filename = (media.filename || "").toLowerCase();
    let matchedDoc = void 0;
    if (clientPending.length > 0) {
      matchedDoc = clientPending.find((doc) => {
        const nameLower = (doc.document_name || "").toLowerCase();
        const keywords = nameLower.split(/[\s/,\-_()]+/).filter((k) => k.length > 2);
        return keywords.some((k) => filename.includes(k));
      }) || clientPending[0];
    }
    const storageUrl = media.url || (media.mediaId ? `/api/ca/media/${media.mediaId}` : "#");
    if (matchedDoc) {
      await supabase.from("ca_documents_tracker").update({
        status: "Received",
        received_date: (/* @__PURE__ */ new Date()).toISOString(),
        storage_url: storageUrl,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", matchedDoc.id);
      const replyText = `\u2705 Thank you ${client.client_name}! We have received your *${matchedDoc.document_name}* (${matchedDoc.compliance_type}). Our team will review and verify it shortly.`;
      return { text: replyText, matchedDoc };
    } else {
      await supabase.from("ca_documents_tracker").insert([
        {
          business_id: validBusinessId,
          client_id: validClientId,
          client_name: client.client_name,
          phone: client.phone,
          email: client.email || null,
          compliance_type: "General",
          document_name: media.filename || "Submitted Document / Statement",
          status: "Received",
          storage_url: storageUrl,
          received_date: (/* @__PURE__ */ new Date()).toISOString(),
          requested_date: (/* @__PURE__ */ new Date()).toISOString(),
          followup_count: 0
        }
      ]);
      const replyText = `\u2705 Thank you ${client.client_name}, we have received your document (*${media.filename || "Attachment"}*)! Our team will review it and get back to you if anything else is needed.`;
      return { text: replyText };
    }
  } catch (err) {
    console.error("[CAService] processIncomingDocument error:", err.message);
    return {
      text: `Thank you ${client.client_name}, your document has been received and queued for review.`
    };
  }
}
async function handleCALeadInquiry(phone, userMessage, contactName, source = "WhatsApp", businessId, firmName = "Webcore CA & Advisory") {
  const cleanPhone = normalizePhoneNumber(phone);
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const validBusinessId = businessId && uuidRegex.test(businessId) && businessId !== "demo-business-id" ? businessId : null;
  let existingLead = null;
  const { data: leadQuery } = await supabase.from("ca_leads").select("*").eq("phone", cleanPhone).maybeSingle();
  if (leadQuery) {
    existingLead = leadQuery;
  } else {
    try {
      const { data: newLead } = await supabase.from("ca_leads").insert([
        {
          business_id: validBusinessId,
          name: contactName || "Prospective Client",
          phone: cleanPhone,
          source,
          status: "New",
          followup_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1e3).toISOString().slice(0, 10),
          followup_attempts: 0
        }
      ]).select("*").single();
      existingLead = newLead;
    } catch (dbErr) {
      console.warn("[CAService] Lead insert fallback:", dbErr.message);
    }
  }
  if (!existingLead) {
    existingLead = {
      id: "lead-" + Date.now(),
      name: contactName || "Prospective Client",
      phone: cleanPhone,
      source,
      status: "New",
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  const lowerMsg = userMessage.trim().toLowerCase();
  const isConfirmKeyword = lowerMsg === "confirm" || lowerMsg === "proceed" || lowerMsg === "yes" || lowerMsg === "accepted" || lowerMsg === "i confirm" || lowerMsg.startsWith("confirm") || lowerMsg.startsWith("proceed") || lowerMsg.includes("confirm engagement") || lowerMsg.includes("please proceed");
  if (isConfirmKeyword) {
    const clientName = existingLead.name || contactName || "Valued Client";
    const { data: existingClient } = await supabase.from("ca_clients").select("*").ilike("phone", `%${cleanPhone.slice(-10)}%`).maybeSingle();
    if (!existingClient) {
      await supabase.from("ca_clients").insert({
        business_id: validBusinessId,
        client_name: clientName,
        phone: cleanPhone,
        entity_type: existingLead.business_type || "Private Limited",
        status: "Active"
      });
    }
    await supabase.from("ca_leads").update({
      status: "Converted",
      qualification_score: "Hot",
      notes: `${existingLead.notes ? existingLead.notes + "\n" : ""}[${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}] Engagement confirmed via WhatsApp ('${userMessage}').`,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", existingLead.id);
    existingLead.status = "Converted";
    await sendPartnerAlert({
      type: "hot_lead",
      title: "\u{1F389} New Client Engagement Confirmed (WhatsApp)",
      details: {
        name: clientName,
        phone: cleanPhone,
        status: "Converted to Active Client",
        service: existingLead.requirement || "CA & Tax Advisory",
        confirmation: userMessage
      }
    });
    const welcomeLetter = `\u{1F389} *Welcome to ${firmName}!* \u{1F3DB}\uFE0F

Dear ${clientName},
Thank you for confirming! We are delighted to officially onboard you as a valued client of our firm. Your engagement for *Corporate Compliance & Tax Advisory* is now active.

\u{1F4CB} *Your Onboarding Roadmap:*
1\uFE0F\u20E3 *Client Profile:* Initialized in our Compliance & Filing Directory.
2\uFE0F\u20E3 *Tax Calendar:* Active statutory deadline tracking (GST, ITR & Audit).
3\uFE0F\u20E3 *Document Checklist:* Our team will dispatch your specific filing checklist shortly.
4\uFE0F\u20E3 *24/7 AI Desk:* You can message this WhatsApp chat anytime to check upcoming due dates or pending documents.

\u{1F468}\u200D\u{1F4BC} *Assigned Partner:* Senior CA Engagement Desk
\u{1F4DE} *Priority Support:* Direct WhatsApp Desk Active

We look forward to a successful and seamless financial partnership!`;
    await logCAQuery({
      business_id: businessId,
      client_id: existingLead.id,
      phone: cleanPhone,
      channel: source.toLowerCase(),
      query_text: userMessage,
      ai_response: welcomeLetter
    });
    return { replyText: welcomeLetter, lead: existingLead, isHot: true };
  }
  const qualificationPrompt = buildCALeadQualificationPrompt(firmName);
  const replyText = await getGroqChatCompletion(
    [
      { role: "system", content: qualificationPrompt },
      { role: "user", content: userMessage }
    ],
    { temperature: 0.3 }
  );
  let isHot = false;
  try {
    const classifierPrompt = buildCALeadClassifierPrompt(userMessage, replyText);
    const classificationRaw = await getGroqChatCompletion(
      [{ role: "user", content: classifierPrompt }],
      { temperature: 0.1 }
    );
    const jsonMatch = classificationRaw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      isHot = parsed.score === "Hot";
      await supabase.from("ca_leads").update({
        requirement: parsed.requirement || existingLead.requirement,
        business_type: parsed.business_type || existingLead.business_type,
        urgency: parsed.urgency || existingLead.urgency,
        qualification_score: parsed.score || existingLead.qualification_score,
        status: isHot ? "Hot" : "Qualifying",
        notes: `${existingLead.notes ? existingLead.notes + "\n" : ""}[${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}] ${userMessage}`,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", existingLead.id);
      existingLead.requirement = parsed.requirement;
      existingLead.qualification_score = parsed.score;
    }
  } catch (classErr) {
    console.warn("[CAService] Lead classification parsing error:", classErr.message);
  }
  if (isHot) {
    await sendPartnerAlert({
      type: "hot_lead",
      title: "\u{1F525} Hot CA Lead Inbound",
      details: {
        name: existingLead.name,
        phone: existingLead.phone,
        requirement: existingLead.requirement || "Unclear",
        urgency: existingLead.urgency || "High",
        score: "Hot",
        channel: source,
        message: userMessage
      }
    });
  }
  await logCAQuery({
    business_id: businessId,
    client_id: existingLead.id,
    phone: cleanPhone,
    channel: source.toLowerCase(),
    query_text: userMessage,
    ai_response: replyText
  });
  return { replyText, lead: existingLead, isHot };
}
async function requestClientDocuments(params) {
  const firmName = params.firmName || "Webcore CA & Advisory";
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const validBusinessId = params.businessId && uuidRegex.test(params.businessId) && params.businessId !== "demo-business-id" ? params.businessId : null;
  let client = null;
  if (params.clientId && uuidRegex.test(params.clientId)) {
    const { data: foundClient } = await supabase.from("ca_clients").select("*").eq("id", params.clientId).maybeSingle();
    if (foundClient) {
      client = foundClient;
    }
  }
  if (!client && params.phone) {
    const cleanPhone = normalizePhoneNumber(params.phone);
    const { data: foundByPhone } = await supabase.from("ca_clients").select("*").or(`phone.ilike.%${cleanPhone}%,phone.ilike.%${cleanPhone.slice(-10)}%`).limit(1).maybeSingle();
    if (foundByPhone) {
      client = foundByPhone;
    }
  }
  if (!client) {
    const clientName = params.clientName || (params.clientId && !uuidRegex.test(params.clientId) ? params.clientId : "Valued Client");
    const clientPhone = params.phone || (params.clientId && /^\d+$/.test(params.clientId) ? params.clientId : "919876543210");
    try {
      const { data: newClient, error: createErr } = await supabase.from("ca_clients").insert({
        business_id: validBusinessId,
        client_name: clientName,
        phone: clientPhone,
        email: params.email || null,
        entity_type: "Proprietorship"
      }).select().single();
      if (!createErr && newClient) {
        client = newClient;
      }
    } catch (err) {
      console.warn("[CAService] Auto-create client note:", err.message);
    }
  }
  const finalClientName = client?.client_name || params.clientName || "Valued Client";
  const finalPhone = client?.phone || params.phone || "";
  const finalEmail = client?.email || params.email || null;
  const finalClientId = client?.id && uuidRegex.test(client.id) ? client.id : null;
  const docRows = params.documents.map((docName) => ({
    business_id: validBusinessId,
    client_id: finalClientId,
    client_name: finalClientName,
    phone: finalPhone,
    email: finalEmail,
    compliance_type: params.complianceType,
    document_name: docName.trim(),
    status: "Pending",
    requested_date: (/* @__PURE__ */ new Date()).toISOString(),
    followup_count: 0
  }));
  try {
    const { error: insertErr } = await supabase.from("ca_documents_tracker").insert(docRows);
    if (insertErr) {
      console.error("[CAService] Document rows insert error:", insertErr.message);
    }
  } catch (err) {
    console.error("[CAService] Document tracker insert exception:", err.message);
  }
  const docListFormatted = params.documents.map((d, i) => `${i + 1}. ${d}`).join("\n");
  const prompt = buildCADocumentRequestPrompt(firmName, finalClientName, params.complianceType, docListFormatted);
  let requestMessage = "";
  try {
    requestMessage = await getGroqChatCompletion(
      [{ role: "user", content: prompt }],
      { temperature: 0.2 }
    );
  } catch (aiErr) {
    console.warn("[CAService] Groq drafting fallback:", aiErr.message);
    requestMessage = `Hello ${finalClientName},

This is a request from *${firmName}* for your upcoming *${params.complianceType}* filing.

Please share the following documents at your earliest convenience:
${docListFormatted}

Thank you!`;
  }
  if (finalPhone) {
    try {
      await sendWhatsAppMessage(finalPhone, requestMessage);
    } catch (waErr) {
      console.warn("[CAService] WhatsApp dispatch note:", waErr.message);
    }
  }
  return {
    success: true,
    message: requestMessage,
    createdCount: params.documents.length
  };
}
async function recordInvoicePayment(params) {
  const firmName = params.firmName || "Webcore CA & Advisory";
  const { data: invoice, error: invErr } = await supabase.from("invoices").select("*").eq("id", params.invoiceId).maybeSingle();
  if (invErr || !invoice) {
    console.warn("[CAService] Invoice not found in DB:", params.invoiceId);
    return { success: false, message: "Invoice ID not found" };
  }
  await supabase.from("invoices").update({
    status: "Paid",
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", invoice.id);
  const thanksPrompt = buildCAPaymentThanksPrompt(
    firmName,
    invoice.client_name || "Client",
    invoice.id,
    params.amountPaid || invoice.amount || 0,
    invoice.currency || "INR"
  );
  const thanksMessage = await getGroqChatCompletion(
    [{ role: "user", content: thanksPrompt }],
    { temperature: 0.2 }
  );
  if (invoice.phone) {
    await sendWhatsAppMessage(invoice.phone, thanksMessage);
  }
  return { success: true, message: thanksMessage };
}
async function logCAQuery(log2) {
  try {
    await supabase.from("ca_query_logs").insert([
      {
        business_id: log2.business_id,
        client_id: log2.client_id,
        phone: log2.phone,
        email: log2.email,
        channel: log2.channel || "whatsapp",
        query_text: log2.query_text || "",
        ai_response: log2.ai_response || ""
      }
    ]);
  } catch (err) {
    console.warn("[CAService] logCAQuery warning:", err.message);
  }
}

// src/lib/constants/categoryPresets.ts
var resolveCategoryFromNameOrType = (category, businessName) => {
  const name = (businessName || "").toLowerCase();
  if (category && category !== "bakery" && category !== "custom") {
    return category;
  }
  if (/ca\b|chartered|tax|accountant|accounting|audit|gst\b|itr\b|roc\b|advisory|finances/i.test(name)) {
    return "ca_firm";
  }
  if (/boutique|retail|fashion|apparel|clothing|saree|garment|kurti|dress|wear|collection|store/i.test(name)) {
    return "retail";
  }
  if (/real\s*estate|property|properties|builder|realty|housing|developer|realtor|estates/i.test(name)) {
    return "real_estate";
  }
  if (/clinic|hospital|doctor|dr\.|dentist|dental|care|health|pharma|physician|ayurved/i.test(name)) {
    return "clinic";
  }
  if (/gym|fitness|workout|crossfit|iron|physique|muscle|training/i.test(name)) {
    return "gym";
  }
  if (/tuition|coaching|classes|academy|institute|learning|education|school|tutorial/i.test(name)) {
    return "tuition";
  }
  if (/salon|parlour|parlor|spa|beauty|barber|hair|makeup|nails|glow/i.test(name)) {
    return "salon";
  }
  if (/cafe|coffee|bistro|tea|brew|roasters|lounge|espresso|restro/i.test(name)) {
    return "cafe";
  }
  if (/cake|bake|bakery|pastry|dessert|sweets|patisserie|chocolat/i.test(name)) {
    return "bakery";
  }
  return category || "bakery";
};

// src/services/optOutService.ts
var OUTREACH_ALLOWED_CONSENT = ["opt_in", "legitimate_b2b"];
var OPT_OUT_PATTERN = /(^|\b)(stop|unsubscribe|opt\s?out|optout|remove me|do not (?:contact|message|disturb)|dont (?:contact|message)|no more messages?|block me|band karo|band kar|bandh kara|mat bhejo|mat bhej|message mat|pareshan mat|nahi chahiye)(\b|$)|बंद करो|मत भेजो|मत भेजें|परेशान मत|नको पाठवू/i;
function isOptOutMessage(text) {
  if (!text) return false;
  return OPT_OUT_PATTERN.test(text.trim());
}
function toPhoneDigits(phone) {
  return (phone || "").replace(/\D/g, "");
}
function normalizeIndianPhone(raw) {
  const digits = toPhoneDigits(raw);
  if (!digits) return null;
  let local = digits;
  if (local.length === 12 && local.startsWith("91")) local = local.slice(2);
  else if (local.length === 11 && local.startsWith("0")) local = local.slice(1);
  else if (local.length === 13 && local.startsWith("091")) local = local.slice(3);
  if (local.length !== 10) return null;
  if (!/^[6-9]/.test(local)) return null;
  return `+91${local}`;
}
async function hasOptedOut(phone) {
  const digits = toPhoneDigits(phone);
  if (!digits) return false;
  const last10 = digits.slice(-10);
  const { data, error } = await supabase.from("opt_outs").select("id").like("phone_digits", `%${last10}`).limit(1);
  if (error) {
    console.error("[OptOut] Registry lookup failed \u2014 suppressing send to be safe:", error.message);
    return true;
  }
  return Boolean(data && data.length > 0);
}
async function recordOptOut(params) {
  const digits = toPhoneDigits(params.phone);
  if (!digits) return;
  const { error } = await supabase.from("opt_outs").upsert(
    {
      phone_digits: digits,
      business_id: params.businessId || null,
      reason: params.reason || "user_requested_stop",
      source_text: (params.sourceText || "").slice(0, 500)
    },
    { onConflict: "phone_digits" }
  );
  if (error) {
    console.error("[OptOut] Failed to record opt-out:", error.message);
    return;
  }
  console.log(`[OptOut] \u2705 ${digits} added to the suppression list. No further outbound will be sent.`);
  await supabase.from("lead_hunter_leads").update({ consent_status: "opted_out", status: "opted_out", updated_at: (/* @__PURE__ */ new Date()).toISOString() }).like("phone_number", `%${digits.slice(-10)}`);
}
async function checkOutreachAllowed(params) {
  const normalized = normalizeIndianPhone(params.phone);
  if (!normalized) {
    return { allowed: false, reason: "invalid_phone", detail: `"${params.phone}" is not a valid Indian mobile number` };
  }
  if (await hasOptedOut(normalized)) {
    return { allowed: false, reason: "opted_out", detail: "Recipient is on the opt-out suppression list" };
  }
  const consent = params.consentStatus || "none";
  if (!OUTREACH_ALLOWED_CONSENT.includes(consent)) {
    return {
      allowed: false,
      reason: "no_consent",
      detail: `consent_status="${consent}" \u2014 mark the lead as opt_in or legitimate_b2b (with a recorded reason) before contacting them`
    };
  }
  return { allowed: true, reason: "ok" };
}
function optOutAcknowledgement() {
  return `You've been unsubscribed. \u{1F64F}

You will not receive any further messages from us. Sorry for the interruption.`;
}

// src/services/inboundPipeline.ts
function verifySubscription(params) {
  const expected = ENV.WHATSAPP_VERIFY_TOKEN;
  if (!expected) {
    return { ok: false, reason: "WHATSAPP_VERIFY_TOKEN is not configured on the server." };
  }
  if (params.mode !== "subscribe") {
    return { ok: false, reason: `Unexpected hub.mode "${params.mode}".` };
  }
  if (!params.challenge) {
    return { ok: false, reason: "Missing hub.challenge." };
  }
  const provided = params.token || "";
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  const matches = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!matches) {
    return { ok: false, reason: "hub.verify_token does not match WHATSAPP_VERIFY_TOKEN." };
  }
  return { ok: true, challenge: String(params.challenge) };
}
function verifyPayloadSignature(rawBody, signatureHeader) {
  const secret = ENV.WHATSAPP_APP_SECRET;
  if (!secret) {
    console.warn("[Webhook] \u26A0\uFE0F WHATSAPP_APP_SECRET not set \u2014 accepting payload WITHOUT signature verification.");
    return true;
  }
  if (!signatureHeader) {
    console.error("[Webhook] \u274C Missing x-hub-signature-256 header. Rejecting payload.");
    return false;
  }
  const expected = "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(signatureHeader);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    console.error("[Webhook] \u274C Signature length mismatch. Rejecting payload.");
    return false;
  }
  const valid = crypto.timingSafeEqual(a, b);
  if (!valid) console.error("[Webhook] \u274C Invalid x-hub-signature-256. Rejecting payload.");
  return valid;
}
async function parseInboundWebhook(body) {
  if (body?.object !== "whatsapp_business_account") return [];
  const parsed = [];
  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      const value = change?.value;
      const businessNumber = value?.metadata?.display_phone_number || "";
      const contactProfile = value?.contacts?.[0];
      for (const message of value?.messages || []) {
        const customerNumber = message.from;
        let messageText = "";
        let isVoiceNote = false;
        let isMediaDocument = false;
        let mediaPayload = {};
        if (message.type === "text") {
          messageText = message.text?.body || "";
        } else if (message.type === "interactive") {
          const buttonReply = message.interactive?.button_reply;
          const listReply = message.interactive?.list_reply;
          messageText = buttonReply?.title || buttonReply?.id || listReply?.title || listReply?.id || "[Interactive Click]";
          console.log(`[Webhook] \u{1F518} Interactive click: "${messageText}"`);
        } else if (message.type === "button") {
          messageText = message.button?.text || message.button?.payload || "[Button Click]";
        } else if (message.type === "audio" || message.type === "voice") {
          const audioObj = message.audio || message.voice;
          const mediaId = audioObj?.id;
          if (!mediaId) {
            console.warn("[Webhook] \u26A0\uFE0F Audio message missing media ID. Skipping.");
            continue;
          }
          try {
            const { buffer } = await downloadWhatsAppMedia(mediaId);
            messageText = await transcribeAudioWithGroq(buffer, "voicenote.ogg");
            isVoiceNote = true;
            console.log(`[Webhook] \u{1F399}\uFE0F Transcribed voice note: "${messageText}"`);
          } catch (voiceErr) {
            console.error("[Webhook] Voice transcription failed:", voiceErr?.message || voiceErr);
            await sendMessage(
              customerNumber,
              businessNumber,
              "\u{1F64F} Sorry, I couldn't clearly hear your voice note. Could you please send it again or type your message?"
            );
            continue;
          }
        } else if (message.type === "document" || message.type === "image") {
          isMediaDocument = true;
          const mediaObj = message.document || message.image;
          mediaPayload = {
            mediaId: mediaObj?.id,
            mimeType: mediaObj?.mime_type,
            filename: mediaObj?.filename || (message.type === "image" ? "photo.jpg" : "document.pdf")
          };
          messageText = mediaObj?.caption || `[Attached ${message.type === "image" ? "Image" : "Document"}: ${mediaPayload.filename}]`;
        } else {
          console.log(`[Webhook] Ignoring message type: ${message.type}`);
          continue;
        }
        if (!messageText.trim() && !isMediaDocument) continue;
        parsed.push({
          businessNumber,
          customerNumber,
          messageText,
          profileName: contactProfile?.profile?.name || contactProfile?.name,
          isVoiceNote,
          isMediaDocument,
          mediaPayload,
          messageType: message.type
        });
      }
    }
  }
  return parsed;
}
async function processWebhookPayload(body) {
  const messages = await parseInboundWebhook(body);
  for (const msg of messages) {
    try {
      await handleInboundMessage(msg);
    } catch (err) {
      console.error(`[Webhook Pipeline] Exception handling message from ${msg.customerNumber}:`, err?.message || err);
    }
  }
}
async function handleInboundMessage(inbound) {
  const { businessNumber, customerNumber, messageText, isVoiceNote, isMediaDocument, mediaPayload } = inbound;
  console.log(`
======================================================`);
  console.log(
    `[Webhook] \u{1F4E5} INBOUND ${isVoiceNote ? "(\u{1F399}\uFE0F Voice)" : isMediaDocument ? "(\u{1F4C4} Media)" : "(\u{1F4AC} Text)"}`
  );
  console.log(`[Webhook] To business : ${businessNumber}`);
  console.log(`[Webhook] From        : ${customerNumber}`);
  console.log(`[Webhook] Content     : "${messageText}"`);
  console.log(`======================================================`);
  if (isOptOutMessage(messageText)) {
    console.log(`[Webhook] \u{1F6D1} Opt-out request from ${customerNumber}.`);
    const business2 = await getBusinessByWhatsappNumber(businessNumber);
    await recordOptOut({
      phone: customerNumber,
      businessId: business2?.id || null,
      reason: "inbound_stop_message",
      sourceText: messageText
    });
    await sendMessage(customerNumber, businessNumber, optOutAcknowledgement());
    if (business2) {
      await saveConversationMessage(business2.id, customerNumber, "inbound", messageText);
      await saveConversationMessage(business2.id, customerNumber, "outbound", optOutAcknowledgement());
    }
    return;
  }
  const business = await getBusinessByWhatsappNumber(businessNumber);
  if (!business) {
    console.warn(
      `[Webhook Pipeline] \u26A0\uFE0F No business registered for ${businessNumber}. Dropping message from ${customerNumber}.`
    );
    return;
  }
  console.log(`[Webhook Pipeline] \u2705 Tenant: "${business.name}" (${business.id}) [${business.category}]`);
  const messageToSave = isMediaDocument ? `\u{1F4C4} [Document Upload]: ${mediaPayload.filename}` : isVoiceNote ? `\u{1F399}\uFE0F [Voice Note]: ${messageText}` : messageText;
  await saveConversationMessage(business.id, customerNumber, "inbound", messageToSave);
  const handledAsProspect = await handleProspectReply(inbound, business);
  if (handledAsProspect) return;
  const configs = await getBusinessConfigs(business.id);
  const isBotPaused = configs.some(
    (c) => c.config_key === "bot_paused" && (c.config_value === true || c.config_value === "true")
  );
  if (isBotPaused) {
    console.log(`[Webhook Pipeline] \u23F8\uFE0F AI agent paused by owner for "${business.name}". Logged, not answered.`);
    return;
  }
  const isTrialExpired = business.subscription_status === "expired" || business.subscription_status === "trial" && business.trial_end_date && new Date(business.trial_end_date).getTime() < Date.now();
  if (isTrialExpired) {
    console.warn(`[Webhook Pipeline] \u26A0\uFE0F "${business.name}" trial expired (${business.trial_end_date}).`);
    const unavailableNotice = `\u26A0\uFE0F *${business.name} Support Notice*

Our automated AI assistant trial has ended. Please contact our team directly, or visit the owner dashboard to renew the subscription (\u20B9999/month) and resume instant AI replies.`;
    await sendMessage(customerNumber, business.whatsapp_number, unavailableNotice);
    await saveConversationMessage(business.id, customerNumber, "outbound", unavailableNotice);
    return;
  }
  const effectiveCategory = resolveCategoryFromNameOrType(business.category, business.name);
  if (effectiveCategory === "ca_firm") {
    await handleCAFirmBranch(inbound, business);
    return;
  }
  const isHospitalOrClinic = effectiveCategory === "hospital" || effectiveCategory === "clinic";
  const ratingMatch = messageText.trim().match(/^([1-5])(\s*(star|stars|\/5|\.0)?)?$/i);
  if (isHospitalOrClinic && ratingMatch) {
    await handleFeedbackRating(inbound, business, parseInt(ratingMatch[1], 10));
    return;
  }
  await handleStandardAIReply(inbound, business, configs);
}
async function handleProspectReply(inbound, business) {
  const { customerNumber, messageText, businessNumber, profileName } = inbound;
  const cleanSender = customerNumber.replace(/\D/g, "");
  const last10 = cleanSender.slice(-10);
  if (last10.length !== 10) return false;
  const { data: lead } = await supabase.from("lead_hunter_leads").select("id, business_name, status, consent_status").like("phone_number", `%${last10}`).limit(1).maybeSingle();
  if (!lead) return false;
  if (lead.status === "pending") return false;
  console.log(`[Webhook] \u{1F4E3} Reply from pitched prospect "${lead.business_name}" (${customerNumber}).`);
  const isPositive = /(yes|interested|demo|show demo|call me|tell me|cost|price|pricing|batao|haan|ready|need website|need app|sure|connect|schedule|karna hai|btn_show_demo|btn_pricing)/i.test(
    messageText
  );
  const isNegative = /(not now|not interested|no thanks|nahi|btn_not_now)/i.test(messageText);
  await supabase.from("lead_hunter_leads").update({ status: "replied", updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", lead.id);
  if (ENV.ADMIN_ALERT_NUMBER) {
    const alertHeader = isPositive ? `\u{1F525} *HOT LEAD REPLY*` : isNegative ? `\u2139\uFE0F *Prospect declined*` : `\u{1F4AC} *New prospect reply*`;
    const adminAlertText = `${alertHeader}

\u{1F3E2} *Business*: ${lead.business_name}
\u{1F464} *Contact*: ${profileName || "Prospect"}
\u{1F4F1} *Phone*: ${customerNumber}
\u{1F4AC} *Message*: "${messageText}"
\u23F0 *Time*: ${(/* @__PURE__ */ new Date()).toLocaleTimeString("en-IN")}

\u{1F449} https://wa.me/${cleanSender}`;
    await sendMessage(ENV.ADMIN_ALERT_NUMBER, businessNumber, adminAlertText);
  } else {
    console.warn("[Webhook] ADMIN_ALERT_NUMBER not configured \u2014 prospect alert not sent.");
  }
  if (isNegative) {
    await recordOptOut({
      phone: customerNumber,
      businessId: business.id,
      reason: "prospect_declined",
      sourceText: messageText
    });
    const declineAck = `Understood \u2014 thank you for your time. \u{1F64F}

We won't message you again. If you ever want to look at a website, app, or WhatsApp automation, we're a message away.`;
    await sendMessage(customerNumber, businessNumber, declineAck);
    await saveConversationMessage(business.id, customerNumber, "outbound", declineAck);
    return true;
  }
  if (isPositive) {
    const confirmText = `\u{1F64F} *Thank you for your interest!*

Our team has received your response and will connect with you shortly with a live custom demo and pricing.` + (ENV.ADMIN_ALERT_NUMBER ? `

Need us sooner? Call or WhatsApp *+${ENV.ADMIN_ALERT_NUMBER}*. \u{1F680}` : "");
    await sendMessage(customerNumber, businessNumber, confirmText);
    await saveConversationMessage(business.id, customerNumber, "outbound", confirmText);
    return true;
  }
  return false;
}
async function handleCAFirmBranch(inbound, business) {
  const { customerNumber, messageText, isMediaDocument, mediaPayload, profileName } = inbound;
  let caClient = await findCAClient({ phone: customerNumber, businessId: business.id });
  if (isMediaDocument) {
    if (!caClient) {
      const senderName = profileName || `Client (${customerNumber.slice(-4)})`;
      const { data: newClient } = await supabase.from("ca_clients").insert({
        business_id: business.id,
        client_name: senderName,
        phone: customerNumber,
        entity_type: "Proprietorship"
      }).select().maybeSingle();
      caClient = newClient || {
        business_id: business.id,
        client_name: senderName,
        phone: customerNumber,
        entity_type: "Proprietorship"
      };
    }
    const docRes = await processIncomingDocument(caClient, mediaPayload, business.name);
    await sendMessage(customerNumber, business.whatsapp_number, docRes.text);
    await saveConversationMessage(business.id, customerNumber, "outbound", docRes.text);
    return;
  }
  if (caClient) {
    const supportReply = await handleCAClientQuery(caClient, messageText, "whatsapp", business.name);
    await sendMessage(customerNumber, business.whatsapp_number, supportReply);
    await saveConversationMessage(business.id, customerNumber, "outbound", supportReply);
    return;
  }
  const leadRes = await handleCALeadInquiry(
    customerNumber,
    messageText,
    profileName,
    "WhatsApp",
    business.id,
    business.name
  );
  await sendMessage(customerNumber, business.whatsapp_number, leadRes.replyText);
  await saveConversationMessage(business.id, customerNumber, "outbound", leadRes.replyText);
}
async function handleFeedbackRating(inbound, business, numericRating) {
  const { customerNumber, profileName } = inbound;
  console.log(`[Webhook Pipeline] \u2B50 Feedback rating ${numericRating}/5 for ${business.id}`);
  const { data: recentAppt } = await supabase.from("hospital_appointments").select("id, patient_name, doctor_name, patient_phone").eq("business_id", business.id).eq("patient_phone", customerNumber).order("created_at", { ascending: false }).limit(1).maybeSingle();
  const patientName = recentAppt?.patient_name || profileName || "Patient";
  const doctorName = recentAppt?.doctor_name || "your doctor";
  const isUnhappy = numericRating <= 3;
  await supabase.from("hospital_feedback").insert([
    {
      business_id: business.id,
      appointment_id: recentAppt?.id || null,
      patient_name: patientName,
      patient_phone: customerNumber,
      doctor_name: doctorName,
      rating: numericRating,
      status: isUnhappy ? "escalated" : "responded",
      google_review_requested: !isUnhappy,
      apology_sent: isUnhappy,
      responded_at: (/* @__PURE__ */ new Date()).toISOString()
    }
  ]);
  const feedbackReply = isUnhappy ? `\u{1F64F} *We sincerely apologise*

Namaste ${patientName} ji,

We're sorry your experience didn't meet expectations (${numericRating}/5 \u2B50).

Our patient care supervisor has been notified and will reach out to resolve your concern. You can also reply here with any details.` : `\u2B50 *Thank you for your ${numericRating}-star rating!*

Namaste ${patientName} ji,

We're glad you had a positive consultation with *${doctorName}* (${numericRating}/5 \u2B50).

Your feedback helps us keep improving. Stay healthy!`;
  await sendMessage(customerNumber, business.whatsapp_number, feedbackReply);
  await saveConversationMessage(business.id, customerNumber, "outbound", feedbackReply);
}
async function handleStandardAIReply(inbound, business, configs) {
  const { customerNumber, messageText } = inbound;
  const [history, systemPrompt] = await Promise.all([
    getRecentConversations(business.id, customerNumber, 4),
    buildSystemPrompt(business.id).catch((pErr) => {
      console.warn("[Webhook Pipeline] Prompt builder fallback:", pErr);
      return `You are a helpful customer service assistant for ${business.name}.`;
    })
  ]);
  const aiResponseText = await getResponse2(systemPrompt, history, messageText, business, configs);
  let replyText = aiResponseText;
  let capturedData = null;
  const xmlTagMatch = replyText.match(/<order_capture>([\s\S]*?)<\/order_capture>/i);
  if (xmlTagMatch) {
    try {
      const parsed = JSON.parse(xmlTagMatch[1].trim());
      capturedData = parsed.capture || parsed;
      replyText = replyText.replace(xmlTagMatch[0], "").trim();
    } catch (_) {
    }
  }
  if (!capturedData) {
    const codeBlockMatch = replyText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i);
    if (codeBlockMatch) {
      try {
        const parsed = JSON.parse(codeBlockMatch[1]);
        capturedData = parsed.capture || parsed;
        replyText = replyText.replace(codeBlockMatch[0], "").trim();
      } catch (_) {
      }
    }
  }
  if (!capturedData) {
    const firstBrace = replyText.indexOf("{");
    const lastBrace = replyText.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const potentialJson = replyText.slice(firstBrace, lastBrace + 1);
      try {
        const parsed = JSON.parse(potentialJson);
        if (parsed.capture || parsed.type || parsed.details || parsed.items) {
          capturedData = parsed.capture || parsed;
          replyText = (replyText.slice(0, firstBrace) + replyText.slice(lastBrace + 1)).trim();
        }
      } catch (_) {
        const captureIdx = replyText.indexOf('"capture"');
        if (captureIdx !== -1) {
          const startBrace = replyText.lastIndexOf("{", captureIdx);
          if (startBrace !== -1) {
            try {
              const parsed = JSON.parse(replyText.slice(startBrace, lastBrace + 1));
              capturedData = parsed.capture || parsed;
              replyText = (replyText.slice(0, startBrace) + replyText.slice(lastBrace + 1)).trim();
            } catch (_2) {
            }
          }
        }
      }
    }
  }
  if (!capturedData) {
    const fullHistory = [...history, { sender: "inbound", message: messageText }];
    capturedData = await extractStructuredCapture2(fullHistory, business.category);
  }
  replyText = replyText.replace(/<order_capture>[\s\S]*?(?:<\/order_capture>|$)/gi, "").replace(/```(?:json)?[\s\S]*?(?:```|$)/gi, "").replace(/\{[\s\S]*?(?:\}|$)/gi, "").replace(/"(?:type|capture|details|items|total|fulfillment|delivery_address|appointment_time)"\s*:[\s\S]*$/gim, "").replace(/```[a-z]*$/gi, "").replace(/`+$/g, "").trim();
  const isCancelIntent = /\b(cancel|cancle|discard|abort)\b/i.test(messageText) || capturedData?.action === "cancel" || capturedData?.status === "cancelled";
  if (isCancelIntent) {
    const isCancelAll = /\b(all|everything|both|entire|orders)\b/i.test(messageText) || capturedData?.all === true || capturedData?.cancel_all === true;
    console.log(`[Webhook Pipeline] \u274C Cancellation intent (all: ${isCancelAll}) for ${customerNumber}`);
    await cancelOrdersForCustomer(business.id, customerNumber, isCancelAll);
  } else if (capturedData) {
    const details = capturedData.details || capturedData;
    const items = Array.isArray(details?.items) ? details.items : typeof details?.items === "string" ? [{ name: details.items }] : [];
    const hasValidItems = items.some((it) => {
      const name = (typeof it === "string" ? it : it?.name || "").toLowerCase().trim();
      return name.length > 1 && !name.includes("greeting") && !name.includes("hello") && !name.includes("hi") && !name.includes("inquiry") && !name.includes("not specified") && !name.includes("none");
    });
    const hasAppointmentDetails = Boolean(
      details?.appointment_time || details?.slot || details?.date || details?.time
    );
    const isValidCapture = (hasValidItems || hasAppointmentDetails) && details?.confirmed !== false && details?.action !== "none";
    if (isValidCapture) {
      console.log(`[Webhook Pipeline] \u{1F4E6} Capture extracted:`, JSON.stringify(capturedData));
      const defaultType = business.category === "salon" || business.category === "clinic" || business.category === "hospital" ? "booking" : business.category === "tuition" || business.category === "real_estate" || business.category === "ca_firm" ? "lead" : "order";
      await saveCapturedRecord(business.id, capturedData.type || defaultType, customerNumber, details);
    } else {
      console.log(`[Webhook Pipeline] \u2139\uFE0F General inquiry \u2014 no ledger record created.`);
    }
  }
  const sendResult = await sendMessage(customerNumber, business.whatsapp_number, replyText);
  if (!sendResult.success) {
    console.error(`[Webhook Pipeline] \u274C Reply to ${customerNumber} was NOT delivered: ${sendResult.error}`);
  }
  await saveConversationMessage(business.id, customerNumber, "outbound", replyText);
  console.log(`[Webhook Pipeline] \u2705 Processed message for "${business.name}".
`);
}

// src/routes/webhook.ts
var router2 = Router2();
router2.get("/webhook", (req, res) => {
  const result = verifySubscription({
    mode: req.query["hub.mode"],
    token: req.query["hub.verify_token"],
    challenge: req.query["hub.challenge"]
  });
  if (!result.ok) {
    console.warn(`[Webhook Verification] \u274C Rejected: ${result.reason}`);
    return res.sendStatus(403);
  }
  console.log("[Webhook Verification] \u2705 Token matched. Echoing challenge.");
  res.setHeader("Content-Type", "text/plain");
  return res.status(200).send(result.challenge);
});
router2.post("/webhook", async (req, res) => {
  const rawBody = req.rawBody ?? JSON.stringify(req.body ?? {});
  if (!verifyPayloadSignature(rawBody, req.header("x-hub-signature-256"))) {
    return res.sendStatus(403);
  }
  res.status(200).send("EVENT_RECEIVED");
  try {
    await processWebhookPayload(req.body);
  } catch (err) {
    console.error("[Webhook Pipeline Exception]:", err?.message || err);
  }
});
var webhook_default = router2;

// src/routes/billing.ts
import { Router as Router3 } from "express";
import Razorpay from "razorpay";
import crypto2 from "crypto";
init_env();

// src/config/plans.ts
var PLANS = {
  monthly_999: {
    key: "monthly_999",
    amountPaise: 99900,
    currency: "INR",
    durationDays: 30,
    label: "Pro Monthly",
    period: "month"
  },
  annual_9990: {
    key: "annual_9990",
    amountPaise: 999e3,
    currency: "INR",
    durationDays: 365,
    label: "Annual Saver",
    period: "year"
  }
};
var DEFAULT_PLAN_KEY = "monthly_999";
var LEGACY_PLAN_KEYS = {
  monthly_1: "monthly_999",
  annual_10: "annual_9990",
  monthly: "monthly_999",
  annual: "annual_9990"
};
function resolvePlan(key) {
  if (typeof key !== "string") return null;
  const trimmed = key.trim();
  if (trimmed in PLANS) return PLANS[trimmed];
  const legacy = LEGACY_PLAN_KEYS[trimmed];
  return legacy ? PLANS[legacy] : null;
}
function accessEndDate(plan, from = /* @__PURE__ */ new Date()) {
  return new Date(from.getTime() + plan.durationDays * 24 * 60 * 60 * 1e3).toISOString();
}

// src/routes/billing.ts
var router3 = Router3();
var MONTHLY = PLANS[DEFAULT_PLAN_KEY];
function razorpayClient() {
  if (!ENV.RAZORPAY_KEY_ID || !ENV.RAZORPAY_KEY_SECRET) return null;
  return new Razorpay({ key_id: ENV.RAZORPAY_KEY_ID, key_secret: ENV.RAZORPAY_KEY_SECRET });
}
router3.post("/create-subscription", async (req, res) => {
  try {
    const { business_id } = req.body;
    if (!business_id) {
      return res.status(400).json({ error: "business_id is required" });
    }
    const razorpay = razorpayClient();
    if (!razorpay || !ENV.RAZORPAY_PLAN_ID) {
      console.error("[Billing API] RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET / RAZORPAY_PLAN_ID are not configured.");
      return res.status(503).json({
        error: "Subscriptions are not configured on this server.",
        hint: "Set RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET and RAZORPAY_PLAN_ID."
      });
    }
    console.log(`[Billing API] Creating subscription for business_id: ${business_id}`);
    const { data: business, error: busErr } = await supabase.from("businesses").select("id, name, owner_email, whatsapp_number, razorpay_customer_id").eq("id", business_id).maybeSingle();
    if (busErr) {
      console.error("[Billing API] Business lookup failed:", busErr.message);
      return res.status(500).json({ error: busErr.message });
    }
    if (!business) {
      return res.status(404).json({ error: `No business found with id ${business_id}.` });
    }
    if (!business.owner_email) {
      return res.status(400).json({
        error: "This business has no owner email on file, which Razorpay requires to create a customer."
      });
    }
    let customerId = business.razorpay_customer_id;
    if (!customerId) {
      try {
        const customer = await razorpay.customers.create({
          name: business.name,
          email: business.owner_email,
          contact: business.whatsapp_number || void 0,
          notes: { business_id: business.id }
        });
        customerId = customer.id;
      } catch (custErr) {
        const detail = custErr?.error?.description || custErr?.message || "unknown error";
        console.error("[Billing API] Razorpay customer creation failed:", detail);
        return res.status(502).json({ error: `Razorpay could not create the customer: ${detail}` });
      }
    }
    let subscriptionId;
    try {
      const subscription = await razorpay.subscriptions.create({
        plan_id: ENV.RAZORPAY_PLAN_ID,
        customer_notify: 1,
        total_count: 12,
        notes: { business_id: business.id, plan: MONTHLY.key }
      });
      subscriptionId = subscription.id;
    } catch (subErr) {
      const detail = subErr?.error?.description || subErr?.message || "unknown error";
      console.error("[Billing API] Razorpay subscription creation failed:", detail);
      return res.status(502).json({ error: `Razorpay could not create the subscription: ${detail}` });
    }
    const { error: saveErr } = await supabase.from("businesses").update({
      razorpay_customer_id: customerId,
      razorpay_subscription_id: subscriptionId
    }).eq("id", business.id);
    if (saveErr) {
      console.error("[Billing API] Subscription created but could not be saved:", saveErr.message);
    }
    return res.json({
      subscription_id: subscriptionId,
      razorpay_key_id: ENV.RAZORPAY_KEY_ID,
      amount: MONTHLY.amountPaise,
      currency: MONTHLY.currency,
      plan: MONTHLY.key,
      plan_id: ENV.RAZORPAY_PLAN_ID
    });
  } catch (err) {
    console.error("[Billing API Exception] create-subscription:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
});
router3.post("/webhook", async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    if (!ENV.RAZORPAY_WEBHOOK_SECRET) {
      console.error("[Billing Webhook] RAZORPAY_WEBHOOK_SECRET is not set \u2014 refusing unverifiable webhooks.");
      return res.status(503).json({ error: "Webhook secret is not configured on this server." });
    }
    if (!signature) {
      console.warn("[Billing Webhook] Request had no x-razorpay-signature header.");
      return res.status(401).json({ error: "Missing x-razorpay-signature." });
    }
    const rawBody = req.rawBody ?? JSON.stringify(req.body);
    const expected = crypto2.createHmac("sha256", ENV.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest("hex");
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signature, "utf8");
    if (a.length !== b.length || !crypto2.timingSafeEqual(a, b)) {
      console.warn("[Billing Webhook] \u274C Signature mismatch \u2014 rejecting.");
      return res.status(401).json({ error: "Invalid webhook signature." });
    }
    const payload = req.body;
    const eventType = payload.event;
    const eventData = payload.payload;
    console.log("[Billing Webhook] \u2705 Verified event:", eventType);
    if (eventType === "subscription.activated" || eventType === "subscription.authenticated") {
      const subEntity = eventData?.subscription?.entity;
      if (!subEntity) {
        console.warn("[Billing Webhook] Subscription event carried no entity.");
        return res.status(200).json({ status: "ignored" });
      }
      const businessId = subEntity.notes?.business_id;
      const subId = subEntity.id;
      const plan = resolvePlan(subEntity.notes?.plan) || MONTHLY;
      console.log(`[Billing Webhook] Subscription activated: ${subId} (business ${businessId || "unknown"})`);
      const update = {
        subscription_status: "active",
        plan: plan.key,
        trial_end_date: accessEndDate(plan)
      };
      if (businessId) {
        await supabase.from("businesses").update({ ...update, razorpay_subscription_id: subId }).eq("id", businessId);
      } else if (subId) {
        await supabase.from("businesses").update(update).eq("razorpay_subscription_id", subId);
      }
    } else if (eventType === "subscription.charged" || eventType === "payment.captured") {
      const paymentEntity = eventData?.payment?.entity || eventData?.subscription?.entity;
      if (!paymentEntity?.id) {
        console.warn("[Billing Webhook] Charge event carried no payment entity.");
        return res.status(200).json({ status: "ignored" });
      }
      const paymentId = paymentEntity.id;
      const amount = typeof paymentEntity.amount === "number" ? paymentEntity.amount : null;
      const subId = paymentEntity.subscription_id || eventData?.subscription?.entity?.id;
      const plan = resolvePlan(paymentEntity.notes?.plan) || MONTHLY;
      console.log(`[Billing Webhook] Payment charged: ${paymentId}${amount !== null ? ` (\u20B9${amount / 100})` : ""}`);
      let targetBusinessId = paymentEntity.notes?.business_id;
      if (!targetBusinessId && subId) {
        const { data: bus } = await supabase.from("businesses").select("id").eq("razorpay_subscription_id", subId).maybeSingle();
        if (bus) targetBusinessId = bus.id;
      }
      if (!targetBusinessId) {
        console.error(
          `[Billing Webhook] Payment ${paymentId} could not be matched to a business \u2014 needs manual reconciliation.`
        );
        return res.status(200).json({ status: "unmatched", payment_id: paymentId });
      }
      const { data: existing } = await supabase.from("payment_events").select("id").eq("razorpay_payment_id", paymentId).maybeSingle();
      if (!existing) {
        await supabase.from("payment_events").insert({
          business_id: targetBusinessId,
          razorpay_payment_id: paymentId,
          razorpay_order_id: paymentEntity.order_id || null,
          amount,
          status: "success"
        });
      }
      await supabase.from("businesses").update({
        subscription_status: "active",
        plan: plan.key,
        trial_end_date: accessEndDate(plan)
      }).eq("id", targetBusinessId);
    } else if (eventType === "subscription.cancelled" || eventType === "subscription.halted") {
      const subId = eventData?.subscription?.entity?.id;
      if (subId) {
        console.log(`[Billing Webhook] Subscription cancelled/halted: ${subId}`);
        await supabase.from("businesses").update({ subscription_status: "expired" }).eq("razorpay_subscription_id", subId);
      }
    }
    return res.status(200).json({ status: "ok" });
  } catch (err) {
    console.error("[Billing Webhook Error]:", err);
    return res.status(500).json({ error: err.message });
  }
});
router3.post("/check-trials", async (_req, res) => {
  try {
    const nowIso2 = (/* @__PURE__ */ new Date()).toISOString();
    const { data: expiredBusinesses, error } = await supabase.from("businesses").select("id, name, trial_end_date").eq("subscription_status", "trial").lt("trial_end_date", nowIso2);
    if (error) {
      console.error("[Billing Trial Checker Error]:", error);
      return res.status(500).json({ error: error.message });
    }
    let updatedCount = 0;
    if (expiredBusinesses && expiredBusinesses.length > 0) {
      for (const bus of expiredBusinesses) {
        const { error: updateErr } = await supabase.from("businesses").update({ subscription_status: "expired" }).eq("id", bus.id);
        if (updateErr) {
          console.error(`[Trial Checker] Could not expire ${bus.name} (${bus.id}):`, updateErr.message);
          continue;
        }
        updatedCount++;
        console.log(`[Trial Checker] Expired trial for business: ${bus.name} (${bus.id})`);
      }
    }
    return res.json({
      status: "ok",
      checked_at: nowIso2,
      expired_count: updatedCount
    });
  } catch (err) {
    console.error("[Trial Checker Exception]:", err);
    return res.status(500).json({ error: err.message });
  }
});
var billing_default = router3;

// src/routes/invoice.ts
import { Router as Router4 } from "express";

// src/services/invoiceService.ts
import { jsPDF } from "jspdf";
async function generateInvoicePdfBuffer(data) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4"
  });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 35;
  const contentWidth = pageWidth - margin * 2;
  const tealPrimary = [15, 118, 110];
  const tealLight = [240, 253, 250];
  const tealBorder = [153, 246, 228];
  const darkInk = [31, 41, 55];
  const mutedGray = [107, 114, 128];
  const lightGrayBg = [249, 250, 251];
  doc.setFillColor(lightGrayBg[0], lightGrayBg[1], lightGrayBg[2]);
  doc.roundedRect(margin, 30, contentWidth, 75, 4, 4, "F");
  doc.setTextColor(tealPrimary[0], tealPrimary[1], tealPrimary[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(data.businessName || "Business Store", margin + 15, 56);
  doc.setTextColor(mutedGray[0], mutedGray[1], mutedGray[2]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`${(data.businessCategory || "Store").toUpperCase()} \u2022 VERIFIED WHATSAPP COMMERCE`, margin + 15, 72);
  if (data.gstNumber) {
    doc.text(`GSTIN / Tax ID: ${data.gstNumber}`, margin + 15, 86);
  }
  const invoiceCode = `INV-${new Date(data.createdAt).getFullYear()}-${data.orderId.slice(0, 6).toUpperCase()}`;
  doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("TAX INVOICE / RECEIPT", pageWidth - margin - 15, 52, { align: "right" });
  doc.setTextColor(mutedGray[0], mutedGray[1], mutedGray[2]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`Bill No: ${invoiceCode}`, pageWidth - margin - 15, 66, { align: "right" });
  doc.text(
    `Date: ${new Date(data.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`,
    pageWidth - margin - 15,
    78,
    { align: "right" }
  );
  doc.text(
    `Time: ${new Date(data.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`,
    pageWidth - margin - 15,
    90,
    { align: "right" }
  );
  const boxY = 120;
  const boxWidth = (contentWidth - 15) / 2;
  const boxHeight = 80;
  doc.setFillColor(lightGrayBg[0], lightGrayBg[1], lightGrayBg[2]);
  doc.roundedRect(margin, boxY, boxWidth, boxHeight, 3, 3, "F");
  doc.setTextColor(tealPrimary[0], tealPrimary[1], tealPrimary[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("BILLED TO (CUSTOMER):", margin + 10, boxY + 16);
  doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`Phone: ${data.customerNumber || "N/A"}`, margin + 10, boxY + 30);
  doc.text(`Fulfillment: ${data.fulfillment || "Delivery / Pickup"}`, margin + 10, boxY + 44);
  const addressText = data.deliveryAddress ? `Address: ${data.deliveryAddress}` : "Address: Store Counter / Walk-in";
  const splitAddress = doc.splitTextToSize(addressText, boxWidth - 20);
  doc.text(splitAddress, margin + 10, boxY + 58);
  const rightBoxX = margin + boxWidth + 15;
  doc.setFillColor(lightGrayBg[0], lightGrayBg[1], lightGrayBg[2]);
  doc.roundedRect(rightBoxX, boxY, boxWidth, boxHeight, 3, 3, "F");
  doc.setTextColor(tealPrimary[0], tealPrimary[1], tealPrimary[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("PAYMENT & STORE INFO:", rightBoxX + 10, boxY + 16);
  doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`Store Contact: ${data.businessPhone || "Via WhatsApp"}`, rightBoxX + 10, boxY + 30);
  doc.text(`UPI VPA: ${data.upiId || "Counter / Cash"}`, rightBoxX + 10, boxY + 44);
  const isPaid = data.paymentStatus === "paid";
  if (isPaid) {
    doc.setTextColor(5, 150, 105);
    doc.setFont("helvetica", "bold");
    doc.text("Status: PAID VIA UPI [VERIFIED]", rightBoxX + 10, boxY + 58);
  } else {
    doc.setTextColor(217, 119, 6);
    doc.setFont("helvetica", "bold");
    doc.text("Status: PAYMENT PENDING", rightBoxX + 10, boxY + 58);
  }
  let tableY = 220;
  const tableHeaderHeight = 22;
  doc.setFillColor(tealPrimary[0], tealPrimary[1], tealPrimary[2]);
  doc.rect(margin, tableY, contentWidth, tableHeaderHeight, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("#", margin + 10, tableY + 14);
  doc.text("ITEM / SERVICE DESCRIPTION", margin + 35, tableY + 14);
  doc.text("QTY", margin + 310, tableY + 14, { align: "center" });
  doc.text("RATE (INR)", margin + 390, tableY + 14, { align: "right" });
  doc.text("TOTAL (INR)", margin + contentWidth - 12, tableY + 14, { align: "right" });
  tableY += tableHeaderHeight;
  const items = data.items && data.items.length > 0 ? data.items : [{ name: data.notes || "Order / Booking Item", quantity: 1, price: data.totalAmount }];
  items.forEach((item, index) => {
    const rowHeight = 20;
    const isEven = index % 2 === 0;
    if (!isEven) {
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, tableY, contentWidth, rowHeight, "F");
    }
    doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    const itemTotal = (item.price || 0) * (item.quantity || 1);
    doc.text(String(index + 1), margin + 10, tableY + 13);
    doc.text(item.name || "Store Item", margin + 35, tableY + 13);
    doc.text(String(item.quantity || 1), margin + 310, tableY + 13, { align: "center" });
    doc.text(`Rs. ${item.price || 0}`, margin + 390, tableY + 13, { align: "right" });
    doc.text(`Rs. ${itemTotal}`, margin + contentWidth - 12, tableY + 13, { align: "right" });
    tableY += rowHeight;
  });
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(1);
  doc.line(margin, tableY, margin + contentWidth, tableY);
  tableY += 15;
  const calcBoxWidth = 200;
  const calcBoxX = margin + contentWidth - calcBoxWidth;
  const calcBoxY = tableY;
  if (isPaid) {
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(167, 243, 208);
    doc.roundedRect(margin, calcBoxY, 160, 54, 3, 3, "FD");
    doc.setTextColor(5, 150, 105);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("PAYMENT VERIFIED", margin + 12, calcBoxY + 22);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(4, 120, 87);
    doc.text("Received & settled via UPI", margin + 12, calcBoxY + 36);
    if (data.paidAt) {
      doc.text(`On: ${new Date(data.paidAt).toLocaleDateString("en-IN")}`, margin + 12, calcBoxY + 46);
    }
  }
  doc.setFillColor(tealLight[0], tealLight[1], tealLight[2]);
  doc.setDrawColor(tealBorder[0], tealBorder[1], tealBorder[2]);
  doc.roundedRect(calcBoxX, calcBoxY, calcBoxWidth, 54, 3, 3, "FD");
  doc.setTextColor(mutedGray[0], mutedGray[1], mutedGray[2]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("Subtotal:", calcBoxX + 12, calcBoxY + 18);
  doc.setTextColor(darkInk[0], darkInk[1], darkInk[2]);
  doc.text(`Rs. ${data.totalAmount}`, calcBoxX + calcBoxWidth - 12, calcBoxY + 18, { align: "right" });
  doc.setTextColor(tealPrimary[0], tealPrimary[1], tealPrimary[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text("GRAND TOTAL:", calcBoxX + 12, calcBoxY + 40);
  doc.setFontSize(12);
  doc.text(`Rs. ${data.totalAmount}`, calcBoxX + calcBoxWidth - 12, calcBoxY + 40, { align: "right" });
  const footerY = 760;
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(1);
  doc.line(margin, footerY, margin + contentWidth, footerY);
  doc.setTextColor(mutedGray[0], mutedGray[1], mutedGray[2]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(
    "This is a computer-generated tax invoice issued via WhatsApp Business AI.",
    pageWidth / 2,
    footerY + 14,
    { align: "center" }
  );
  doc.text(
    `Thank you for doing business with ${data.businessName}! For questions, contact ${data.businessPhone || "support"}.`,
    pageWidth / 2,
    footerY + 26,
    { align: "center" }
  );
  doc.text(
    "Powered by Agento AI \u2022 Autonomous WhatsApp Commerce Cloud",
    pageWidth / 2,
    footerY + 38,
    { align: "center" }
  );
  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}

// src/routes/invoice.ts
var router4 = Router4();
router4.get("/api/invoice/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required" });
    }
    console.log(`[Express Invoice] Generating PDF for Order ID: ${orderId}`);
    const { data: order, error: orderErr } = await supabase.from("orders_bookings_leads").select("*").eq("id", orderId).single();
    if (orderErr || !order) {
      console.warn(`[Express Invoice] Order not found for ID: ${orderId}`);
      return res.status(404).json({ error: "Order not found" });
    }
    const { data: business } = await supabase.from("businesses").select("*").eq("id", order.business_id).single();
    const { data: configsData } = await supabase.from("business_config").select("config_key, config_value").eq("business_id", order.business_id);
    const configMap = {};
    (configsData || []).forEach((c) => {
      configMap[c.config_key] = c.config_value;
    });
    const details = order.details || {};
    const items = details.items || (details.service ? [{ name: details.service, quantity: 1, price: details.price }] : []);
    const totalAmount = details.total || details.price || 0;
    const isPaid = details.payment_status === "paid" || order.status === "completed";
    const invoicePayload = {
      orderId: order.id,
      businessName: business?.name || "Store",
      businessCategory: business?.category || "General Store",
      businessPhone: business?.whatsapp_number || "",
      gstNumber: configMap.gst_number || configMap.tax_id || "",
      storeAddress: configMap.address || configMap.store_address || "",
      upiId: configMap.upi_id || "",
      customerNumber: order.customer_number,
      createdAt: order.created_at,
      type: order.type,
      status: order.status,
      paymentStatus: isPaid ? "paid" : "pending",
      paidAt: details.paid_at,
      items,
      totalAmount,
      fulfillment: details.fulfillment || (details.delivery_address ? "Delivery" : "Store Pickup"),
      deliveryAddress: details.delivery_address || details.address || "",
      notes: details.notes || ""
    };
    const pdfBuffer = await generateInvoicePdfBuffer(invoicePayload);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="Invoice-${orderId.slice(0, 8)}.pdf"`);
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    return res.send(Buffer.from(pdfBuffer));
  } catch (err) {
    console.error("[Express Invoice Error]:", err);
    return res.status(500).json({ error: err.message || "Failed to generate invoice PDF" });
  }
});
var invoice_default = router4;

// src/routes/payment.ts
init_env();
import { Router as Router5 } from "express";
import Razorpay2 from "razorpay";
import crypto3 from "crypto";
var router5 = Router5();
router5.post("/api/create-order", async (req, res) => {
  try {
    const key_id = process.env.RAZORPAY_KEY_ID || ENV.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET || ENV.RAZORPAY_KEY_SECRET;
    if (!key_id || !key_secret) {
      return res.status(401).json({ error: "Razorpay API credentials not configured" });
    }
    const { amount: rawAmount, currency = "INR", receipt = `rcpt_${Date.now()}` } = req.body;
    const amount = Number(rawAmount) || 99900;
    if (isNaN(amount) || amount < 100) {
      return res.status(400).json({ error: "Invalid amount. Minimum amount is 100 paise (\u20B91.00)" });
    }
    const razorpay = new Razorpay2({ key_id, key_secret });
    console.log(`[Express API] Creating Razorpay order: ${amount} ${currency}`);
    const order = await razorpay.orders.create({
      amount: Math.round(amount),
      currency,
      receipt,
      notes: req.body.notes || { source: "Express Standard Checkout" }
    });
    console.log(`[Express API] Order created successfully: ${order.id}`);
    return res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (err) {
    console.error("[Express Create Order Error]:", err);
    return res.status(err.statusCode || 500).json({ error: err.message || "Failed to create order" });
  }
});
router5.post("/api/verify-payment", (req, res) => {
  try {
    const key_secret = process.env.RAZORPAY_KEY_SECRET || ENV.RAZORPAY_KEY_SECRET;
    if (!key_secret) {
      return res.status(401).json({ error: "Razorpay secret key not configured" });
    }
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: razorpay_order_id, razorpay_payment_id, or razorpay_signature"
      });
    }
    const hmac = crypto3.createHmac("sha256", key_secret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest("hex");
    const isSignatureValid = crypto3.timingSafeEqual(
      Buffer.from(generatedSignature, "utf-8"),
      Buffer.from(razorpay_signature, "utf-8")
    );
    if (isSignatureValid) {
      console.log(`[Express API] \u2705 Signature match! Payment verified for ID: ${razorpay_payment_id}`);
      return res.json({
        success: true,
        message: "Payment verified successfully",
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id
      });
    } else {
      console.warn(`[Express API] \u274C Signature mismatch!`);
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature. Payment cannot be verified."
      });
    }
  } catch (err) {
    console.error("[Express Verify Payment Exception]:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});
var payment_default = router5;

// src/routes/caRoutes.ts
import { Router as Router6 } from "express";

// src/services/caCronService.ts
import cron from "node-cron";
var MS_PER_DAY = 24 * 60 * 60 * 1e3;
function getDaysDiff(targetDateStr) {
  if (!targetDateStr) return null;
  const todayStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const today = /* @__PURE__ */ new Date(todayStr + "T00:00:00Z");
  const target = /* @__PURE__ */ new Date(String(targetDateStr).slice(0, 10) + "T00:00:00Z");
  if (isNaN(target.getTime())) return null;
  return Math.round((target.getTime() - today.getTime()) / MS_PER_DAY);
}
function getDaysSince(dateStr) {
  if (!dateStr) return null;
  const now = /* @__PURE__ */ new Date();
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return Math.floor((now.getTime() - d.getTime()) / MS_PER_DAY);
}
async function resolveFirms(businessId) {
  if (businessId) {
    const { data: data2 } = await supabase.from("businesses").select("id, name").eq("id", businessId).maybeSingle();
    if (!data2) {
      console.error(`[CACron] Business ${businessId} not found \u2014 nothing to run.`);
      return [];
    }
    return [{ id: data2.id, name: data2.name }];
  }
  const { data, error } = await supabase.from("businesses").select("id, name").eq("category", "ca_firm");
  if (error) {
    console.error("[CACron] Could not list CA firms:", error.message);
    return [];
  }
  if (!data || data.length === 0) {
    console.log("[CACron] No businesses with category ca_firm \u2014 skipping.");
    return [];
  }
  return data.map((b) => ({ id: b.id, name: b.name }));
}
async function forEachFirm(label, businessId, run) {
  const firms = await resolveFirms(businessId);
  const details = [];
  let processed = 0;
  let remindersSent = 0;
  for (const firm of firms) {
    try {
      const result = await run(firm);
      processed += result.processed;
      remindersSent += result.remindersSent;
      details.push({ firm: firm.name, ...result });
    } catch (err) {
      console.error(`[CACron] ${label} failed for ${firm.name}:`, err?.message || err);
      details.push({ firm: firm.name, processed: 0, remindersSent: 0 });
    }
  }
  console.log(`[CACron] ${label}: ${firms.length} firm(s), ${processed} scanned, ${remindersSent} sent.`);
  return { processed, remindersSent, firms: firms.length, details };
}
async function draft(prompt, temperature, context) {
  try {
    return await getGroqChatCompletion([{ role: "user", content: prompt }], { temperature });
  } catch (err) {
    console.error(`[CACron] Could not draft message for ${context}:`, err?.message || err);
    return null;
  }
}
async function runComplianceEngine(businessId) {
  console.log("[CACron] Running Compliance Deadline Engine...");
  return forEachFirm("Compliance Engine", businessId, async (firm) => {
    let remindersSent = 0;
    const { data: records, error } = await supabase.from("ca_compliance_calendar").select("*").eq("business_id", firm.id).neq("status", "Filed");
    if (error) {
      console.error(`[CACron] Compliance fetch error for ${firm.name}:`, error.message);
      return { processed: 0, remindersSent: 0 };
    }
    if (!records || records.length === 0) return { processed: 0, remindersSent: 0 };
    for (const item of records) {
      const days = getDaysDiff(item.due_date);
      if (days === null) continue;
      let stage = null;
      if (days === 7) stage = "friendly_7d";
      else if (days === 3) stage = "reminder_3d";
      else if (days === 1) stage = "urgent_1d";
      else if (days === 0) stage = "due_today";
      else if (days < 0) stage = "overdue";
      if (!stage) continue;
      const daysOverdue = days < 0 ? Math.abs(days) : 0;
      const reminderText = await draft(
        buildCAComplianceReminderPrompt(
          firm.name,
          item.client_name,
          item.compliance_type,
          item.due_date,
          stage,
          daysOverdue
        ),
        0.2,
        `compliance ${item.id}`
      );
      if (!reminderText) continue;
      if (item.phone) {
        const sent = await sendWhatsAppMessage(item.phone, reminderText);
        if (sent?.success === false) {
          console.error(`[CACron] Compliance reminder to ${item.phone} failed: ${sent.error}`);
          continue;
        }
        remindersSent++;
      }
      await supabase.from("ca_compliance_calendar").update({
        reminder_count: (item.reminder_count || 0) + 1,
        last_reminder_date: (/* @__PURE__ */ new Date()).toISOString(),
        status: days < 0 ? "Overdue" : item.status,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", item.id);
      if (daysOverdue > 3) {
        await sendPartnerAlert({
          type: "compliance_overdue",
          title: "\u{1F6A8} Client Compliance Overdue > 3 Days",
          details: {
            firm: firm.name,
            client: item.client_name,
            phone: item.phone,
            compliance: item.compliance_type,
            due_date: item.due_date,
            days_overdue: daysOverdue
          }
        });
      }
    }
    return { processed: records.length, remindersSent };
  });
}
async function runDocumentChasingEngine(businessId) {
  console.log("[CACron] Running Document Chasing Engine...");
  return forEachFirm("Document Chasing Engine", businessId, async (firm) => {
    let remindersSent = 0;
    const { data: docs, error } = await supabase.from("ca_documents_tracker").select("*").eq("business_id", firm.id).eq("status", "Pending");
    if (error) {
      console.error(`[CACron] Document tracker fetch error for ${firm.name}:`, error.message);
      return { processed: 0, remindersSent: 0 };
    }
    if (!docs || docs.length === 0) return { processed: 0, remindersSent: 0 };
    for (const doc of docs) {
      const refDate = doc.last_followup_date || doc.requested_date;
      const gap = getDaysSince(refDate);
      if (gap === null || gap < 3) continue;
      const nextAttempt = (doc.followup_count || 0) + 1;
      const followupText = await draft(
        buildCADocumentFollowupPrompt(firm.name, doc.client_name, doc.document_name, doc.compliance_type, nextAttempt),
        0.2,
        `document ${doc.id}`
      );
      if (!followupText) continue;
      if (doc.phone) {
        const sent = await sendWhatsAppMessage(doc.phone, followupText);
        if (sent?.success === false) {
          console.error(`[CACron] Document follow-up to ${doc.phone} failed: ${sent.error}`);
          continue;
        }
        remindersSent++;
      }
      await supabase.from("ca_documents_tracker").update({
        followup_count: nextAttempt,
        last_followup_date: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", doc.id);
      if (nextAttempt >= 3) {
        await sendPartnerAlert({
          type: "doc_escalation",
          title: "\u{1F4C4} Document Pending - Follow-up 3+",
          details: {
            firm: firm.name,
            client: doc.client_name,
            phone: doc.phone,
            document: doc.document_name,
            compliance: doc.compliance_type,
            followups_sent: nextAttempt,
            recommendation: "Direct partner call recommended"
          }
        });
      }
    }
    return { processed: docs.length, remindersSent };
  });
}
async function runLeadFollowupEngine(businessId) {
  console.log("[CACron] Running Lead Followup Engine...");
  const todayStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const closedStatuses = ["Converted", "Lost", "Cold-Closed"];
  return forEachFirm("Lead Followup Engine", businessId, async (firm) => {
    let remindersSent = 0;
    const { data: leads, error } = await supabase.from("ca_leads").select("*").eq("business_id", firm.id).not("status", "in", `(${closedStatuses.map((s) => `"${s}"`).join(",")})`);
    if (error) {
      console.error(`[CACron] Leads fetch error for ${firm.name}:`, error.message);
      return { processed: 0, remindersSent: 0 };
    }
    if (!leads || leads.length === 0) return { processed: 0, remindersSent: 0 };
    for (const lead of leads) {
      if (!lead.followup_date || lead.followup_date > todayStr) continue;
      const attempts = (lead.followup_attempts || 0) + 1;
      if (attempts >= 4) {
        await supabase.from("ca_leads").update({ status: "Cold-Closed", followup_attempts: attempts, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", lead.id);
        continue;
      }
      const checkinText = await draft(
        buildCALeadFollowupPrompt(firm.name, lead.name, lead.requirement || "CA & Tax Advisory Services", attempts),
        0.3,
        `lead ${lead.id}`
      );
      if (!checkinText) continue;
      if (lead.phone) {
        const sent = await sendWhatsAppMessage(lead.phone, checkinText);
        if (sent?.success === false) {
          console.error(`[CACron] Lead check-in to ${lead.phone} failed: ${sent.error}`);
          continue;
        }
        remindersSent++;
      }
      const nextDate = /* @__PURE__ */ new Date();
      nextDate.setDate(nextDate.getDate() + 3);
      await supabase.from("ca_leads").update({
        followup_attempts: attempts,
        followup_date: nextDate.toISOString().slice(0, 10),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", lead.id);
    }
    return { processed: leads.length, remindersSent };
  });
}
async function runInvoiceRecoveryEngine(businessId) {
  console.log("[CACron] Running Invoice Fee Recovery Engine...");
  return forEachFirm("Invoice Recovery Engine", businessId, async (firm) => {
    let remindersSent = 0;
    const { data: invoices, error } = await supabase.from("invoices").select("*").eq("business_id", firm.id).neq("status", "Paid");
    if (error) {
      console.error(`[CACron] Invoices fetch error for ${firm.name}:`, error.message);
      return { processed: 0, remindersSent: 0 };
    }
    if (!invoices || invoices.length === 0) return { processed: 0, remindersSent: 0 };
    for (const inv of invoices) {
      const days = getDaysDiff(inv.due_date);
      if (days === null) continue;
      const overdueDays = -days;
      let stage = null;
      if (days === 3) stage = "upcoming_3d";
      else if (days === 0) stage = "due_today";
      else if (overdueDays >= 1 && overdueDays <= 7) stage = "overdue_mild";
      else if (overdueDays >= 8 && overdueDays <= 15) stage = "overdue_moderate";
      else if (overdueDays > 15) stage = "overdue_severe";
      if (!stage) continue;
      const reminderText = await draft(
        buildCAInvoiceReminderPrompt(
          firm.name,
          inv.client_name || "Client",
          inv.id,
          inv.amount || 0,
          inv.currency || "INR",
          inv.due_date || "Due on Receipt",
          stage,
          overdueDays > 0 ? overdueDays : 0
        ),
        0.2,
        `invoice ${inv.id}`
      );
      if (!reminderText) continue;
      if (inv.phone) {
        const sent = await sendWhatsAppMessage(inv.phone, reminderText);
        if (sent?.success === false) {
          console.error(`[CACron] Invoice reminder to ${inv.phone} failed: ${sent.error}`);
          continue;
        }
        remindersSent++;
      }
      await supabase.from("invoices").update({
        reminder_count: (inv.reminder_count || 0) + 1,
        last_reminder_date: (/* @__PURE__ */ new Date()).toISOString(),
        status: overdueDays > 0 ? "Overdue" : inv.status,
        escalated: overdueDays > 15 ? "Yes" : inv.escalated,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", inv.id);
      if (overdueDays > 15) {
        await sendPartnerAlert({
          type: "invoice_overdue",
          title: "\u{1F4B0} Invoice Severely Overdue (>15 Days)",
          details: {
            firm: firm.name,
            client: inv.client_name,
            phone: inv.phone,
            invoice_id: inv.id,
            amount: `${inv.currency || "INR"} ${inv.amount}`,
            days_overdue: overdueDays
          }
        });
      }
    }
    return { processed: invoices.length, remindersSent };
  });
}
var caSchedulerStarted = false;
function initCACronScheduler() {
  if (caSchedulerStarted) {
    console.log("[CACron] Scheduler already running.");
    return;
  }
  caSchedulerStarted = true;
  console.log("[CACron] Initializing CA Firm daily automation schedules...");
  cron.schedule("0 9 * * *", async () => {
    console.log("[Cron 09:00] Compliance Engine...");
    await runComplianceEngine().catch((e) => console.error("[CACron]", e?.message));
  });
  cron.schedule("30 9 * * *", async () => {
    console.log("[Cron 09:30] Document Chasing Engine...");
    await runDocumentChasingEngine().catch((e) => console.error("[CACron]", e?.message));
  });
  cron.schedule("0 10 * * *", async () => {
    console.log("[Cron 10:00] Lead Nurturing Engine...");
    await runLeadFollowupEngine().catch((e) => console.error("[CACron]", e?.message));
  });
  cron.schedule("30 10 * * *", async () => {
    console.log("[Cron 10:30] Fee Recovery Engine...");
    await runInvoiceRecoveryEngine().catch((e) => console.error("[CACron]", e?.message));
  });
  console.log("[CACron] \u2705 All 4 daily jobs registered.");
}

// src/routes/caRoutes.ts
var caRouter = Router6();
caRouter.post("/website-lead", async (req, res) => {
  const b = req.body || {};
  const name = (b.name || "").toString().trim();
  const phone = (b.phone || "").toString().trim();
  const email = (b.email || "").toString().trim();
  const message = (b.message || b.requirement || "").toString().trim();
  const source = b.source || "Website";
  if (!name || !phone && !email) {
    return res.status(400).json({
      error: "bad_request",
      message: "name and (phone or email) required"
    });
  }
  try {
    const result = await handleCALeadInquiry(
      phone || email,
      message || "Inquiry from website lead form",
      name,
      "Website",
      b.business_id
    );
    return res.status(200).json({
      status: "received",
      lead_id: result.lead?.id,
      score: result.lead?.qualification_score,
      isHot: result.isHot,
      opening_message: result.replyText
    });
  } catch (err) {
    console.error("[CARoutes] website-lead error:", err.message);
    return res.status(500).json({ error: "internal_error", message: err.message });
  }
});
caRouter.post("/request-documents", async (req, res) => {
  const b = req.body || {};
  const clientId = (b.client_id || "").toString().trim();
  const complianceType = (b.compliance_type || "General").toString().trim();
  const documents = Array.isArray(b.documents) ? b.documents.filter((d) => d && String(d).trim()) : [];
  if (!clientId || documents.length === 0) {
    return res.status(400).json({
      error: "bad_request",
      message: "client_id and non-empty documents[] required"
    });
  }
  try {
    const result = await requestClientDocuments({
      businessId: b.business_id,
      clientId,
      complianceType,
      documents,
      firmName: b.firm_name
    });
    return res.status(200).json({
      status: "received",
      count: result.createdCount,
      message: result.message
    });
  } catch (err) {
    console.error("[CARoutes] request-documents error:", err.message);
    return res.status(500).json({ error: "internal_error", message: err.message });
  }
});
caRouter.post("/payment-confirmation", async (req, res) => {
  const b = req.body || {};
  const invoiceId = (b.invoice_id || "").toString().trim();
  const amountPaid = b.amount_paid || b.amount;
  if (!invoiceId) {
    return res.status(400).json({
      error: "bad_request",
      message: "invoice_id required"
    });
  }
  try {
    const result = await recordInvoicePayment({
      invoiceId,
      amountPaid: amountPaid ? Number(amountPaid) : void 0,
      paymentDate: b.payment_date || (/* @__PURE__ */ new Date()).toISOString(),
      firmName: b.firm_name
    });
    return res.status(200).json({
      status: "received",
      message: result.message
    });
  } catch (err) {
    console.error("[CARoutes] payment-confirmation error:", err.message);
    return res.status(500).json({ error: "internal_error", message: err.message });
  }
});
caRouter.get("/clients", async (req, res) => {
  try {
    const { data, error } = await supabase.from("ca_clients").select("*").order("client_name", { ascending: true });
    if (error) throw error;
    return res.json({ clients: data || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
caRouter.post("/clients", async (req, res) => {
  const b = req.body || {};
  try {
    if (!b.client_name || !b.phone) {
      return res.status(400).json({ error: "client_name and phone are required" });
    }
    const { data, error } = await supabase.from("ca_clients").upsert({
      id: b.id || void 0,
      business_id: b.business_id,
      client_name: b.client_name,
      contact_person: b.contact_person,
      phone: b.phone,
      email: b.email,
      pan_gstin: b.pan_gstin,
      entity_type: b.entity_type || "Proprietorship",
      partner_assigned: b.partner_assigned,
      status: b.status || "Active",
      notes: b.notes,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).select("*").single();
    if (error) throw error;
    return res.json({ client: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
caRouter.get("/compliance", async (req, res) => {
  try {
    const { data, error } = await supabase.from("ca_compliance_calendar").select("*").order("due_date", { ascending: true });
    if (error) throw error;
    return res.json({ compliances: data || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
caRouter.post("/compliance", async (req, res) => {
  const b = req.body || {};
  try {
    const { data, error } = await supabase.from("ca_compliance_calendar").upsert({
      id: b.id || void 0,
      business_id: b.business_id,
      client_id: b.client_id,
      client_name: b.client_name,
      phone: b.phone,
      email: b.email,
      compliance_type: b.compliance_type,
      due_date: b.due_date,
      status: b.status || "Pending",
      acknowledgement_number: b.acknowledgement_number,
      filed_date: b.status === "Filed" ? (/* @__PURE__ */ new Date()).toISOString() : void 0,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).select("*").single();
    if (error) throw error;
    return res.json({ compliance: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
caRouter.get("/documents", async (req, res) => {
  try {
    const { data, error } = await supabase.from("ca_documents_tracker").select("*").order("requested_date", { ascending: false });
    if (error) throw error;
    return res.json({ documents: data || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
caRouter.post("/documents/verify", async (req, res) => {
  const { doc_id, status } = req.body || {};
  try {
    const { data, error } = await supabase.from("ca_documents_tracker").update({
      status: status || "Verified",
      verified_date: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", doc_id).select("*").single();
    if (error) throw error;
    return res.json({ document: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
caRouter.get("/leads", async (req, res) => {
  try {
    const { data, error } = await supabase.from("ca_leads").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return res.json({ leads: data || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
caRouter.post("/leads/update", async (req, res) => {
  const b = req.body || {};
  try {
    const { data, error } = await supabase.from("ca_leads").update({
      status: b.status,
      qualification_score: b.qualification_score,
      urgency: b.urgency,
      requirement: b.requirement,
      notes: b.notes,
      followup_date: b.followup_date,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", b.id).select("*").single();
    if (error) throw error;
    return res.json({ lead: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
caRouter.post("/cron/trigger/:jobName", async (req, res) => {
  const { jobName } = req.params;
  try {
    let result = {};
    if (jobName === "compliance") {
      result = await runComplianceEngine();
    } else if (jobName === "documents") {
      result = await runDocumentChasingEngine();
    } else if (jobName === "leads") {
      result = await runLeadFollowupEngine();
    } else if (jobName === "invoices") {
      result = await runInvoiceRecoveryEngine();
    } else {
      return res.status(400).json({ error: "Invalid jobName. Options: compliance, documents, leads, invoices" });
    }
    return res.json({ success: true, jobName, ...result });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// src/services/hospitalCronService.ts
import cron2 from "node-cron";
init_env();

// src/services/vapiService.ts
async function triggerVapiCall(options) {
  const apiKey = (process.env.VAPI_API_KEY || process.env.VAPI_PRIVATE_API_KEY || process.env.VAPI_KEY || "").trim();
  if (!apiKey) {
    console.log(
      "[Vapi Service] No VAPI_API_KEY found. Running in simulation mode."
    );
    return {
      success: true,
      mode: "simulation",
      callId: `sim_vapi_${Date.now()}`
    };
  }
  let cleanNumber = options.phoneNumber.replace(/[^\d+]/g, "");
  if (!cleanNumber.startsWith("+")) {
    const digits = cleanNumber.replace(/\D/g, "");
    cleanNumber = digits.length === 10 ? `+91${digits}` : `+${digits}`;
  }
  const hospitalName = options.hospitalName || "the hospital";
  const doctorName = options.doctorName || "Attending Specialist";
  const appointmentTime = options.appointmentTime || "upcoming scheduled time";
  const systemPrompt = options.promptTask || `You are the official AI Medical Receptionist calling on behalf of ${hospitalName}. 
You are speaking with patient ${options.patientName} regarding their upcoming OPD consultation with Dr. ${doctorName} scheduled for ${appointmentTime}.
1. Greet the patient warmly with "Namaste ${options.patientName}".
2. Remind them of their appointment with Dr. ${doctorName} at ${appointmentTime}.
3. Ask if they will be able to attend or if they need to reschedule.
4. If they confirm, thank them and remind them to arrive 10 minutes early.
5. If they request a reschedule, note their preferred day/time and let them know the hospital reception desk will update their slot and message them on WhatsApp.
Keep the conversation brief, empathetic, polite, and professional.`;
  const firstMessage = `Namaste ${options.patientName}, this is the AI assistant calling from ${hospitalName} regarding your upcoming appointment with Dr. ${doctorName}. Can you confirm your attendance?`;
  const assistantId = process.env.VAPI_ASSISTANT_ID;
  const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;
  try {
    console.log(
      `[Vapi Service] \u{1F4DE} Initiating live AI phone call to ${cleanNumber} (${options.patientName})...`
    );
    const payload = {
      customer: {
        number: cleanNumber,
        name: options.patientName
      }
    };
    if (phoneNumberId) {
      payload.phoneNumberId = phoneNumberId;
    }
    if (assistantId) {
      payload.assistantId = assistantId;
      payload.assistantOverrides = {
        firstMessage,
        variableValues: {
          patientName: options.patientName,
          doctorName,
          appointmentTime,
          hospitalName
        }
      };
    } else {
      payload.assistant = {
        firstMessage,
        model: {
          provider: "openai",
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: systemPrompt
            }
          ]
        },
        voice: {
          provider: "11labs",
          voiceId: "21m00Tcm4TlvDq8ikWAM"
        }
      };
    }
    const res = await fetch("https://api.vapi.ai/call/phone", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log("[Vapi Service] Response:", data);
    if (data.id || data.status === "queued" || data.status === "in-progress") {
      return {
        success: true,
        callId: data.id,
        mode: "live"
      };
    } else {
      console.warn(
        "[Vapi Service] Live call dispatch rejected, falling back to simulated log:",
        data.message || data.error
      );
      return {
        success: true,
        callId: `sim_vapi_${Date.now()}`,
        mode: "simulation",
        error: data.message || (Array.isArray(data.message) ? data.message.join(", ") : data.error) || "Call could not be queued"
      };
    }
  } catch (err) {
    console.error("[Vapi Service Exception]:", err.message || err);
    return {
      success: true,
      callId: `sim_vapi_err_${Date.now()}`,
      mode: "simulation",
      error: err.message
    };
  }
}

// src/services/blandService.ts
async function triggerBlandCall(options) {
  const apiKey = (process.env.BLAND_API_KEY || process.env.BLAND_AI_API_KEY || "").trim();
  if (!apiKey) {
    console.log("[Bland Service] No BLAND_API_KEY found. Running in simulation mode.");
    return {
      success: true,
      mode: "simulation",
      callId: `sim_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    };
  }
  let cleanNumber = options.phoneNumber.replace(/[^\d+]/g, "");
  if (!cleanNumber.startsWith("+")) {
    const digits = cleanNumber.replace(/\D/g, "");
    cleanNumber = digits.length === 10 ? `+91${digits}` : `+${digits}`;
  }
  const hospitalName = options.hospitalName || "the hospital";
  const doctorName = options.doctorName || "Attending Specialist";
  const appointmentTime = options.appointmentTime || "upcoming scheduled time";
  const task = options.promptTask || `You are the official AI Medical Receptionist calling on behalf of ${hospitalName}. 
You are speaking with patient ${options.patientName} regarding their upcoming OPD consultation with Dr. ${doctorName} scheduled for ${appointmentTime}.
1. Greet the patient warmly with "Namaste ${options.patientName}".
2. Remind them of their appointment with Dr. ${doctorName}.
3. Ask if they will be able to attend or if they need to reschedule.
4. If they confirm, thank them and remind them to arrive 10 minutes early.
5. If they request a reschedule, note their preferred day/time and let them know the hospital reception desk will update their slot and message them on WhatsApp.
Keep the conversation brief, empathetic, polite, and professional.`;
  const firstSentence = `Namaste ${options.patientName}, this is the AI assistant calling from ${hospitalName} regarding your upcoming appointment with Dr. ${doctorName}.`;
  try {
    console.log(`[Bland Service] \u{1F4DE} Initiating live AI phone call to ${cleanNumber} (${options.patientName})...`);
    const res = await fetch("https://api.bland.ai/v1/calls", {
      method: "POST",
      headers: {
        authorization: apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        phone_number: cleanNumber,
        task,
        first_sentence: firstSentence,
        voice: "maya",
        record: true,
        answered_by_enabled: true,
        wait_for_greeting: true,
        max_duration: 3
        // 3 minutes max
      })
    });
    const data = await res.json();
    console.log("[Bland Service] Response:", data);
    if (data.status === "success" || data.call_id) {
      return {
        success: true,
        callId: data.call_id,
        mode: "live"
      };
    } else {
      console.warn("[Bland Service] Live call rejected, falling back to simulated completion:", data.message || data.error);
      return {
        success: true,
        callId: `sim_fallback_${Date.now()}`,
        mode: "simulation",
        error: data.message || data.error
      };
    }
  } catch (err) {
    console.error("[Bland Service Exception]:", err.message || err);
    return {
      success: true,
      callId: `sim_err_${Date.now()}`,
      mode: "simulation",
      error: err.message
    };
  }
}

// src/services/voiceCallService.ts
async function resolveBusinessName(businessId) {
  if (!businessId) return null;
  try {
    const { data } = await supabase.from("businesses").select("name").eq("id", businessId).maybeSingle();
    return data?.name || null;
  } catch {
    return null;
  }
}
async function dispatchVoiceCall(req) {
  const hospitalName = req.hospitalName || await resolveBusinessName(req.businessId);
  if (!hospitalName) {
    const error2 = "No business name resolved for this call. Refusing to introduce the caller as an unnamed or placeholder hospital.";
    console.error(`[Voice Call] \u274C ${error2}`);
    await recordCall(req, { status: "failed", error: error2, provider: "none" });
    return { dispatched: false, provider: "none", error: error2 };
  }
  const callParams = {
    phoneNumber: req.patientPhone,
    patientName: req.patientName,
    doctorName: req.doctorName,
    appointmentTime: req.appointmentTime,
    hospitalName,
    callType: req.callType,
    promptTask: req.promptTask
  };
  const attempts = [];
  const vapi = await triggerVapiCall(callParams);
  if (vapi.mode === "live" && vapi.callId) {
    const record2 = await recordCall(req, { status: "queued", provider: "vapi", callId: vapi.callId });
    console.log(`[Voice Call] \u2705 Vapi queued call ${vapi.callId} to ${req.patientPhone}.`);
    return { dispatched: true, provider: "vapi", callId: vapi.callId, record: record2 };
  }
  attempts.push(`vapi: ${vapi.error || "not configured"}`);
  const bland = await triggerBlandCall(callParams);
  if (bland.mode === "live" && bland.callId) {
    const record2 = await recordCall(req, { status: "queued", provider: "bland", callId: bland.callId });
    console.log(`[Voice Call] \u2705 Bland queued call ${bland.callId} to ${req.patientPhone}.`);
    return { dispatched: true, provider: "bland", callId: bland.callId, record: record2 };
  }
  attempts.push(`bland: ${bland.error || "not configured"}`);
  const error = `No voice provider placed the call (${attempts.join("; ")}).`;
  console.error(`[Voice Call] \u274C ${error}`);
  const record = await recordCall(req, { status: "failed", error, provider: "none" });
  return { dispatched: false, provider: "none", error, record };
}
async function recordCall(req, result) {
  try {
    const { data, error } = await supabase.from("hospital_voice_calls").insert([
      {
        business_id: req.businessId || null,
        patient_id: req.patientId || null,
        appointment_id: req.appointmentId || null,
        patient_name: req.patientName,
        patient_phone: req.patientPhone,
        call_type: req.callType || "appointment_reminder",
        status: result.status,
        // Left null on purpose: unknown until the provider reports back.
        outcome: null,
        duration_seconds: null,
        transcript_summary: result.callId ? `Call queued with ${result.provider} (id ${result.callId}). Awaiting provider callback for duration and outcome.` : `Call not placed. ${result.error || ""}`.trim()
      }
    ]).select().single();
    if (error) {
      console.warn("[Voice Call] Could not log call record:", error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn("[Voice Call] Could not log call record:", err?.message || err);
    return null;
  }
}

// src/services/hospitalCronService.ts
async function send(phone, message) {
  const result = await sendMessage(phone, ENV.WHATSAPP_BUSINESS_NUMBER, message);
  if (!result.success) {
    console.error(`[Hospital Cron] WhatsApp send to ${phone} failed: ${result.error}`);
  }
  return result.success;
}
function nameResolver() {
  const cache = /* @__PURE__ */ new Map();
  return async (businessId) => {
    if (!businessId) return null;
    if (!cache.has(businessId)) cache.set(businessId, await resolveBusinessName(businessId));
    return cache.get(businessId) ?? null;
  };
}
async function runHospitalAppointmentReminderScanner(businessId) {
  const now = /* @__PURE__ */ new Date();
  const next26Hours = new Date(now.getTime() + 26 * 60 * 60 * 1e3);
  const resolveName = nameResolver();
  let query = supabase.from("hospital_appointments").select("*").eq("status", "confirmed").gte("slot_time", now.toISOString()).lte("slot_time", next26Hours.toISOString());
  if (businessId) query = query.eq("business_id", businessId);
  const { data: appointments, error } = await query;
  if (error || !appointments) {
    console.error("[Hospital Cron] Error fetching appointments for reminders:", error?.message);
    return {
      job: "appointment_reminders",
      processed: 0,
      success: false,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      details: { error: error?.message }
    };
  }
  let sent24h = 0;
  let sent2h = 0;
  for (const appt of appointments) {
    const slotTime = new Date(appt.slot_time).getTime();
    const hoursDiff = (slotTime - now.getTime()) / (1e3 * 60 * 60);
    const hospitalName = await resolveName(appt.business_id) || "your hospital";
    const formattedTime = new Date(appt.slot_time).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short"
    });
    const tokenLine = appt.token_number ? `
\u{1F39F}\uFE0F *Token Number:* #${appt.token_number}` : "";
    const locationLine = appt.location ? `
\u{1F4CD} *Location:* ${appt.location}` : "";
    if (hoursDiff <= 25 && hoursDiff >= 23 && !appt.reminder_24h_sent) {
      const msg = `\u{1F3E5} *Appointment Reminder (Tomorrow)*

Namaste ${appt.patient_name || "Patient"} ji,

This is a reminder for your upcoming consultation at *${hospitalName}*:
\u{1F468}\u200D\u2695\uFE0F *Doctor:* ${appt.doctor_name || "Specialist"} (${appt.department || "General"})
\u23F0 *Slot Time:* ${formattedTime}` + tokenLine + locationLine + `

Reply *1* to Confirm, *2* to Reschedule, or *3* to Cancel.`;
      if (appt.patient_phone && await send(appt.patient_phone, msg)) {
        await supabase.from("hospital_appointments").update({ reminder_24h_sent: true }).eq("id", appt.id);
        sent24h++;
      }
    }
    if (hoursDiff <= 3 && hoursDiff >= 1 && !appt.reminder_2h_sent) {
      const msg = `\u26A1 *Appointment in about 2 hours*

Namaste ${appt.patient_name || "Patient"} ji,

Your consultation with *${appt.doctor_name || "the doctor"}* at *${hospitalName}* is scheduled for *${formattedTime}*.

Please arrive 15 minutes early for token verification.

Reply *CALL* if you need assistance from the front desk.`;
      if (appt.patient_phone && await send(appt.patient_phone, msg)) {
        await supabase.from("hospital_appointments").update({ reminder_2h_sent: true }).eq("id", appt.id);
        sent2h++;
      }
    }
  }
  return {
    job: "appointment_reminders",
    processed: sent24h + sent2h,
    success: true,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    details: { sent24h, sent2h, totalScanned: appointments.length }
  };
}
async function runHospitalFeedbackScanner(businessId) {
  const resolveName = nameResolver();
  const since = new Date(Date.now() - 3 * 24 * 60 * 60 * 1e3).toISOString();
  let query = supabase.from("hospital_appointments").select("*, hospital_patients(name, phone)").eq("status", "completed").gte("slot_time", since);
  if (businessId) query = query.eq("business_id", businessId);
  const { data: completedAppts, error } = await query;
  if (error || !completedAppts) {
    console.error("[Hospital Cron] Feedback scanner query failed:", error?.message);
    return {
      job: "feedback_scanner",
      processed: 0,
      success: false,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      details: { error: error?.message }
    };
  }
  let requested = 0;
  for (const appt of completedAppts) {
    const { data: existing } = await supabase.from("hospital_feedback").select("id").eq("appointment_id", appt.id).maybeSingle();
    if (existing) continue;
    const phone = appt.patient_phone || appt.hospital_patients?.phone;
    const name = appt.patient_name || appt.hospital_patients?.name || "Patient";
    if (!phone) continue;
    const hospitalName = await resolveName(appt.business_id) || "our hospital";
    const msg = `\u{1F64F} *How was your visit?*

Namaste ${name} ji,

Thank you for visiting *${hospitalName}* for your consultation with *${appt.doctor_name || "our specialist"}*.

Please rate your experience from *1 to 5* by replying with a number:

\u2B50 *5* - Excellent
\u2B50 *4* - Good
\u2B50 *3* - Average
\u2B50 *2* - Poor
\u2B50 *1* - Very Bad

Your feedback helps us improve.`;
    if (!await send(phone, msg)) continue;
    await supabase.from("hospital_feedback").insert([
      {
        business_id: appt.business_id,
        patient_id: appt.patient_id,
        appointment_id: appt.id,
        patient_name: name,
        patient_phone: phone,
        doctor_name: appt.doctor_name,
        status: "pending",
        requested_at: (/* @__PURE__ */ new Date()).toISOString()
      }
    ]);
    requested++;
  }
  return {
    job: "feedback_scanner",
    processed: requested,
    success: true,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    details: { scanned: completedAppts.length }
  };
}
async function runHospitalMissedFollowupScanner(businessId) {
  const resolveName = nameResolver();
  const since = new Date(Date.now() - 3 * 24 * 60 * 60 * 1e3).toISOString();
  let query = supabase.from("hospital_appointments").select("*").eq("status", "missed").gte("slot_time", since);
  if (businessId) query = query.eq("business_id", businessId);
  const { data: missed, error } = await query;
  if (error || !missed) {
    console.error("[Hospital Cron] Missed follow-up query failed:", error?.message);
    return {
      job: "missed_followup",
      processed: 0,
      success: false,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      details: { error: error?.message }
    };
  }
  let followupsSent = 0;
  let callsQueued = 0;
  for (const appt of missed) {
    if (!appt.patient_phone) continue;
    const { data: alreadyCalled } = await supabase.from("hospital_voice_calls").select("id").eq("appointment_id", appt.id).eq("call_type", "missed_followup").limit(1);
    if (alreadyCalled && alreadyCalled.length > 0) continue;
    const hospitalName = await resolveName(appt.business_id) || "the hospital";
    const msg = `\u26A0\uFE0F *We missed you today*

Namaste ${appt.patient_name || "Patient"} ji,

We noticed you were unable to attend your scheduled consultation with *${appt.doctor_name || "the doctor"}* at *${hospitalName}* today.

Your health is our priority. Would you like to reschedule?

Reply with your preferred date/time, or reply *CALL* to speak with our reception staff.`;
    if (!await send(appt.patient_phone, msg)) continue;
    followupsSent++;
    const call = await dispatchVoiceCall({
      businessId: appt.business_id,
      patientId: appt.patient_id,
      appointmentId: appt.id,
      patientName: appt.patient_name || "Patient",
      patientPhone: appt.patient_phone,
      doctorName: appt.doctor_name,
      hospitalName,
      callType: "missed_followup",
      promptTask: `You are the AI receptionist for ${hospitalName}. ${appt.patient_name || "The patient"} missed their appointment with Dr. ${appt.doctor_name || "the doctor"}. Ask politely whether they would like to reschedule, note their preferred day and time, and tell them reception will confirm on WhatsApp. Do not give medical advice. Keep it under two minutes.`
    });
    if (call.dispatched) callsQueued++;
  }
  return {
    job: "missed_followup",
    processed: followupsSent,
    success: true,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    details: { whatsappSent: followupsSent, voiceCallsQueued: callsQueued, scanned: missed.length }
  };
}
var hospitalSchedulerStarted = false;
function initHospitalCronScheduler() {
  if (hospitalSchedulerStarted) {
    console.log("[Hospital Cron] Scheduler already running.");
    return;
  }
  hospitalSchedulerStarted = true;
  cron2.schedule("*/15 * * * *", async () => {
    try {
      const result = await runHospitalAppointmentReminderScanner();
      if (result.processed > 0) console.log("[Hospital Cron] Reminders:", result.details);
    } catch (err) {
      console.error("[Hospital Cron] Reminder scanner failed:", err?.message || err);
    }
  });
  cron2.schedule("20 * * * *", async () => {
    try {
      const result = await runHospitalFeedbackScanner();
      if (result.processed > 0) console.log(`[Hospital Cron] Feedback requested for ${result.processed} visits.`);
    } catch (err) {
      console.error("[Hospital Cron] Feedback scanner failed:", err?.message || err);
    }
  });
  cron2.schedule("40 * * * *", async () => {
    try {
      const result = await runHospitalMissedFollowupScanner();
      if (result.processed > 0) console.log("[Hospital Cron] Missed follow-ups:", result.details);
    } catch (err) {
      console.error("[Hospital Cron] Missed follow-up scanner failed:", err?.message || err);
    }
  });
  console.log("[Hospital Cron] \u2705 Scheduled: reminders */15min, feedback hourly :20, missed follow-ups hourly :40.");
}

// src/services/campaignService.ts
init_env();

// src/services/pitchTemplates.ts
var OPT_OUT_FOOTER = `

_Reply STOP to never hear from us again._`;
function detectVertical(category, businessName) {
  const cat = (category || "").toLowerCase();
  const name = (businessName || "").toLowerCase();
  return {
    isCA: cat.includes("ca_firm") || cat.includes("tax") || cat.includes("audit") || cat.includes("accountant") || name.includes("ca ") || name.includes("accountant") || name.includes("gst"),
    isHospital: cat.includes("hospital") || name.includes("hospital"),
    isSalon: cat.includes("salon") || cat.includes("spa") || cat.includes("beauty") || name.includes("salon"),
    isRestaurant: cat.includes("restaurant") || cat.includes("cafe") || cat.includes("food") || cat.includes("dine") || cat.includes("bar") || name.includes("cafe") || name.includes("dining"),
    isRealEstate: cat.includes("real_estate") || cat.includes("realty") || cat.includes("builder") || cat.includes("property"),
    isTuition: cat.includes("tuition") || cat.includes("coach") || cat.includes("academy") || cat.includes("class") || cat.includes("institute"),
    isRetail: cat.includes("retail") || cat.includes("boutique") || cat.includes("store") || cat.includes("shop") || cat.includes("jewel")
  };
}
function renderCustomMessage(template, vars) {
  return template.replace(/\{\{?\s*business_name\s*\}?\}/gi, vars.businessName).replace(/\{\{?\s*city\s*\}?\}/gi, vars.city).replace(/\{\{?\s*category\s*\}?\}/gi, vars.category).replace(/\{\{?\s*sender_name\s*\}?\}/gi, vars.senderName);
}
function buildPersonalizedPitch(businessName, category, city, pitchType, senderName) {
  const name = businessName || "there";
  const v = detectVertical(category, name);
  return buildPitchBody(name, city || "your city", pitchType, senderName, v) + OPT_OUT_FOOTER;
}
function buildPitchBody(name, city, pitchType, senderName, v) {
  switch (pitchType) {
    case "all_in_one":
      if (v.isRestaurant) {
        return `Namaste Team *${name}*! \u{1F37D}\uFE0F

I am ${senderName}. We build direct ordering & WhatsApp AI booking suites for restaurants in ${city}:

1\uFE0F\u20E3 *Direct QR & WhatsApp Food Ordering* (Zero 30% aggregator commission)
2\uFE0F\u20E3 *24/7 WhatsApp AI Table & Party Booking* (Instant reservation confirmation)
3\uFE0F\u20E3 *Automated Weekend Foodie Re-engagement* (Brings repeat diners back)
4\uFE0F\u20E3 *Google Maps Ranking & 5-Star Reviews Booster*

\u{1F381} We offer a *Free 3-Day Live Pilot* with zero setup cost for *${name}*.

Reply *YES* if you'd like to see a custom live demo!`;
      }
      if (v.isCA) {
        return `Namaste Team *${name}* (Chartered Accountants)! \u{1F4CA}

I am ${senderName}. We build client automation & secure tech suites for CA firms in ${city}:

1\uFE0F\u20E3 *Modern CA Firm Portal & Mobile App* (Secure client login & ITR tracker)
2\uFE0F\u20E3 *24/7 WhatsApp AI Tax Assistant* (Instant answers to client compliance queries)
3\uFE0F\u20E3 *Automated Document Collection Vault* (Auto-collects GST bills on WhatsApp)
4\uFE0F\u20E3 *Proactive GST/ITR Deadline Reminders* (Zero manual client follow-ups)

\u{1F381} We are offering a *Free 3-Day Live Pilot* with zero upfront setup cost for *${name}*.

Reply *YES* if you'd like to see a custom live demo!`;
      }
      if (v.isHospital) {
        return `Namaste Team *${name}*! \u{1F3E5}

I am ${senderName}. We deliver hospital digitization & AI reception suites in ${city}:

1\uFE0F\u20E3 *Modern Hospital Web Portal & Android App* (Multi-specialty doctor schedule)
2\uFE0F\u20E3 *24/7 WhatsApp AI OPD Reception* (Auto token issue & bed inquiries)
3\uFE0F\u20E3 *Automated Lab Report Delivery on WhatsApp* (PDF dispatch to patients)
4\uFE0F\u20E3 *Google Maps Healthcare Ranking* (5-star reviews engine)

\u{1F381} We offer a *Free 3-Day Live Pilot* for *${name}*.

Reply *YES* if you'd like to see a custom live demo!`;
      }
      if (v.isSalon) {
        return `Hello Team *${name}*! \u2702\uFE0F

I am ${senderName}. We provide technology and AI booking solutions for salons in ${city}:

1\uFE0F\u20E3 *Modern Salon Web App & Android App* (Interactive style gallery & rates)
2\uFE0F\u20E3 *24/7 WhatsApp AI Appointment Booking* (Stylist slot allocation)
3\uFE0F\u20E3 *Automated 3-Week Re-engagement Campaigns* (Boosts repeat client visits)
4\uFE0F\u20E3 *Google Maps Ranking & 5-Star Reviews Engine*

\u{1F381} We offer a *Free 3-Day Live Pilot* for *${name}*.

Reply *YES* to see a live demo!`;
      }
      if (v.isRealEstate) {
        return `Namaste Team *${name}*! \u{1F3E2}

I am ${senderName}. We build automated lead qualification & digital sales suites for real estate firms in ${city}:

1\uFE0F\u20E3 *Interactive Project Showcase Website & Buyer App* (3D floor plans & brochures)
2\uFE0F\u20E3 *24/7 WhatsApp AI Property Qualifier* (Auto-answers pricing & books site visits)
3\uFE0F\u20E3 *Automated Investor Re-engagement Broadcasts*
4\uFE0F\u20E3 *Google Maps SEO & Verified Local Presence*

\u{1F381} We offer a *Free 3-Day Live Pilot* for *${name}*.

Reply *YES* to see a custom demo!`;
      }
      if (v.isTuition) {
        return `Namaste Team *${name}*! \u{1F393}

I am ${senderName}. We build student admissions & parent automation suites for academies in ${city}:

1\uFE0F\u20E3 *Modern Academy Web Portal & Student Mobile App* (Timetables & test series)
2\uFE0F\u20E3 *24/7 WhatsApp AI Admissions & Demo Class Bot*
3\uFE0F\u20E3 *Automated Fee Reminders & Attendance WhatsApp Alerts*
4\uFE0F\u20E3 *Google Maps Education Ranking & 5-Star Reviews*

\u{1F381} We offer a *Free 3-Day Live Pilot* for *${name}*.

Reply *YES* for a live preview!`;
      }
      if (v.isRetail) {
        return `Hello Team *${name}*! \u{1F6CD}\uFE0F

I am ${senderName}. We build digital catalog & WhatsApp commerce suites for retail stores in ${city}:

1\uFE0F\u20E3 *Interactive Mobile Catalog & E-Commerce Web App*
2\uFE0F\u20E3 *24/7 WhatsApp AI Product Inquiries & Order Taking*
3\uFE0F\u20E3 *Automated Festival & VIP Customer Broadcasts*
4\uFE0F\u20E3 *Google Maps Local Shopping Presence*

\u{1F381} We offer a *Free 3-Day Live Pilot* for *${name}*.

Reply *YES* to see a live demo!`;
      }
      return `Namaste Team *${name}*! \u{1FA7A}

I am ${senderName}. We provide modern technology solutions for clinics in ${city}:

1\uFE0F\u20E3 *Modern Responsive Website* (Ultra-fast Next.js)
2\uFE0F\u20E3 *Native Android App* (Play Store ready patient portal)
3\uFE0F\u20E3 *24/7 AI WhatsApp Assistant* (Auto OPD & Booking tokens)
4\uFE0F\u20E3 *Google Maps SEO* (Local rankings & 5-star reviews)

\u{1F381} We are offering a *Free 3-Day Live Pilot* with zero upfront setup cost for *${name}*.

Reply *YES* if you'd like to see a custom live demo!`;
    case "web_mobile":
      if (v.isRestaurant) {
        return `Namaste Team *${name}*! \u{1F310}

Take direct orders without giving away 30% commission. We build custom *Online Ordering Web Apps & Android Apps* for restaurants in ${city}:

\u{1F354} *Direct Digital QR Menu & Mobile Ordering*
\u26A1 *Ultra-Fast Customer Web App* with UPI payment
\u{1F4F1} *Play Store Native App* for your brand

Can I send you a custom mockup for *${name}*? Reply *YES* to review!`;
      }
      if (v.isCA) {
        return `Namaste Team *${name}*! \u{1F310}

We build high-authority *Client Portals & Mobile Apps* for Chartered Accountants in ${city}:

\u{1F512} *Secure Client Document Vault & ITR Tracker*
\u26A1 *Ultra-Fast Next.js Firm Website* (< 1s load speed)
\u{1F4F1} *Native Android Client App* on Google Play Store
\u{1F4B3} *Integrated Online Invoicing & UPI Payments*

Can I send you a custom design mockup for *${name}*? Reply *YES* to review!`;
      }
      if (v.isHospital) {
        return `Namaste Team *${name}*! \u{1F310}

We build lightning-fast *Patient Portals & Android Mobile Apps* for hospitals in ${city}:

\u{1F680} *Ultra-Fast Hospital Website* with instant WhatsApp appointment booking
\u{1F4F1} *Native Android Patient App* (Doctor profiles, OPD booking & health records)
\u{1F4B3} *Integrated Online Consultation & UPI Payment Gateway*

Can I share a custom design mockup for *${name}*? Reply *YES* to see it!`;
      }
      return `Hello Team *${name}*! \u{1F44B}

We build *Lightning-Fast Modern Websites & Android Apps* for businesses in ${city}:

\u{1F680} *Ultra-Fast Next.js High-Performance Website*
\u{1F4F1} *Play Store Ready Native Android App*
\u{1F4B3} *Integrated UPI & Online Payment Gateway*

Can I send you a custom mockup for *${name}*? Reply *YES* to review!`;
    case "whatsapp_ai":
      if (v.isRestaurant) {
        return `Hello Team *${name}*! \u{1F37D}\uFE0F

Stop missing table inquiries and party bookings during rush hours.

We build *24/7 WhatsApp AI Food & Table Booking Agents* in ${city} that:

\u2705 *Instant Table & Party Reservations*: Confirms bookings automatically 24/7
\u2705 *Interactive WhatsApp Food Menu*: Customers browse dishes and order directly
\u2705 *Weekend Re-engagement*: Sends special weekend offers to your past diners

Would you like a quick 2-minute live demo on your WhatsApp? Reply *YES* to test it!

Best regards,
${senderName}`;
      }
      if (v.isCA) {
        return `Namaste Team *${name}* (Chartered Accountants)! \u{1F4BC}

Stop spending hours manually chasing clients for GST invoices and ITR documents.

We build *24/7 WhatsApp AI Agents for CA & Tax Firms* in ${city} that:

\u2705 *Auto-Collect Tax Docs*: Clients upload PAN, Form 16 & GST bills on WhatsApp
\u2705 *Automated Deadline Reminders*: Proactive alerts before GST & Advance Tax dates
\u2705 *24/7 Tax Query Bot*: Answers client compliance & filing status queries instantly

Would you like a quick 2-minute live demo on your WhatsApp? Reply *YES* to see it live!

Best regards,
${senderName}`;
      }
      if (v.isHospital) {
        return `Namaste Team *${name}*! \u{1F3E5}

Eliminate front-desk phone bottlenecks and patient wait times.

We build *24/7 WhatsApp AI Receptionists for Hospitals* in ${city} that:

\u2705 *Instant OPD Token & Bed Inquiries*: Automated token issuance 24/7
\u2705 *Doctor Scheduling*: Real-time OPD slot booking across all specialties
\u2705 *Automated Lab Report Delivery*: Dispatches PDF lab reports to patient WhatsApp

Would you like a quick 2-minute live demo on WhatsApp? Reply *YES* to test it!

Best regards,
${senderName}`;
      }
      if (v.isSalon) {
        return `Hello Team *${name}*! \u2702\uFE0F

Stop losing appointments during busy styling hours when your staff is occupied.

We build *24/7 WhatsApp AI Booking Agents for Salons* in ${city} that:

\u2705 *Instant Slot Booking*: Shows stylist availability & service menu 24/7
\u2705 *Automated Client Re-engagement*: Invites clients back every 3-4 weeks
\u2705 *5-Star Review Engine*: Collects Google ratings after every visit

Would you like a quick 2-minute live demo on your WhatsApp? Reply *YES* to see it live!

Best regards,
${senderName}`;
      }
      return `Namaste Team *${name}*! \u{1FA7A}

We build *24/7 AI WhatsApp Assistants* for professionals in ${city}.

\u2705 *Auto-Book Consultations*: Clients book appointments 24/7 on WhatsApp
\u2705 *Instant Inquiry Answers*: Resolves common questions automatically
\u2705 *Follow-up Reminders*: Proactively reminds clients about next steps

Would you like a quick 2-minute live demo on your WhatsApp? Reply *YES* to see it live!

Best regards,
${senderName}`;
    case "local_seo":
      if (v.isRestaurant) {
        return `Namaste Team *${name}*! \u{1F4CD}

We help restaurants and cafes in ${city} rank higher on *Google Maps* when diners search for "best restaurants near me":

\u2B50 *Automated 5-Star Google Reviews via WhatsApp*
\u{1F4CD} *Google Maps Menu & Photos Optimization*
\u{1F50D} *Improve visibility in local food searches in ${city}*

Would you like a free Local SEO Audit Report for *${name}*? Reply *AUDIT* to receive it today!

Regards,
${senderName}`;
      }
      if (v.isCA) {
        return `Namaste Team *${name}*! \u{1F4CD}

We help CA & tax consulting firms in ${city} rank higher on *Google Maps* when companies search for "best CA near me":

\u2B50 *Automated 5-Star Google Reviews via WhatsApp*
\u{1F4CD} *Google Business Profile Optimization & Audit*
\u{1F50D} *Improve visibility in local corporate searches in ${city}*

Would you like a free Local SEO Audit Report for *${name}*? Reply *AUDIT* to receive it today!

Regards,
${senderName}`;
      }
      return `Namaste Team *${name}*! \u{1F4CD}

We help businesses in ${city} improve their *Google Maps* ranking to generate more local inquiries:

\u2B50 *5-Star Review Automation via WhatsApp*
\u{1F4CD} *Google Business Profile Optimization*
\u{1F50D} *Better visibility in neighbourhood searches in ${city}*

Would you like a free Local SEO Audit Report for *${name}*? Reply *AUDIT* to receive it today!

Regards,
${senderName}`;
    default:
      return `Namaste Team *${name}* \u{1F64F}

I am ${senderName}. We build high-speed websites, Android apps, and 24/7 WhatsApp AI automation suites for businesses in ${city}.

Would you be open to a quick 2-minute preview?`;
  }
}
var PITCH_BUTTONS = [
  { id: "btn_show_demo", title: "\u2705 Yes, Show Demo" },
  { id: "btn_pricing", title: "\u{1F4B0} Pricing & Cost?" },
  { id: "btn_not_now", title: "\u274C Not Now" }
];

// src/services/campaignService.ts
var MAX_LOGS = 70;
var DEFAULT_SENDER = "WebCore Studios";
function nowIso() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function logEntry(text, type = "info") {
  return {
    time: (/* @__PURE__ */ new Date()).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }),
    text,
    type
  };
}
async function appendLog(campaignId, text, type = "info") {
  try {
    const { data } = await supabase.from("campaigns").select("logs").eq("id", campaignId).maybeSingle();
    const existing = Array.isArray(data?.logs) ? data.logs : [];
    const logs = [logEntry(text, type), ...existing].slice(0, MAX_LOGS);
    await supabase.from("campaigns").update({ logs }).eq("id", campaignId);
  } catch (err) {
    console.warn("[Campaign] Could not persist log:", err?.message || err);
  }
}
async function targetCounts(campaignId) {
  const { data } = await supabase.from("campaign_targets").select("status").eq("campaign_id", campaignId);
  const rows = data || [];
  return {
    sent: rows.filter((r) => r.status === "sent").length,
    failed: rows.filter((r) => r.status === "failed").length,
    skipped: rows.filter((r) => String(r.status || "").startsWith("skipped")).length,
    pending: rows.filter((r) => r.status === "pending").length
  };
}
async function tickCampaign() {
  const { data: dueRows, error: dueErr } = await supabase.from("campaigns").select("*").eq("status", "running").lte("next_send_at", nowIso()).order("created_at", { ascending: true }).limit(1);
  if (dueErr) {
    const isSchemaError = dueErr.message?.includes("schema cache") || dueErr.message?.includes("does not exist") || dueErr.code === "PGRST205" || dueErr.code === "42P01";
    if (!isSchemaError) {
      console.error("[Campaign Worker] Could not read due campaigns:", dueErr.message);
    }
    return { acted: false, reason: "query_failed" };
  }
  if (!dueRows || dueRows.length === 0) return { acted: false, reason: "nothing_due" };
  const campaign = dueRows[0];
  const claimedUntil = new Date(Date.now() + (campaign.delay_seconds ?? 35) * 1e3).toISOString();
  const { data: claimed, error: claimErr } = await supabase.from("campaigns").update({ next_send_at: claimedUntil }).eq("id", campaign.id).eq("status", "running").eq("next_send_at", campaign.next_send_at).select("id");
  if (claimErr) {
    console.error("[Campaign Worker] Claim failed:", claimErr.message);
    return { acted: false, reason: "claim_failed" };
  }
  if (!claimed || claimed.length === 0) {
    return { acted: false, reason: "claimed_by_another_worker" };
  }
  const { data: pending } = await supabase.from("campaign_targets").select("*").eq("campaign_id", campaign.id).eq("status", "pending").order("position", { ascending: true }).limit(1);
  if (!pending || pending.length === 0) {
    const counts = await targetCounts(campaign.id);
    await supabase.from("campaigns").update({ status: "completed", finished_at: nowIso() }).eq("id", campaign.id);
    await appendLog(
      campaign.id,
      `\u{1F389} Campaign complete \u2014 ${counts.sent} sent, ${counts.skipped} skipped, ${counts.failed} failed.`,
      "success"
    );
    console.log(`[Campaign Worker] \u2705 ${campaign.id} complete.`);
    return { acted: true, campaignId: campaign.id, reason: "completed" };
  }
  const target = pending[0];
  const outcome = await dispatchTarget(campaign, target);
  await supabase.from("campaigns").update({ current_index: (target.position ?? 0) + 1 }).eq("id", campaign.id);
  return {
    acted: true,
    campaignId: campaign.id,
    target: target.business_name,
    result: outcome
  };
}
async function dispatchTarget(campaign, target) {
  const businessName = target.business_name || "Business Owner";
  const city = target.city || "your city";
  const category = target.category || "business";
  const label = `[${(target.position ?? 0) + 1}/${campaign.total}]`;
  const consentStatus = await lookupConsentStatus(target.lead_id, target.phone_number);
  const gate = await checkOutreachAllowed({ phone: target.phone_number, consentStatus });
  if (!gate.allowed) {
    const status = gate.reason === "opted_out" ? "skipped_opt_out" : "skipped_no_consent";
    await supabase.from("campaign_targets").update({ status, error: gate.detail }).eq("id", target.id);
    await appendLog(campaign.id, `${label} \u23ED\uFE0F Skipped ${businessName}: ${gate.detail}`, "warn");
    console.warn(`[Campaign Worker] Skipped ${businessName} (${gate.reason}).`);
    return "skipped";
  }
  const pitchText = campaign.custom_message ? renderCustomMessage(campaign.custom_message, {
    businessName,
    city,
    category,
    senderName: campaign.sender_name || DEFAULT_SENDER
  }) : buildPersonalizedPitch(
    businessName,
    category,
    city,
    campaign.pitch_type || "all_in_one",
    campaign.sender_name || DEFAULT_SENDER
  );
  await appendLog(campaign.id, `${label} \u{1F4E4} Pitching ${businessName} (${target.phone_number})...`, "info");
  const sendResult = await sendInteractiveButtonsMessage(
    target.phone_number,
    ENV.WHATSAPP_BUSINESS_NUMBER,
    pitchText,
    PITCH_BUTTONS.map((b) => ({ id: b.id, title: b.title }))
  );
  if (!sendResult.success) {
    await supabase.from("campaign_targets").update({ status: "failed", error: sendResult.error || "send failed" }).eq("id", target.id);
    await appendLog(campaign.id, `${label} \u26A0\uFE0F Failed ${businessName}: ${sendResult.error}`, "warn");
    if (sendResult.notConfigured) {
      await supabase.from("campaigns").update({ status: "paused" }).eq("id", campaign.id);
      await appendLog(
        campaign.id,
        "\u23F8\uFE0F Campaign auto-paused: WhatsApp credentials are not configured. Set WHATSAPP_CLOUD_API_TOKEN and WHATSAPP_PHONE_NUMBER_ID, then resume.",
        "warn"
      );
    }
    return "failed";
  }
  await supabase.from("campaign_targets").update({ status: "sent", sent_at: nowIso(), error: null }).eq("id", target.id);
  await recordOutboundConversation(campaign.business_id, target.phone_number, pitchText);
  await markLeadContacted(target.lead_id, target.phone_number, campaign.pitch_type);
  await appendLog(campaign.id, `${label} \u2705 Delivered to ${businessName}`, "success");
  return "sent";
}
async function lookupConsentStatus(leadId, phone) {
  try {
    if (leadId) {
      const { data } = await supabase.from("lead_hunter_leads").select("consent_status").eq("id", leadId).maybeSingle();
      if (data) return data.consent_status || "none";
    }
    const last10 = (phone || "").replace(/\D/g, "").slice(-10);
    if (last10.length === 10) {
      const { data } = await supabase.from("lead_hunter_leads").select("consent_status").like("phone_number", `%${last10}`).limit(1);
      if (data && data.length > 0) return data[0].consent_status || "none";
    }
  } catch (err) {
    console.warn("[Campaign] Consent lookup failed:", err?.message || err);
  }
  return "none";
}
async function recordOutboundConversation(businessId, phone, text) {
  const bizId = businessId || await resolveOperatorBusinessId();
  if (!bizId) {
    console.warn("[Campaign] No operator business resolved \u2014 outbound pitch not logged to conversations.");
    return;
  }
  try {
    await supabase.from("conversations").insert({
      business_id: bizId,
      customer_number: phone,
      message_text: text,
      message_direction: "outbound"
    });
  } catch (err) {
    console.warn("[Campaign] Conversation log failed:", err?.message || err);
  }
}
async function markLeadContacted(leadId, phone, pitchType) {
  try {
    const columns = "id, contact_attempts, first_contacted_at";
    let lead = null;
    if (leadId) {
      const { data } = await supabase.from("lead_hunter_leads").select(columns).eq("id", leadId).maybeSingle();
      lead = data;
    } else {
      const last10 = (phone || "").replace(/\D/g, "").slice(-10);
      if (last10.length !== 10) return;
      const { data } = await supabase.from("lead_hunter_leads").select(columns).like("phone_number", `%${last10}`).limit(1);
      lead = data && data.length > 0 ? data[0] : null;
    }
    if (!lead) return;
    await supabase.from("lead_hunter_leads").update({
      status: "sent",
      pitch_type: pitchType || null,
      first_contacted_at: lead.first_contacted_at || nowIso(),
      last_contacted_at: nowIso(),
      contact_attempts: (lead.contact_attempts || 0) + 1
    }).eq("id", lead.id);
  } catch (err) {
    console.warn("[Campaign] Could not update lead contact state:", err?.message || err);
  }
}
function startCampaignWorker(intervalMs = 5e3) {
  console.log(`[Campaign Worker] Started \u2014 polling every ${Math.round(intervalMs / 1e3)}s.`);
  return setInterval(async () => {
    try {
      await tickCampaign();
    } catch (err) {
      console.error("[Campaign Worker] Tick failed:", err?.message || err);
    }
  }, intervalMs);
}

// src/server.ts
var app = express();
app.use(cors());
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString("utf8");
    }
  })
);
app.use(express.urlencoded({ extended: true }));
app.use((req, _res, next) => {
  console.log(`[HTTP] ${req.method} ${req.path} - ${(/* @__PURE__ */ new Date()).toISOString()}`);
  next();
});
app.use("/", health_default);
app.use("/", webhook_default);
app.use("/", invoice_default);
app.use("/billing", billing_default);
app.use("/", payment_default);
app.use("/api/ca", caRouter);
initCACronScheduler();
initHospitalCronScheduler();
startCampaignWorker(5e3);
setInterval(async () => {
  try {
    await fetch(`http://localhost:${ENV.PORT}/billing/check-trials`, { method: "POST" });
  } catch (err) {
    console.error("[Periodic Trial Check Error]:", err.message);
  }
}, 60 * 60 * 1e3);
app.use((err, _req, res, _next) => {
  console.error("\u{1F525} Server Unhandled Error:", err);
  res.status(500).json({ error: "Internal Server Error", details: err.message });
});
process.on("uncaughtException", (err) => {
  console.error("\u{1F525} Uncaught Exception:", err);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("\u{1F525} Unhandled Rejection at:", promise, "reason:", reason);
});
app.listen(ENV.PORT, () => {
  console.log(`
======================================================`);
  console.log(`\u{1F680} Agento AI Backend Engine Live!`);
  console.log(`\u{1F4E1} Listening on Port        : http://localhost:${ENV.PORT}`);
  console.log(`\u{1F4E5} WhatsApp Webhook         : http://localhost:${ENV.PORT}/webhook`);
  console.log(`\u{1F4B3} Create Order Endpoint    : http://localhost:${ENV.PORT}/api/create-order`);
  console.log(`\u{1F510} Verify Payment Endpoint  : http://localhost:${ENV.PORT}/api/verify-payment`);
  console.log(`======================================================
`);
});
var server_default = app;
export {
  server_default as default
};
