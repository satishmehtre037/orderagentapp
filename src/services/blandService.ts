/**
 * Bland.ai Voice Calling Telephony Service
 * Dispatches real outbound AI phone calls for appointment confirmations and reminders.
 */

export interface BlandCallOptions {
  phoneNumber: string;
  patientName: string;
  doctorName?: string;
  appointmentTime?: string;
  hospitalName?: string;
  callType?: string;
  promptTask?: string;
}

export interface BlandCallResult {
  success: boolean;
  callId?: string;
  error?: string;
  mode: 'live' | 'simulation';
}

export async function triggerBlandCall(options: BlandCallOptions): Promise<BlandCallResult> {
  const apiKey = (process.env.BLAND_API_KEY || process.env.BLAND_AI_API_KEY || '').trim();

  // If no API key, gracefully fallback to simulation mode
  if (!apiKey) {
    console.log('[Bland Service] No BLAND_API_KEY found. Running in simulation mode.');
    return {
      success: true,
      mode: 'simulation',
      callId: `sim_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    };
  }

  // Format clean international phone number (+91XXXXXXXXXX)
  let cleanNumber = options.phoneNumber.replace(/[^\d+]/g, '');
  if (!cleanNumber.startsWith('+')) {
    const digits = cleanNumber.replace(/\D/g, '');
    cleanNumber = digits.length === 10 ? `+91${digits}` : `+${digits}`;
  }

  const hospitalName = options.hospitalName || 'MediCare Hospital';
  const doctorName = options.doctorName || 'Attending Specialist';
  const appointmentTime = options.appointmentTime || 'upcoming scheduled time';

  const task =
    options.promptTask ||
    `You are the official AI Medical Receptionist calling on behalf of ${hospitalName}. 
You are speaking with patient ${options.patientName} regarding their upcoming OPD consultation with Dr. ${doctorName} scheduled for ${appointmentTime}.
1. Greet the patient warmly with "Namaste ${options.patientName}".
2. Remind them of their appointment with Dr. ${doctorName}.
3. Ask if they will be able to attend or if they need to reschedule.
4. If they confirm, thank them and remind them to arrive 10 minutes early.
5. If they request a reschedule, note their preferred day/time and let them know the hospital reception desk will update their slot and message them on WhatsApp.
Keep the conversation brief, empathetic, polite, and professional.`;

  const firstSentence = `Namaste ${options.patientName}, this is the AI assistant calling from ${hospitalName} regarding your upcoming appointment with Dr. ${doctorName}.`;

  try {
    console.log(`[Bland Service] 📞 Initiating live AI phone call to ${cleanNumber} (${options.patientName})...`);

    const res = await fetch('https://api.bland.ai/v1/calls', {
      method: 'POST',
      headers: {
        authorization: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone_number: cleanNumber,
        task,
        first_sentence: firstSentence,
        voice: 'maya',
        record: true,
        answered_by_enabled: true,
        wait_for_greeting: true,
        max_duration: 3, // 3 minutes max
      }),
    });

    const data = await res.json();
    console.log('[Bland Service] Response:', data);

    if (data.status === 'success' || data.call_id) {
      return {
        success: true,
        callId: data.call_id,
        mode: 'live',
      };
    } else {
      console.warn('[Bland Service] Live call rejected, falling back to simulated completion:', data.message || data.error);
      return {
        success: true,
        callId: `sim_fallback_${Date.now()}`,
        mode: 'simulation',
        error: data.message || data.error,
      };
    }
  } catch (err: any) {
    console.error('[Bland Service Exception]:', err.message || err);
    return {
      success: true,
      callId: `sim_err_${Date.now()}`,
      mode: 'simulation',
      error: err.message,
    };
  }
}
