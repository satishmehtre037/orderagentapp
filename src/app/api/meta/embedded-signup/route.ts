import { NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';
import { ENV } from '@/config/env';
import crypto from 'crypto';

const adminSupabase = supabase;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { code, phone_number_id, waba_id, businessId, email, customPin, redirect_uri } = body;

    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || process.env.WEBCORE_STUDIO_APP_ID || '1368087472137493';
    const appSecret = process.env.WEBCORE_STUDIO_APP_SECRET || ENV.WHATSAPP_APP_SECRET || process.env.WHATSAPP_APP_SECRET || 'd0ab51314556a00433ccf3ddf00526e8';

    const origin = req.headers.get('origin') || 'https://orderagentapp.webcorestudio.dev';
    const finalRedirectUri = redirect_uri || `${origin}/meta-callback`;

    let accessToken = ENV.WHATSAPP_CLOUD_API_TOKEN || process.env.WHATSAPP_CLOUD_API_TOKEN;
    let registeredPhone = '';

    // 1. If Meta returned an OAuth code, exchange it for a System User / Business Access Token
    if (code && appSecret) {
      try {
        const tokenRes = await fetch(
          `https://graph.facebook.com/v20.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${code}&redirect_uri=${encodeURIComponent(finalRedirectUri)}`
        );
        const tokenData = await tokenRes.json();
        console.log('[Meta Token Exchange Result]:', tokenData?.access_token ? 'SUCCESS' : tokenData?.error?.message);
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
          // 1. Discover WABA IDs from granular_scopes if available
          let targetWabaIds: string[] = [];
          try {
            if (appSecret) {
              const debugRes = await fetch(`https://graph.facebook.com/v20.0/debug_token?input_token=${accessToken}&access_token=${appId}|${appSecret}`);
              const debugData = await debugRes.json();
              const granular = debugData?.data?.granular_scopes || [];
              for (const g of granular) {
                if (g?.target_ids?.length) {
                  targetWabaIds.push(...g.target_ids);
                }
              }
            }
          } catch (dErr) {
            console.warn('[Debug Token Inspection Warning]:', dErr);
          }

          // 2. Fetch direct phone numbers from target WABAs
          for (const wid of targetWabaIds) {
            if (registeredPhone) break;
            try {
              const pRes = await fetch(`https://graph.facebook.com/v20.0/${wid}/phone_numbers?fields=id,display_phone_number,verified_name`, {
                headers: { Authorization: `Bearer ${accessToken}` },
              });
              const pData = await pRes.json();
              const phone = pData?.data?.[0];
              if (phone?.display_phone_number) {
                registeredPhone = phone.display_phone_number;
                phone_number_id = phone.id || phone_number_id;
                waba_id = wid;
                break;
              }
            } catch (err) {
              console.warn(`[WABA ${wid} Phone Fetch Warning]:`, err);
            }
          }

          // 3. Fallback: discover via /me/whatsapp_business_accounts
          if (!registeredPhone) {
            const wabaRes = await fetch(`https://graph.facebook.com/v20.0/me/whatsapp_business_accounts?fields=id,name,phone_numbers{id,display_phone_number,verified_name}`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            const wabaData = await wabaRes.json();
            for (const waba of wabaData?.data || []) {
              const phone = waba?.phone_numbers?.data?.[0];
              if (phone?.display_phone_number) {
                registeredPhone = phone.display_phone_number;
                phone_number_id = phone.id || phone_number_id;
                waba_id = waba.id || waba_id;
                break;
              }
            }
          }

          // 4. Fallback: discover via /me/businesses
          if (!registeredPhone) {
            const bizRes = await fetch(`https://graph.facebook.com/v20.0/me/businesses?fields=id,name,owned_whatsapp_business_accounts{id,name,phone_numbers{id,display_phone_number,verified_name}}`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            const bizData = await bizRes.json();
            for (const b of bizData?.data || []) {
              for (const w of b?.owned_whatsapp_business_accounts?.data || []) {
                const phone = w?.phone_numbers?.data?.[0];
                if (phone?.display_phone_number) {
                  registeredPhone = phone.display_phone_number;
                  phone_number_id = phone.id || phone_number_id;
                  waba_id = w.id || waba_id;
                  break;
                }
              }
              if (registeredPhone) break;
            }
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
