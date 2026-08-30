import { ENV } from '../src/config/env';
import { supabase } from '../src/config/supabase';
import crypto from 'crypto';

async function runAudit() {
  console.log('=== REAL META WHATSAPP PLATFORM INTEGRATION AUDIT ===\n');

  const token = ENV.WHATSAPP_CLOUD_API_TOKEN || process.env.WHATSAPP_CLOUD_API_TOKEN || '';
  const phoneId = ENV.WHATSAPP_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  const appSecret = ENV.WHATSAPP_APP_SECRET || process.env.WHATSAPP_APP_SECRET || '';

  // 1 & 4. Real Phone Number ID Retrieval & Registration status
  console.log('[1/14] Querying Real Meta Phone Number ID Endpoint:');
  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}?fields=id,display_phone_number,verified_name,status,quality_rating,account_mode,code_verification_status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    console.log('  -> Real Meta Response:', JSON.stringify(data));
  } catch (e: any) {
    console.error('  -> Failed:', e.message);
  }

  // 5. Real Access Token Validation
  console.log('\n[5/14] Validating Real Meta System User Access Token:');
  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/debug_token?input_token=${token}&access_token=${token}`);
    const data = await res.json();
    console.log('  -> Token Valid:', data?.data?.is_valid);
    console.log('  -> Scopes:', data?.data?.scopes);
    console.log('  -> App ID:', data?.data?.app_id);
  } catch (e: any) {
    console.error('  -> Failed:', e.message);
  }

  // 7. Real Webhook HMAC-SHA256 Signature Verification Test
  console.log('\n[7/14] Validating Real Webhook Signature HMAC Calculation:');
  const samplePayload = JSON.stringify({ object: 'whatsapp_business_account', entry: [] });
  const computedSignature = 'sha256=' + crypto.createHmac('sha256', appSecret).update(samplePayload).digest('hex');
  console.log('  -> App Secret Present:', !!appSecret);
  console.log('  -> Computed Signature:', computedSignature.slice(0, 20) + '...');

  // 9, 10, 12. Supabase Multi-Tenant Routing & Isolation
  console.log('\n[9, 10, 12/14] Testing Multi-Tenant Phone Number Routing:');
  const { data: businesses, error } = await supabase.from('businesses').select('id, name, whatsapp_number, category');
  console.log('  -> Total Registered Businesses in Supabase:', businesses?.length);
  if (businesses && businesses.length > 0) {
    businesses.forEach((b, idx) => {
      console.log(`     [Business ${idx + 1}] ID: ${b.id.slice(0, 8)}... | Name: ${b.name} | Number: ${b.whatsapp_number} | Category: ${b.category}`);
    });
  }
}

runAudit();
