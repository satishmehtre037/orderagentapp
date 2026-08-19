/**
 * Vapi.ai Voice Calling Telephony Service
 * Dispatches live outbound AI phone calls using Vapi.ai API
 */

export interface VapiCallOptions {
  phoneNumber: string;
  patientName: string;
  doctorName?: string;
  appointmentTime?: string;
  hospitalName?: string;
  callType?: string;
  promptTask?: string;
}

export interface VapiCallResult {
  success: boolean;
  callId?: string;
  error?: string;
  mode: "live" | "simulation";
}

export async function triggerVapiCall(
  options: VapiCallOptions,
): Promise<VapiCallResult> {
  const apiKey = (
    process.env.VAPI_API_KEY ||
    process.env.VAPI_PRIVATE_API_KEY ||
    process.env.VAPI_KEY ||
    ""
  ).trim();

  // If no API key, gracefully fallback to simulation mode
  if (!apiKey) {
    console.log(
      "[Vapi Service] No VAPI_API_KEY found. Running in simulation mode.",
    );
    return {
      success: true,
      mode: "simulation",
      callId: `sim_vapi_${Date.now()}`,
    };
  }

  // Format clean international phone number (+91XXXXXXXXXX)
  let cleanNumber = options.phoneNumber.replace(/[^\d+]/g, "");
  if (!cleanNumber.startsWith("+")) {
    const digits = cleanNumber.replace(/\D/g, "");
    cleanNumber = digits.length === 10 ? `+91${digits}` : `+${digits}`;
  }

  const hospitalName = options.hospitalName || "MediCare Hospital";
  const doctorName = options.doctorName || "Attending Specialist";
  const appointmentTime = options.appointmentTime || "upcoming scheduled time";

  const systemPrompt =
    options.promptTask ||
    `You are the official AI Medical Receptionist calling on behalf of ${hospitalName}. 
You are speaking with patient ${options.patientName} regarding their upcoming OPD consultation with Dr. ${doctorName} scheduled for ${appointmentTime}.
1. Greet the patient warmly with "Namaste ${options.patientName}".
2. Remind them of their appointment with Dr. ${doctorName} at ${appointmentTime}.
3. Ask if they will be able to attend or if they need to reschedule.
4. If they confirm, thank them and remind them to arrive 10 minutes early.
5. If they request a reschedule, note their preferred day/time and let them know the hospital reception desk will update their slot and message them on WhatsApp.
Keep the conversation brief, empathetic, polite, and professional.`;

  const firstMessage = `Namaste ${options.patientName}, this is the AI assistant calling from ${hospitalName} regarding your upcoming appointment with Dr. ${doctorName}. Can you confirm your attendance?`;

  const assistantId = process.env.VAPI_ASSISTANT_ID;
  const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;

  try {
    console.log(
      `[Vapi Service] 📞 Initiating live AI phone call to ${cleanNumber} (${options.patientName})...`,
    );

    const payload: Record<string, any> = {
      customer: {
        number: cleanNumber,
        name: options.patientName,
      },
    };

    if (phoneNumberId) {
      payload.phoneNumberId = phoneNumberId;
    }

    if (assistantId) {
      payload.assistantId = assistantId;
      payload.assistantOverrides = {
        firstMessage,
        variableValues: {
          patientName: options.patientName,
          doctorName,
          appointmentTime,
          hospitalName,
        },
      };
    } else {
      payload.assistant = {
        firstMessage,
        model: {
          provider: "openai",
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
          ],
        },
        voice: {
          provider: "11labs",
          voiceId: "21m00Tcm4TlvDq8ikWAM",
        },
      };
    }

    const res = await fetch("https://api.vapi.ai/call/phone", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log("[Vapi Service] Response:", data);

    if (data.id || data.status === "queued" || data.status === "in-progress") {
      return {
        success: true,
        callId: data.id,
        mode: "live",
      };
    } else {
      console.warn(
        "[Vapi Service] Live call dispatch rejected, falling back to simulated log:",
        data.message || data.error,
      );
      return {
        success: true,
        callId: `sim_vapi_${Date.now()}`,
        mode: "simulation",
        error:
          data.message ||
          (Array.isArray(data.message)
            ? data.message.join(", ")
            : data.error) ||
          "Call could not be queued",
      };
    }
  } catch (err: any) {
    console.error("[Vapi Service Exception]:", err.message || err);
    return {
      success: true,
      callId: `sim_vapi_err_${Date.now()}`,
      mode: "simulation",
      error: err.message,
    };
  }
}
