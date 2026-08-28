import cron from 'node-cron';
import { supabase } from '../config/supabase';
import { sendMessage } from './whatsappService';
import { ENV } from '../config/env';
import { dispatchVoiceCall, resolveBusinessName } from './voiceCallService';

/**
 * Hospital automation engines.
 *
 * These three scanners were fully written but never scheduled — `src/server.ts`
 * only called initCACronScheduler(), so no reminder, feedback request, or
 * no-show follow-up had ever fired in production. initHospitalCronScheduler()
 * at the bottom of this file registers them, and server.ts now calls it.
 *
 * Imports are relative (not `@/`) so the file loads under `tsx src/server.ts`
 * as well as inside Next.
 */

export interface HospitalCronJobResult {
  job: string;
  processed: number;
  success: boolean;
  timestamp: string;
  details?: Record<string, any>;
}

async function send(phone: string, message: string): Promise<boolean> {
  const result = await sendMessage(phone, ENV.WHATSAPP_BUSINESS_NUMBER, message);
  if (!result.success) {
    console.error(`[Hospital Cron] WhatsApp send to ${phone} failed: ${result.error}`);
  }
  return result.success;
}

/** Caches business names for the duration of one scan. */
function nameResolver() {
  const cache = new Map<string, string | null>();
  return async (businessId?: string | null): Promise<string | null> => {
    if (!businessId) return null;
    if (!cache.has(businessId)) cache.set(businessId, await resolveBusinessName(businessId));
    return cache.get(businessId) ?? null;
  };
}

/**
 * 1. Appointment Reminder Scanner (every 15 minutes)
 * Sends WhatsApp reminders in the 23–25h and 1–3h windows before a slot.
 */
export async function runHospitalAppointmentReminderScanner(businessId?: string): Promise<HospitalCronJobResult> {
  const now = new Date();
  const next26Hours = new Date(now.getTime() + 26 * 60 * 60 * 1000);
  const resolveName = nameResolver();

  let query = supabase
    .from('hospital_appointments')
    .select('*')
    .eq('status', 'confirmed')
    .gte('slot_time', now.toISOString())
    .lte('slot_time', next26Hours.toISOString());

  if (businessId) query = query.eq('business_id', businessId);

  const { data: appointments, error } = await query;
  if (error || !appointments) {
    console.error('[Hospital Cron] Error fetching appointments for reminders:', error?.message);
    return {
      job: 'appointment_reminders',
      processed: 0,
      success: false,
      timestamp: new Date().toISOString(),
      details: { error: error?.message },
    };
  }

  let sent24h = 0;
  let sent2h = 0;

  for (const appt of appointments) {
    const slotTime = new Date(appt.slot_time).getTime();
    const hoursDiff = (slotTime - now.getTime()) / (1000 * 60 * 60);
    const hospitalName = (await resolveName(appt.business_id)) || 'your hospital';

    const formattedTime = new Date(appt.slot_time).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    // Only state a token number and location if the record actually has them.
    const tokenLine = appt.token_number ? `\n🎟️ *Token Number:* #${appt.token_number}` : '';
    const locationLine = appt.location ? `\n📍 *Location:* ${appt.location}` : '';

    // 24-hour window (23h–25h)
    if (hoursDiff <= 25 && hoursDiff >= 23 && !appt.reminder_24h_sent) {
      const msg =
        `🏥 *Appointment Reminder (Tomorrow)*\n\n` +
        `Namaste ${appt.patient_name || 'Patient'} ji,\n\n` +
        `This is a reminder for your upcoming consultation at *${hospitalName}*:\n` +
        `👨‍⚕️ *Doctor:* ${appt.doctor_name || 'Specialist'} (${appt.department || 'General'})\n` +
        `⏰ *Slot Time:* ${formattedTime}` +
        tokenLine +
        locationLine +
        `\n\nReply *1* to Confirm, *2* to Reschedule, or *3* to Cancel.`;

      if (appt.patient_phone && (await send(appt.patient_phone, msg))) {
        await supabase.from('hospital_appointments').update({ reminder_24h_sent: true }).eq('id', appt.id);
        sent24h++;
      }
    }

    // 2-hour window (1h–3h)
    if (hoursDiff <= 3 && hoursDiff >= 1 && !appt.reminder_2h_sent) {
      const msg =
        `⚡ *Appointment in about 2 hours*\n\n` +
        `Namaste ${appt.patient_name || 'Patient'} ji,\n\n` +
        `Your consultation with *${appt.doctor_name || 'the doctor'}* at *${hospitalName}* is scheduled for *${formattedTime}*.\n\n` +
        `Please arrive 15 minutes early for token verification.\n\n` +
        `Reply *CALL* if you need assistance from the front desk.`;

      if (appt.patient_phone && (await send(appt.patient_phone, msg))) {
        await supabase.from('hospital_appointments').update({ reminder_2h_sent: true }).eq('id', appt.id);
        sent2h++;
      }
    }
  }

  return {
    job: 'appointment_reminders',
    processed: sent24h + sent2h,
    success: true,
    timestamp: new Date().toISOString(),
    details: { sent24h, sent2h, totalScanned: appointments.length },
  };
}

/**
 * 2. Post-Visit Feedback Scanner (hourly)
 * Requests a 1–5 rating from patients whose visit completed recently.
 */
export async function runHospitalFeedbackScanner(businessId?: string): Promise<HospitalCronJobResult> {
  const resolveName = nameResolver();
  // Bounded window: the previous version re-scanned every completed appointment
  // in the table on every run, forever.
  const since = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

  let query = supabase
    .from('hospital_appointments')
    .select('*, hospital_patients(name, phone)')
    .eq('status', 'completed')
    .gte('slot_time', since);

  if (businessId) query = query.eq('business_id', businessId);

  const { data: completedAppts, error } = await query;
  if (error || !completedAppts) {
    console.error('[Hospital Cron] Feedback scanner query failed:', error?.message);
    return {
      job: 'feedback_scanner',
      processed: 0,
      success: false,
      timestamp: new Date().toISOString(),
      details: { error: error?.message },
    };
  }

  let requested = 0;

  for (const appt of completedAppts) {
    // maybeSingle, not single: `single()` errors with PGRST116 when no feedback
    // row exists yet, which is the normal case this branch is looking for.
    const { data: existing } = await supabase
      .from('hospital_feedback')
      .select('id')
      .eq('appointment_id', appt.id)
      .maybeSingle();

    if (existing) continue;

    const phone = appt.patient_phone || appt.hospital_patients?.phone;
    const name = appt.patient_name || appt.hospital_patients?.name || 'Patient';
    if (!phone) continue;

    const hospitalName = (await resolveName(appt.business_id)) || 'our hospital';

    const msg =
      `🙏 *How was your visit?*\n\n` +
      `Namaste ${name} ji,\n\n` +
      `Thank you for visiting *${hospitalName}* for your consultation with *${appt.doctor_name || 'our specialist'}*.\n\n` +
      `Please rate your experience from *1 to 5* by replying with a number:\n\n` +
      `⭐ *5* - Excellent\n⭐ *4* - Good\n⭐ *3* - Average\n⭐ *2* - Poor\n⭐ *1* - Very Bad\n\n` +
      `Your feedback helps us improve.`;

    if (!(await send(phone, msg))) continue;

    // The placeholder row is written only after the request actually went out.
    await supabase.from('hospital_feedback').insert([
      {
        business_id: appt.business_id,
        patient_id: appt.patient_id,
        appointment_id: appt.id,
        patient_name: name,
        patient_phone: phone,
        doctor_name: appt.doctor_name,
        status: 'pending',
        requested_at: new Date().toISOString(),
      },
    ]);

    requested++;
  }

  return {
    job: 'feedback_scanner',
    processed: requested,
    success: true,
    timestamp: new Date().toISOString(),
    details: { scanned: completedAppts.length },
  };
}

/**
 * 3. Missed Appointment Follow-up Engine
 * WhatsApps the patient, then places a real AI voice call through Vapi/Bland.
 */
export async function runHospitalMissedFollowupScanner(businessId?: string): Promise<HospitalCronJobResult> {
  const resolveName = nameResolver();
  const since = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

  let query = supabase
    .from('hospital_appointments')
    .select('*')
    .eq('status', 'missed')
    .gte('slot_time', since);

  if (businessId) query = query.eq('business_id', businessId);

  const { data: missed, error } = await query;
  if (error || !missed) {
    console.error('[Hospital Cron] Missed follow-up query failed:', error?.message);
    return {
      job: 'missed_followup',
      processed: 0,
      success: false,
      timestamp: new Date().toISOString(),
      details: { error: error?.message },
    };
  }

  let followupsSent = 0;
  let callsQueued = 0;

  for (const appt of missed) {
    if (!appt.patient_phone) continue;

    // Don't re-follow-up the same appointment on every hourly run.
    const { data: alreadyCalled } = await supabase
      .from('hospital_voice_calls')
      .select('id')
      .eq('appointment_id', appt.id)
      .eq('call_type', 'missed_followup')
      .limit(1);

    if (alreadyCalled && alreadyCalled.length > 0) continue;

    const hospitalName = (await resolveName(appt.business_id)) || 'the hospital';

    const msg =
      `⚠️ *We missed you today*\n\n` +
      `Namaste ${appt.patient_name || 'Patient'} ji,\n\n` +
      `We noticed you were unable to attend your scheduled consultation with *${appt.doctor_name || 'the doctor'}* at *${hospitalName}* today.\n\n` +
      `Your health is our priority. Would you like to reschedule?\n\n` +
      `Reply with your preferred date/time, or reply *CALL* to speak with our reception staff.`;

    if (!(await send(appt.patient_phone, msg))) continue;
    followupsSent++;

    // A real call attempt through a real provider. The old code inserted a
    // fabricated 52-second "completed" call with an invented transcript here.
    const call = await dispatchVoiceCall({
      businessId: appt.business_id,
      patientId: appt.patient_id,
      appointmentId: appt.id,
      patientName: appt.patient_name || 'Patient',
      patientPhone: appt.patient_phone,
      doctorName: appt.doctor_name,
      hospitalName,
      callType: 'missed_followup',
      promptTask:
        `You are the AI receptionist for ${hospitalName}. ${appt.patient_name || 'The patient'} missed their ` +
        `appointment with Dr. ${appt.doctor_name || 'the doctor'}. Ask politely whether they would like to ` +
        `reschedule, note their preferred day and time, and tell them reception will confirm on WhatsApp. ` +
        `Do not give medical advice. Keep it under two minutes.`,
    });

    if (call.dispatched) callsQueued++;
  }

  return {
    job: 'missed_followup',
    processed: followupsSent,
    success: true,
    timestamp: new Date().toISOString(),
    details: { whatsappSent: followupsSent, voiceCallsQueued: callsQueued, scanned: missed.length },
  };
}

/**
 * 4. Critical Lab Report Dispatcher
 * Sends the report link and tells the patient who to contact — using the
 * hospital's own configured number, not a placeholder.
 */
export async function triggerCriticalReportAlert(reportId: string): Promise<boolean> {
  const { data: report } = await supabase.from('hospital_reports').select('*').eq('id', reportId).maybeSingle();
  if (!report) {
    console.error(`[Hospital Cron] Report ${reportId} not found.`);
    return false;
  }

  const hospitalName = (await resolveBusinessName(report.business_id)) || 'the hospital';

  // Reception number comes from business_config; we do not invent one.
  let receptionNumber: string | null = null;
  if (report.business_id) {
    const { data: configRows } = await supabase
      .from('business_config')
      .select('config_key, config_value')
      .eq('business_id', report.business_id)
      .in('config_key', ['reception_number', 'emergency_contact', 'phone', 'contact_number']);

    const configMap: Record<string, any> = {};
    (configRows || []).forEach((row: any) => {
      configMap[row.config_key] = row.config_value;
    });
    receptionNumber =
      configMap.reception_number || configMap.emergency_contact || configMap.phone || configMap.contact_number || null;
  }

  const downloadLine = report.file_url ? `\n\n📄 *Download Report:* ${report.file_url}` : '';
  const contactLine = receptionNumber
    ? `\n\nPlease call our reception immediately at ${receptionNumber}.`
    : `\n\nPlease contact the hospital reception immediately.`;

  const msg =
    `🚨 *Urgent: Diagnostic Report Ready*\n\n` +
    `Namaste ${report.patient_name || 'Patient'} ji,\n\n` +
    `Your *${report.report_type}* report has been published by the laboratory at *${hospitalName}*.\n\n` +
    `⚠️ *Clinical Note:* Some parameters need prompt medical evaluation by *${
      report.doctor_name || 'your attending physician'
    }*.` +
    downloadLine +
    contactLine;

  if (!report.patient_phone) {
    console.error(`[Hospital Cron] Report ${reportId} has no patient phone — alert not sent.`);
    return false;
  }

  if (!(await send(report.patient_phone, msg))) return false;

  await supabase
    .from('hospital_reports')
    .update({ delivered_via_wa: true, delivered_at: new Date().toISOString(), status: 'Delivered' })
    .eq('id', reportId);

  return true;
}

let hospitalSchedulerStarted = false;

/**
 * Registers the hospital automation schedule. Idempotent — calling it twice
 * does not double-register the jobs.
 */
export function initHospitalCronScheduler() {
  if (hospitalSchedulerStarted) {
    console.log('[Hospital Cron] Scheduler already running.');
    return;
  }
  hospitalSchedulerStarted = true;

  // Every 15 minutes: appointment reminders (needs this granularity to land
  // inside the 23–25h and 1–3h windows).
  cron.schedule('*/15 * * * *', async () => {
    try {
      const result = await runHospitalAppointmentReminderScanner();
      if (result.processed > 0) console.log('[Hospital Cron] Reminders:', result.details);
    } catch (err: any) {
      console.error('[Hospital Cron] Reminder scanner failed:', err?.message || err);
    }
  });

  // Hourly at :20 — feedback requests.
  cron.schedule('20 * * * *', async () => {
    try {
      const result = await runHospitalFeedbackScanner();
      if (result.processed > 0) console.log(`[Hospital Cron] Feedback requested for ${result.processed} visits.`);
    } catch (err: any) {
      console.error('[Hospital Cron] Feedback scanner failed:', err?.message || err);
    }
  });

  // Hourly at :40 — missed-appointment follow-ups.
  cron.schedule('40 * * * *', async () => {
    try {
      const result = await runHospitalMissedFollowupScanner();
      if (result.processed > 0) console.log('[Hospital Cron] Missed follow-ups:', result.details);
    } catch (err: any) {
      console.error('[Hospital Cron] Missed follow-up scanner failed:', err?.message || err);
    }
  });

  console.log('[Hospital Cron] ✅ Scheduled: reminders */15min, feedback hourly :20, missed follow-ups hourly :40.');
}
