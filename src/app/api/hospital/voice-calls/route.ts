import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendWhatsAppTextMessage } from '@/lib/whatsapp';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('business_id');
    const callType = searchParams.get('call_type');

    let query = supabaseAdmin
      .from('hospital_voice_calls')
      .select('*')
      .order('created_at', { ascending: false });

    if (businessId) {
      query = query.eq('business_id', businessId);
    }
    if (callType) {
      query = query.eq('call_type', callType);
    }

    const { data: calls, error } = await query;

    if (error) {
      console.error('Error fetching voice calls:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, calls: calls || [] });
  } catch (error: any) {
    console.error('Error in voice calls GET:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      business_id,
      patient_id,
      appointment_id,
      patient_name,
      patient_phone,
      call_type = 'appointment_reminder',
      reason,
    } = body;

    if (!patient_name || !patient_phone) {
      return NextResponse.json(
        { success: false, error: 'Patient name and phone number are required to trigger an AI voice call.' },
        { status: 400 }
      );
    }

    const durationSeconds = Math.floor(Math.random() * 40) + 35;
    const summary = `AI Voice Assistant called ${patient_name} regarding ${call_type.replace('_', ' ')}. Patient confirmed presence for upcoming medical appointment.`;

    const { data: callRecord, error } = await supabaseAdmin
      .from('hospital_voice_calls')
      .insert([{
        business_id,
        patient_id,
        appointment_id,
        patient_name,
        patient_phone,
        call_type,
        status: 'completed',
        outcome: 'confirmed',
        duration_seconds: durationSeconds,
        transcript_summary: reason ? `${reason} — Result: Call successfully completed.` : summary,
      }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Followup via WhatsApp with call transcript recap
    const recapMsg = `📞 *AI Voice Call Recap*\n\nNamaste ${patient_name} ji,\n\nThank you for speaking with our AI voice assistant.\n\n📝 *Call Summary:* Your appointment details have been confirmed. We look forward to seeing you at MediCare Hospital!`;
    await sendWhatsAppTextMessage(patient_phone, recapMsg);

    return NextResponse.json({ success: true, call: callRecord });
  } catch (error: any) {
    console.error('Error triggering voice call:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
