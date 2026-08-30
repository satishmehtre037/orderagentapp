import { NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';

const adminSupabase = supabase;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawNumber = searchParams.get('number') || '';
    const email = (searchParams.get('email') || '').trim().toLowerCase();
    const businessId = searchParams.get('businessId') || searchParams.get('id') || '';

    const digitsOnly = rawNumber.replace(/\D/g, '');
    let tenDigit = '';
    if (digitsOnly.length === 10) {
      tenDigit = digitsOnly;
    } else if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
      tenDigit = digitsOnly.slice(2);
    } else if (digitsOnly.length > 10) {
      tenDigit = digitsOnly.slice(-10);
    }

    // 1. Mobile Format Validation
    if (!tenDigit || !/^[6-9]\d{9}$/.test(tenDigit)) {
      return NextResponse.json({
        valid: false,
        available: false,
        error: 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).',
      });
    }

    const internationalFormatted = `+91 ${tenDigit}`;
    const cleanStandard = `+91${tenDigit}`;

    // 2. Database Anti-Collision Check
    const { data: matches, error } = await adminSupabase
      .from('businesses')
      .select('id, name, owner_email, whatsapp_number')
      .or(`whatsapp_number.eq.${cleanStandard},whatsapp_number.eq.${internationalFormatted},whatsapp_number.eq.${tenDigit},whatsapp_number.eq.91${tenDigit}`);

    if (error) {
      console.error('[Check Number API Error]:', error);
    }

    const conflict = matches?.find((m) => {
      if (businessId && m.id === businessId) return false;
      if (email && m.owner_email && m.owner_email.toLowerCase() === email) return false;
      return true;
    });

    if (conflict) {
      return NextResponse.json({
        valid: true,
        available: false,
        conflict: true,
        error: `Mobile number ${internationalFormatted} is already registered to another business. Please enter a fresh dedicated number.`,
      });
    }

    return NextResponse.json({
      valid: true,
      available: true,
      formatted: internationalFormatted,
      message: 'Mobile number available for verification.',
    });
  } catch (err: any) {
    console.error('[Check Number Exception]:', err);
    return NextResponse.json({ error: err.message || 'Server validation error' }, { status: 500 });
  }
}
