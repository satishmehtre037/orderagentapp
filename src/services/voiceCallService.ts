import { supabase } from '../config/supabase';
import { triggerVapiCall } from './vapiService';
import { triggerBlandCall } from './blandService';

/**
 * Outbound AI voice calls, recorded honestly.
 *
 * The cron follow-up engine used to insert a `hospital_voice_calls` row with
 * `status: 'completed'`, `outcome: 'reschedule_requested'`, `duration_seconds: 52`
 * and a transcript summary describing a conversation, without ever contacting a
 * telephony provider. The dashboard then showed those invented calls as
 * completed patient interactions. The voice-calls API route did the same with a
 * random duration between 35 and 75 seconds.
 *
 * A row is now written only to describe what actually happened:
 *   - `queued`  — a provider accepted the call; duration/outcome stay null until
 *                 a provider webhook fills them in.
 *   - `failed`  — no provider configured, or the provider rejected it.
 * Nothing here claims a call connected, and nothing invents a duration or a
 * transcript.
 */

export interface VoiceCallRequest {
  businessId?: string | null;
  patientId?: string | null;
  appointmentId?: string | null;
  patientName: string;
  patientPhone: string;
  doctorName?: string;
  appointmentTime?: string;
  callType?: string;
  promptTask?: string;
  hospitalName?: string;
}

export interface VoiceCallOutcome {
  dispatched: boolean;
  provider: 'vapi' | 'bland' | 'none';
  callId?: string;
  error?: string;
  record?: any;
}

/** Resolves the tenant's real name — we never place a call claiming a made-up hospital. */
export async function resolveBusinessName(businessId?: string | null): Promise<string | null> {
  if (!businessId) return null;
  try {
    const { data } = await supabase.from('businesses').select('name').eq('id', businessId).maybeSingle();
    return data?.name || null;
  } catch {
    return null;
  }
}

export async function dispatchVoiceCall(req: VoiceCallRequest): Promise<VoiceCallOutcome> {
  const hospitalName = req.hospitalName || (await resolveBusinessName(req.businessId));

  if (!hospitalName) {
    const error =
      'No business name resolved for this call. Refusing to introduce the caller as an unnamed or placeholder hospital.';
    console.error(`[Voice Call] ❌ ${error}`);
    await recordCall(req, { status: 'failed', error, provider: 'none' });
    return { dispatched: false, provider: 'none', error };
  }

  const callParams = {
    phoneNumber: req.patientPhone,
    patientName: req.patientName,
    doctorName: req.doctorName,
    appointmentTime: req.appointmentTime,
    hospitalName,
    callType: req.callType,
    promptTask: req.promptTask,
  };

  const attempts: string[] = [];

  // Vapi first, then Bland. Both return mode 'simulation' when they are not
  // configured or the API rejected the request — which is a failure, not a call.
  const vapi = await triggerVapiCall(callParams);
  if (vapi.mode === 'live' && vapi.callId) {
    const record = await recordCall(req, { status: 'queued', provider: 'vapi', callId: vapi.callId });
    console.log(`[Voice Call] ✅ Vapi queued call ${vapi.callId} to ${req.patientPhone}.`);
    return { dispatched: true, provider: 'vapi', callId: vapi.callId, record };
  }
  attempts.push(`vapi: ${vapi.error || 'not configured'}`);

  const bland = await triggerBlandCall(callParams);
  if (bland.mode === 'live' && bland.callId) {
    const record = await recordCall(req, { status: 'queued', provider: 'bland', callId: bland.callId });
    console.log(`[Voice Call] ✅ Bland queued call ${bland.callId} to ${req.patientPhone}.`);
    return { dispatched: true, provider: 'bland', callId: bland.callId, record };
  }
  attempts.push(`bland: ${bland.error || 'not configured'}`);

  const error = `No voice provider placed the call (${attempts.join('; ')}).`;
  console.error(`[Voice Call] ❌ ${error}`);
  const record = await recordCall(req, { status: 'failed', error, provider: 'none' });
  return { dispatched: false, provider: 'none', error, record };
}

async function recordCall(
  req: VoiceCallRequest,
  result: { status: 'queued' | 'failed'; provider: string; callId?: string; error?: string }
) {
  try {
    const { data, error } = await supabase
      .from('hospital_voice_calls')
      .insert([
        {
          business_id: req.businessId || null,
          patient_id: req.patientId || null,
          appointment_id: req.appointmentId || null,
          patient_name: req.patientName,
          patient_phone: req.patientPhone,
          call_type: req.callType || 'appointment_reminder',
          status: result.status,
          // Left null on purpose: unknown until the provider reports back.
          outcome: null,
          duration_seconds: null,
          transcript_summary: result.callId
            ? `Call queued with ${result.provider} (id ${result.callId}). Awaiting provider callback for duration and outcome.`
            : `Call not placed. ${result.error || ''}`.trim(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.warn('[Voice Call] Could not log call record:', error.message);
      return null;
    }
    return data;
  } catch (err: any) {
    console.warn('[Voice Call] Could not log call record:', err?.message || err);
    return null;
  }
}
