import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { dispatchVoiceCall } from '@/services/voiceCallService';

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

/**
 * POST — place a real outbound AI voice call.
 *
 * This used to log every attempt as `status: 'completed'`, `outcome: 'confirmed'`
 * with a random `duration_seconds` between 35 and 75 and a transcript claiming
 * "Patient confirmed presence" — even when no telephony provider was configured
 * and no call was placed. It then WhatsApped the patient thanking them for a
 * conversation that never happened. Both are gone: the record now says queued or
 * failed, and no recap is sent for a call that did not go out.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      business_id,
      patient_id,
      appointment_id,
      patient_name,
      patient_phone,
      doctor_name,
      appointment_time,
      hospital_name,
      call_type = 'appointment_reminder',
      reason,
    } = body;

    if (!patient_name || !patient_phone) {
      return NextResponse.json(
        { success: false, error: 'Patient name and phone number are required to trigger an AI voice call.' },
        { status: 400 }
      );
    }

    const outcome = await dispatchVoiceCall({
      businessId: business_id,
      patientId: patient_id,
      appointmentId: appointment_id,
      patientName: patient_name,
      patientPhone: patient_phone,
      doctorName: doctor_name,
      appointmentTime: appointment_time,
      hospitalName: hospital_name,
      callType: call_type,
      promptTask: reason,
    });

    if (!outcome.dispatched) {
      return NextResponse.json(
        {
          success: false,
          error: outcome.error || 'No voice provider was able to place the call.',
          hint: 'Configure VAPI_API_KEY (with VAPI_PHONE_NUMBER_ID) or BLAND_API_KEY to place real calls.',
          call: outcome.record,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      call: outcome.record,
      provider: outcome.provider,
      callId: outcome.callId,
      status: 'queued',
      notice:
        'The call is queued with the provider. Duration and outcome remain null until the provider reports the result.',
    });
  } catch (error: any) {
    console.error('Error triggering voice call:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
