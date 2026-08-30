import { NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';
import { generateAndStoreOtp } from '@/services/otpService';
import { sendFast2SmsOtp } from '@/services/smsService';

const adminSupabase = supabase;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phoneNumber, businessName, email, businessId } = body;

    const cleanDigits = (phoneNumber || '').replace(/\D/g, '');
    let tenDigit = '';
    if (cleanDigits.length === 10) {
      tenDigit = cleanDigits;
    } else if (cleanDigits.length === 12 && cleanDigits.startsWith('91')) {
      tenDigit = cleanDigits.slice(2);
    } else if (cleanDigits.length > 10) {
      tenDigit = cleanDigits.slice(-10);
    }

    if (!tenDigit || !/^[6-9]\d{9}$/.test(tenDigit)) {
      return NextResponse.json({
        success: false,
        error: 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).',
      }, { status: 400 });
    }

    const internationalFormatted = `+91 ${tenDigit}`;
    const cleanStandard = `+91${tenDigit}`;

    // 1. Anti-collision check across other businesses in Supabase
    const { data: matches } = await adminSupabase
      .from('businesses')
      .select('id, name, owner_email, whatsapp_number')
      .or(`whatsapp_number.eq.${cleanStandard},whatsapp_number.eq.${internationalFormatted},whatsapp_number.eq.${tenDigit},whatsapp_number.eq.91${tenDigit}`);

    const conflict = matches?.find((m) => {
      if (businessId && m.id === businessId) return false;
      if (email && m.owner_email && m.owner_email.toLowerCase() === email.trim().toLowerCase()) return false;
      return true;
    });

    if (conflict) {
      return NextResponse.json({
        success: false,
        error: `WhatsApp number ${internationalFormatted} is already registered to another business account. Each business requires a unique number.`,
      }, { status: 409 });
    }

    // 2. Generate and securely store 6-digit SMS OTP
    const generatedOtp = generateAndStoreOtp(tenDigit, email || '');

    // 3. Dispatch real transactional SMS via Fast2SMS
    await sendFast2SmsOtp(tenDigit, generatedOtp);

    return NextResponse.json({
      success: true,
      step: 'AWAITING_OTP',
      formatted: internationalFormatted,
      message: `6-digit verification code sent via SMS to ${internationalFormatted}.`,
    });
  } catch (err: any) {
    console.error('[Request OTP Exception]:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to request SMS OTP' }, { status: 500 });
  }
}
