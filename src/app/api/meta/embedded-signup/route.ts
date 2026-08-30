import { NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';
import { ENV } from '@/config/env';
import crypto from 'crypto';

const adminSupabase = supabase;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, phone_number_id, waba_id, businessId, email, customPin } = body;

    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '4476606339291818';
    const appSecret = ENV.WHATSAPP_APP_SECRET || process.env.WHATSAPP_APP_SECRET;

    let accessToken = ENV.WHATSAPP_CLOUD_API_TOKEN || process.env.WHATSAPP_CLOUD_API_TOKEN;
    let registeredPhone = '';

    // 1. If Meta returned an OAuth code, exchange it for a System User / Business Access Token
    if (code && appSecret) {
      try {
        const tokenRes = await fetch(
          `https://graph.facebook.com/v20.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${code}`
        );
        const tokenData = await tokenRes.json();
        if (tokenData?.access_token) {
          accessToken = tokenData.access_token;
        }
      } catch (tokenErr) {
        console.warn('[Meta Embedded Token Exchange Warning]:', tokenErr);
      }
    }

    // 2. Fetch Phone Number details from Meta Graph API using phone_number_id or WABA lookup
    if (accessToken) {
      try {
        if (phone_number_id) {
          const phoneRes = await fetch(`https://graph.facebook.com/v20.0/${phone_number_id}?fields=display_phone_number,verified_name,status,quality_rating`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const phoneData = await phoneRes.json();
          if (phoneData?.display_phone_number) {
            registeredPhone = phoneData.display_phone_number;
          }
        } else {
          // Discover phone numbers from user's linked WhatsApp Business Accounts
          const wabaRes = await fetch(`https://graph.facebook.com/v20.0/me/whatsapp_business_accounts?fields=id,name,phone_numbers{id,display_phone_number,verified_name}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const wabaData = await wabaRes.json();
          const firstPhone = wabaData?.data?.[0]?.phone_numbers?.data?.[0];
          if (firstPhone?.display_phone_number) {
            registeredPhone = firstPhone.display_phone_number;
          }
        }

        // Fallback to default Cloud API Phone ID if available
        if (!registeredPhone && ENV.WHATSAPP_PHONE_NUMBER_ID && accessToken) {
          const defaultPhoneRes = await fetch(`https://graph.facebook.com/v20.0/${ENV.WHATSAPP_PHONE_NUMBER_ID}?fields=display_phone_number,verified_name,status`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const defaultData = await defaultPhoneRes.json();
          if (defaultData?.display_phone_number) {
            registeredPhone = defaultData.display_phone_number;
          }
        }
      } catch (pErr) {
        console.warn('[Meta Phone Info Warning]:', pErr);
      }
    }

    // 3. Register Phone Number on Meta Cloud API with a secure, tenant-isolated 6-digit PIN
    if (phone_number_id && accessToken) {
      try {
        const tenantSecurePin = (customPin && /^\d{6}$/.test(customPin))
          ? customPin
          : crypto.randomInt(100000, 999999).toString();

        const regRes = await fetch(`https://graph.facebook.com/v20.0/${phone_number_id}/register`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            pin: tenantSecurePin,
          }),
        });
        const regData = await regRes.json();
        if (!regRes.ok && regData?.error?.code !== 133010) {
          console.warn('[Meta Phone Registration Notice]:', regData?.error?.message || 'Handled by Meta Embedded Signup');
        }
      } catch (regErr) {
        console.warn('[Meta Phone Register Warning]:', regErr);
      }
    }

    // 4. Subscribe WABA to Agento AI Webhook
    if (waba_id && accessToken) {
      try {
        await fetch(`https://graph.facebook.com/v20.0/${waba_id}/subscribed_apps`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (subErr) {
        console.warn('[Meta Webhook Subscription Warning]:', subErr);
      }
    }

    // 5. Clean target phone number (ensure 10 digits if available)
    const rawDigits = (registeredPhone || '').replace(/\D/g, '');
    const cleanTenDigits = rawDigits.length >= 10 ? rawDigits.slice(-10) : '';
    const targetPhone = cleanTenDigits ? `+91 ${cleanTenDigits}` : '';

    if (businessId || email) {
      const updateData: Record<string, any> = {};
      if (targetPhone) updateData.whatsapp_number = targetPhone;

      const query = businessId
        ? adminSupabase.from('businesses').update(updateData).eq('id', businessId)
        : adminSupabase.from('businesses').update(updateData).eq('owner_email', email);

      await query;
    }

    return NextResponse.json({
      success: true,
      waba_id,
      phone_number_id,
      whatsapp_number: cleanTenDigits,
      message: 'WhatsApp Business Account successfully provisioned & connected to Agento AI 24/7 Staff!',
    });
  } catch (err: any) {
    console.error('[Embedded Signup Error]:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to process Meta Embedded Signup' }, { status: 500 });
  }
}
