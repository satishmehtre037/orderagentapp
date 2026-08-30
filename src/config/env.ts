import dotenv from 'dotenv';
dotenv.config({ path: '.env', override: true });
dotenv.config({ path: '.env.local', override: true });

export const ENV = {
  SUPABASE_URL: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  /** Primary Groq model. Must be a slug Groq actually serves — see groqService. */
  GROQ_MODEL: process.env.GROQ_MODEL || '',
  WHATSAPP_CLOUD_API_TOKEN: process.env.WHATSAPP_CLOUD_API_TOKEN || '',
  WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  WHATSAPP_VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN || '',
  /** Meta App Secret — used to validate the x-hub-signature-256 webhook header. */
  WHATSAPP_APP_SECRET: process.env.WHATSAPP_APP_SECRET || '',
  /** The business WhatsApp number Meta sends from (display number, digits only). */
  WHATSAPP_BUSINESS_NUMBER: (process.env.WHATSAPP_BUSINESS_NUMBER || '').replace(/\D/g, ''),
  /** Operator number that receives inbound-lead alerts. Empty = alerts disabled. */
  ADMIN_ALERT_NUMBER: (process.env.ADMIN_ALERT_NUMBER || '').replace(/\D/g, ''),
  /** Google Places API key. Without it, lead sourcing is disabled (never faked). */
  GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY || '',
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  /**
   * Razorpay plan id for the ₹999/mo subscription. Left empty when unset: this
   * used to default to 'plan_monthly_999_bizbot', an id Razorpay has never
   * issued, so subscription creation failed with an opaque API error instead of
   * saying the plan id was missing.
   */
  RAZORPAY_PLAN_ID: process.env.RAZORPAY_PLAN_ID || '',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  /** Anthropic / AgentRouter API Key or Bearer Token */
  ANTHROPIC_AUTH_TOKEN:
    process.env.ANTHROPIC_AUTH_TOKEN ||
    process.env.ANTHROPIC_API_KEY ||
    'sk-YC1gMWBHv5joaFyRGVJ0TGedqQjmcYQ3F1IO1uQnssJSIi3s',
  /** Anthropic Base URL (e.g. https://agentrouter.org or https://api.anthropic.com) */
  ANTHROPIC_BASE_URL: (process.env.ANTHROPIC_BASE_URL || 'https://agentrouter.org').replace(/\/+$/, ''),
  /** AgentRouter / Model slug (e.g. glm-5.3, claude-3-5-sonnet-20241022) */
  ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL || 'glm-5.3',
  /** Preferred AI Provider: 'groq', 'agentrouter', 'claude', or 'auto' */
  AI_PROVIDER: process.env.AI_PROVIDER || 'groq',
  /** Fast2SMS API Key for real-time Indian SMS OTP delivery */
  FAST2SMS_API_KEY: process.env.FAST2SMS_API_KEY || '',
  PORT: parseInt(process.env.PORT || '3001', 10),
};

const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missingVars = requiredEnvVars.filter((key) => !ENV[key as keyof typeof ENV]);

if (!ENV.GROQ_API_KEY) {
  console.warn(`⚠️ [Config Warning] GROQ_API_KEY is not set in .env.`);
}

if (!ENV.WHATSAPP_VERIFY_TOKEN) {
  console.warn(
    `⚠️ [Config Warning] WHATSAPP_VERIFY_TOKEN is not set. Meta webhook verification will be REJECTED until it is.`
  );
}

if (!ENV.WHATSAPP_APP_SECRET) {
  console.warn(
    `⚠️ [Config Warning] WHATSAPP_APP_SECRET is not set. Inbound webhook payload signatures cannot be verified.`
  );
}

if (missingVars.length > 0) {
  console.warn(`⚠️ [Config Warning] Missing environment variables: ${missingVars.join(', ')}. Set them in .env.`);
}
