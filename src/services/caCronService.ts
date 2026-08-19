import cron from 'node-cron';
import { supabase } from '../config/supabase';
import { getGroqChatCompletion } from './groqService';
import { sendWhatsAppMessage } from './whatsappService';
import { sendPartnerAlert } from './partnerAlertService';
import {
  buildCAComplianceReminderPrompt,
  buildCADocumentFollowupPrompt,
  buildCALeadFollowupPrompt,
  buildCAInvoiceReminderPrompt,
} from './promptBuilder';
import type { CAComplianceRecord, CADocumentTracker, CALead } from '../types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function getDaysDiff(targetDateStr: string): number | null {
  if (!targetDateStr) return null;
  const todayStr = new Date().toISOString().slice(0, 10);
  const today = new Date(todayStr + 'T00:00:00Z');
  const target = new Date(String(targetDateStr).slice(0, 10) + 'T00:00:00Z');
  if (isNaN(target.getTime())) return null;
  return Math.round((target.getTime() - today.getTime()) / MS_PER_DAY);
}

function getDaysSince(dateStr?: string): number | null {
  if (!dateStr) return null;
  const now = new Date();
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return Math.floor((now.getTime() - d.getTime()) / MS_PER_DAY);
}

/**
 * 1. Compliance Deadline Engine (Daily 9:00 AM)
 */
export async function runComplianceEngine(firmName = 'Webcore CA & Advisory'): Promise<{ processed: number; remindersSent: number }> {
  console.log('[CACron] Running Compliance Deadline Engine...');
  let remindersSent = 0;

  try {
    const { data: records, error } = await supabase
      .from('ca_compliance_calendar')
      .select('*')
      .neq('status', 'Filed');

    if (error || !records) {
      console.warn('[CACron] Compliance fetch error:', error?.message);
      return { processed: 0, remindersSent: 0 };
    }

    for (const item of records as CAComplianceRecord[]) {
      const days = getDaysDiff(item.due_date);
      if (days === null) continue;

      let stage: 'friendly_7d' | 'reminder_3d' | 'urgent_1d' | 'due_today' | 'overdue' | null = null;
      if (days === 7) stage = 'friendly_7d';
      else if (days === 3) stage = 'reminder_3d';
      else if (days === 1) stage = 'urgent_1d';
      else if (days === 0) stage = 'due_today';
      else if (days < 0) stage = 'overdue';

      if (!stage) continue;

      const daysOverdue = days < 0 ? Math.abs(days) : 0;

      // Draft reminder message
      const prompt = buildCAComplianceReminderPrompt(
        firmName,
        item.client_name,
        item.compliance_type,
        item.due_date,
        stage,
        daysOverdue
      );

      const reminderText = await getGroqChatCompletion([{ role: 'user', content: prompt }], { temperature: 0.2 });

      // Send via WhatsApp
      if (item.phone) {
        await sendWhatsAppMessage(item.phone, reminderText);
        remindersSent++;
      }

      // Update record
      await supabase
        .from('ca_compliance_calendar')
        .update({
          reminder_count: (item.reminder_count || 0) + 1,
          last_reminder_date: new Date().toISOString(),
          status: days < 0 ? 'Overdue' : item.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      // Overdue > 3 days -> Alert Partner
      if (daysOverdue > 3) {
        await sendPartnerAlert({
          type: 'compliance_overdue',
          title: '🚨 Client Compliance Overdue > 3 Days',
          details: {
            client: item.client_name,
            phone: item.phone,
            compliance: item.compliance_type,
            due_date: item.due_date,
            days_overdue: daysOverdue,
          },
        });
      }
    }

    console.log(`[CACron] Compliance Engine completed: ${records.length} scanned, ${remindersSent} reminders sent.`);
    return { processed: records.length, remindersSent };
  } catch (err: any) {
    console.error('[CACron] Compliance Engine error:', err.message);
    return { processed: 0, remindersSent };
  }
}

/**
 * 2. Document Chasing Engine (Daily 9:30 AM)
 */
export async function runDocumentChasingEngine(firmName = 'Webcore CA & Advisory'): Promise<{ processed: number; remindersSent: number }> {
  console.log('[CACron] Running Document Chasing Engine...');
  let remindersSent = 0;

  try {
    const { data: docs, error } = await supabase
      .from('ca_documents_tracker')
      .select('*')
      .eq('status', 'Pending');

    if (error || !docs) {
      console.warn('[CACron] Document tracker fetch error:', error?.message);
      return { processed: 0, remindersSent: 0 };
    }

    for (const doc of docs as CADocumentTracker[]) {
      const refDate = doc.last_followup_date || doc.requested_date;
      const gap = getDaysSince(refDate);

      // Follow up every 3+ days
      if (gap === null || gap < 3) continue;

      const nextAttempt = (doc.followup_count || 0) + 1;

      // Draft followup message
      const prompt = buildCADocumentFollowupPrompt(
        firmName,
        doc.client_name,
        doc.document_name,
        doc.compliance_type,
        nextAttempt
      );

      const followupText = await getGroqChatCompletion([{ role: 'user', content: prompt }], { temperature: 0.2 });

      if (doc.phone) {
        await sendWhatsAppMessage(doc.phone, followupText);
        remindersSent++;
      }

      // Update doc tracker
      await supabase
        .from('ca_documents_tracker')
        .update({
          followup_count: nextAttempt,
          last_followup_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', doc.id);

      // If attempt >= 3 -> Escalate to Partner
      if (nextAttempt >= 3) {
        await sendPartnerAlert({
          type: 'doc_escalation',
          title: '📄 Document Pending - Follow-up 3+',
          details: {
            client: doc.client_name,
            phone: doc.phone,
            document: doc.document_name,
            compliance: doc.compliance_type,
            followups_sent: nextAttempt,
            recommendation: 'Direct partner call recommended',
          },
        });
      }
    }

    console.log(`[CACron] Document Chasing Engine completed: ${docs.length} scanned, ${remindersSent} sent.`);
    return { processed: docs.length, remindersSent };
  } catch (err: any) {
    console.error('[CACron] Document Chasing Engine error:', err.message);
    return { processed: 0, remindersSent };
  }
}

/**
 * 3. Lead Nurturing Engine (Daily 10:00 AM)
 */
export async function runLeadFollowupEngine(firmName = 'Webcore CA & Advisory'): Promise<{ processed: number; remindersSent: number }> {
  console.log('[CACron] Running Lead Followup Engine...');
  const todayStr = new Date().toISOString().slice(0, 10);
  const closedStatuses = ['Converted', 'Lost', 'Cold-Closed'];
  let remindersSent = 0;

  try {
    const { data: leads, error } = await supabase
      .from('ca_leads')
      .select('*')
      .not('status', 'in', `(${closedStatuses.map((s) => `"${s}"`).join(',')})`);

    if (error || !leads) {
      console.warn('[CACron] Leads fetch error:', error?.message);
      return { processed: 0, remindersSent: 0 };
    }

    for (const lead of leads as CALead[]) {
      if (!lead.followup_date || lead.followup_date > todayStr) continue;

      const attempts = (lead.followup_attempts || 0) + 1;
      const maxReached = attempts >= 4;

      if (maxReached) {
        // Auto-close cold lead
        await supabase
          .from('ca_leads')
          .update({
            status: 'Cold-Closed',
            followup_attempts: attempts,
            updated_at: new Date().toISOString(),
          })
          .eq('id', lead.id);
        continue;
      }

      // Draft conversational check-in
      const prompt = buildCALeadFollowupPrompt(
        firmName,
        lead.name,
        lead.requirement || 'CA & Tax Advisory Services',
        attempts
      );

      const checkinText = await getGroqChatCompletion([{ role: 'user', content: prompt }], { temperature: 0.3 });

      if (lead.phone) {
        await sendWhatsAppMessage(lead.phone, checkinText);
        remindersSent++;
      }

      // Schedule next follow-up in 3 days
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 3);

      await supabase
        .from('ca_leads')
        .update({
          followup_attempts: attempts,
          followup_date: nextDate.toISOString().slice(0, 10),
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead.id);
    }

    console.log(`[CACron] Lead Followup Engine completed: ${leads.length} scanned, ${remindersSent} sent.`);
    return { processed: leads.length, remindersSent };
  } catch (err: any) {
    console.error('[CACron] Lead Followup Engine error:', err.message);
    return { processed: 0, remindersSent };
  }
}

/**
 * 4. Invoice Fee Recovery Engine (Daily 10:30 AM)
 */
export async function runInvoiceRecoveryEngine(firmName = 'Webcore CA & Advisory'): Promise<{ processed: number; remindersSent: number }> {
  console.log('[CACron] Running Invoice Fee Recovery Engine...');
  let remindersSent = 0;

  try {
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .neq('status', 'Paid');

    if (error || !invoices) {
      console.warn('[CACron] Invoices fetch error:', error?.message);
      return { processed: 0, remindersSent: 0 };
    }

    for (const inv of invoices as any[]) {
      const days = getDaysDiff(inv.due_date);
      if (days === null) continue;

      // Positive overdueDays means target date was in the past
      const overdueDays = -days;

      let stage: 'upcoming_3d' | 'due_today' | 'overdue_mild' | 'overdue_moderate' | 'overdue_severe' | null = null;
      if (days === 3) stage = 'upcoming_3d';
      else if (days === 0) stage = 'due_today';
      else if (overdueDays >= 1 && overdueDays <= 7) stage = 'overdue_mild';
      else if (overdueDays >= 8 && overdueDays <= 15) stage = 'overdue_moderate';
      else if (overdueDays > 15) stage = 'overdue_severe';

      if (!stage) continue;

      const prompt = buildCAInvoiceReminderPrompt(
        firmName,
        inv.client_name || 'Client',
        inv.id,
        inv.amount || 0,
        inv.currency || 'INR',
        inv.due_date || 'Due on Receipt',
        stage,
        overdueDays > 0 ? overdueDays : 0
      );

      const reminderText = await getGroqChatCompletion([{ role: 'user', content: prompt }], { temperature: 0.2 });

      if (inv.phone) {
        await sendWhatsAppMessage(inv.phone, reminderText);
        remindersSent++;
      }

      await supabase
        .from('invoices')
        .update({
          reminder_count: (inv.reminder_count || 0) + 1,
          last_reminder_date: new Date().toISOString(),
          status: overdueDays > 0 ? 'Overdue' : inv.status,
          escalated: overdueDays > 15 ? 'Yes' : inv.escalated,
          updated_at: new Date().toISOString(),
        })
        .eq('id', inv.id);

      // Overdue > 15 days -> Alert Partner
      if (overdueDays > 15) {
        await sendPartnerAlert({
          type: 'invoice_overdue',
          title: '💰 Invoice Severely Overdue (>15 Days)',
          details: {
            client: inv.client_name,
            phone: inv.phone,
            invoice_id: inv.id,
            amount: `${inv.currency || 'INR'} ${inv.amount}`,
            days_overdue: overdueDays,
          },
        });
      }
    }

    console.log(`[CACron] Invoice Recovery Engine completed: ${invoices.length} scanned, ${remindersSent} sent.`);
    return { processed: invoices.length, remindersSent };
  } catch (err: any) {
    console.error('[CACron] Invoice Recovery Engine error:', err.message);
    return { processed: 0, remindersSent };
  }
}

/**
 * Initializes all 4 automated cron jobs on server boot
 */
export function initCACronScheduler(): void {
  console.log('[CACron] Initializing CA Firm 4-Daily Automated Cron Schedules...');

  // 1. Daily 9:00 AM — Compliance Check
  cron.schedule('0 9 * * *', async () => {
    console.log('[Cron 09:00 AM] Triggering Compliance Engine...');
    await runComplianceEngine();
  });

  // 2. Daily 9:30 AM — Document Followup
  cron.schedule('30 9 * * *', async () => {
    console.log('[Cron 09:30 AM] Triggering Document Chasing Engine...');
    await runDocumentChasingEngine();
  });

  // 3. Daily 10:00 AM — Lead Followup
  cron.schedule('0 10 * * *', async () => {
    console.log('[Cron 10:00 AM] Triggering Lead Nurturing Engine...');
    await runLeadFollowupEngine();
  });

  // 4. Daily 10:30 AM — Invoice Fee Recovery
  cron.schedule('30 10 * * *', async () => {
    console.log('[Cron 10:30 AM] Triggering Fee Recovery Engine...');
    await runInvoiceRecoveryEngine();
  });

  console.log('[CACron] All 4 daily automated jobs registered successfully.');
}
