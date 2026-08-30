import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { dispatchVoiceCall } from '@/services/voiceCallService';
import { requireBusiness } from '@/lib/auth/requireBusiness';

export async function GET(req: Request) {
  try {
    const auth = await requireBusiness(req);
    if (auth.errorResponse) {
      return auth.errorResponse;
    }
    const { businessId } = auth;

    const { searchParams } = new URL(req.url);
    const callType = searchParams.get('call_type');

    let query = supabaseAdmin
      .from('hospital_voice_calls')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

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
    const auth = await requireBusiness(req);
    if (auth.errorResponse) {
      return auth.errorResponse;
    }
    const { business, businessId } = auth;

    const body = await req.json();
    const {
      patient_id,
      appointment_id,
      patient_name,
      patient_phone,
      doctor_name,
      appointment_time,
      call_type = 'appointment_reminder',
      reason,
    } = body;

    if (!patient_name || !patient_phone) {
      return NextResponse.json(
        { success: false, error: 'Patient name and phone number are required to trigger an AI voice call.' },
        { status: 400 }
      );
    }

    const hospitalName = business?.name || 'Hospital & Multi-Specialty Clinic';

    const outcome = await dispatchVoiceCall({
      businessId,
      patientId: patient_id,
      appointmentId: appointment_id,
      patientName: patient_name,
      patientPhone: patient_phone,
      doctorName: doctor_name,
      appointmentTime: appointment_time,
      hospitalName,
      callType: call_type,
      promptTask: reason,
    });

    if (!outcome.dispatched) {
      return NextResponse.json(
        {
          success: false,
          error: outcome.error || 'No voice provider was able to place the call.',
          hint: 'Configure ELEVENLABS_API_KEY, VAPI_API_KEY, or BLAND_API_KEY to place real calls.',
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
