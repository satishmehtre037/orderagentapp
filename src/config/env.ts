import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  WHATSAPP_CLOUD_API_TOKEN: process.env.WHATSAPP_CLOUD_API_TOKEN || '',
  WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  WHATSAPP_VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN || 'your-custom-webhook-verify-token',
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_key_id',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_mock_key_secret',
  RAZORPAY_PLAN_ID: process.env.RAZORPAY_PLAN_ID || 'plan_monthly_999_bizbot',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || 'bizbot_webhook_secret_999',
  PORT: parseInt(process.env.PORT || '3001', 10),
};

const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missingVars = requiredEnvVars.filter((key) => !ENV[key as keyof typeof ENV]);

if (!ENV.GROQ_API_KEY) {
  console.warn(`⚠️ [Config Warning] GROQ_API_KEY is not set in .env.`);
}

if (missingVars.length > 0) {
  console.warn(`⚠️ [Config Warning] Missing environment variables: ${missingVars.join(', ')}. Set them in .env.`);
}
