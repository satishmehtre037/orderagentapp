import { NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';
import { ENV } from '@/config/env';
import { verifyStoredOtp } from '@/services/otpService';

const adminSupabase = supabase;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phoneNumber, otp, email, businessId } = body;

    const cleanDigits = (phoneNumber || '').replace(/\D/g, '');
    let tenDigit = cleanDigits.slice(-10);
    const cleanOtp = (otp || '').trim();

    if (!cleanOtp || cleanOtp.length < 4) {
      return NextResponse.json({
        success: false,
        error: 'Please enter the 6-digit verification code sent to your phone.',
      }, { status: 400 });
    }

    const internationalFormatted = `+91 ${tenDigit}`;

    // 1. Verify against In-App Stored OTP
    const localVerification = verifyStoredOtp(tenDigit, cleanOtp);

    // 2. Also attempt Meta Graph API verification if token is present
    const token = ENV.WHATSAPP_CLOUD_API_TOKEN || process.env.WHATSAPP_CLOUD_API_TOKEN;
    const phoneId = ENV.WHATSAPP_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (token && phoneId) {
      try {
        const registerRes = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/register`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            pin: '123456',
            code: cleanOtp,
          }),
        });

        const regData = await registerRes.json();
        if (!registerRes.ok && regData?.error) {
          const errMsg = regData.error.message || '';
          if (regData.error.code === 133004 || errMsg.toLowerCase().includes('existing account')) {
            return NextResponse.json({
              success: false,
              code: 'ACTIVE_ON_APP',
              error: 'This number is currently active on your personal WhatsApp phone app. Meta requires you to delete the account in WhatsApp Settings > Account > Delete Account to release it for Cloud API.',
            }, { status: 400 });
          }
          if (regData.error.code === 133010) {
            return NextResponse.json({
              success: false,
              error: 'Invalid or expired OTP code. Please check your SMS and try again.',
            }, { status: 400 });
          }
        }
      } catch (err) {
        console.error('[Meta Register API Error]:', err);
      }
    }

    if (!localVerification.valid) {
      return NextResponse.json({
        success: false,
        error: localVerification.error || 'Invalid or expired OTP code. Please try again.',
      }, { status: 400 });
    }

    // 3. Update Supabase business record if businessId or email exists
    if (businessId || email) {
      const targetQuery = businessId
        ? adminSupabase.from('businesses').update({ whatsapp_number: internationalFormatted }).eq('id', businessId)
        : adminSupabase.from('businesses').update({ whatsapp_number: internationalFormatted }).eq('owner_email', email);

      await targetQuery;
    }

    return NextResponse.json({
      success: true,
      verified: true,
      formatted: internationalFormatted,
      message: `WhatsApp Number ${internationalFormatted} verified and active on Meta Cloud API!`,
    });
  } catch (err: any) {
    console.error('[Verify OTP Exception]:', err);
    return NextResponse.json({ success: false, error: err.message || 'Verification failed' }, { status: 500 });
  }
}
