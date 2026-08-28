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

/**
 * CA firm automation engines.
 *
 * Every engine used to default `firmName` to the literal 'Webcore CA & Advisory'
 * and query its table with no business_id filter. On a database with more than
 * one CA firm that meant firm B's clients received compliance reminders,
 * document chases, and fee-recovery messages signed by firm A. The invoice
 * engine was the worst case: `.from('invoices').select('*').neq('status','Paid')`
 * chased every unpaid invoice in the system.
 *
 * Each engine now runs per firm: scoped by business_id, signed with that firm's
 * own name from the businesses table. Passing a businessId restricts it to one
 * firm; calling with no argument iterates every ca_firm tenant.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface CAEngineResult {
  processed: number;
  remindersSent: number;
  firms?: number;
  details?: Array<{ firm: string; processed: number; remindersSent: number }>;
}

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

interface Firm {
  id: string;
  name: string;
}

/** The CA firms this engine should act for. */
async function resolveFirms(businessId?: string): Promise<Firm[]> {
  if (businessId) {
    const { data } = await supabase.from('businesses').select('id, name').eq('id', businessId).maybeSingle();
    if (!data) {
      console.error(`[CACron] Business ${businessId} not found — nothing to run.`);
      return [];
    }
    return [{ id: data.id, name: data.name }];
  }

  const { data, error } = await supabase.from('businesses').select('id, name').eq('category', 'ca_firm');

  if (error) {
    console.error('[CACron] Could not list CA firms:', error.message);
    return [];
  }
  if (!data || data.length === 0) {
    console.log('[CACron] No businesses with category ca_firm — skipping.');
    return [];
  }
  return data.map((b: any) => ({ id: b.id, name: b.name }));
}

/** Runs one firm-scoped engine across every firm and aggregates the totals. */
async function forEachFirm(
  label: string,
  businessId: string | undefined,
  run: (firm: Firm) => Promise<{ processed: number; remindersSent: number }>
): Promise<CAEngineResult> {
  const firms = await resolveFirms(businessId);
  const details: Array<{ firm: string; processed: number; remindersSent: number }> = [];
  let processed = 0;
  let remindersSent = 0;

  for (const firm of firms) {
    try {
      const result = await run(firm);
      processed += result.processed;
      remindersSent += result.remindersSent;
      details.push({ firm: firm.name, ...result });
    } catch (err: any) {
      console.error(`[CACron] ${label} failed for ${firm.name}:`, err?.message || err);
      details.push({ firm: firm.name, processed: 0, remindersSent: 0 });
    }
  }

  console.log(`[CACron] ${label}: ${firms.length} firm(s), ${processed} scanned, ${remindersSent} sent.`);
  return { processed, remindersSent, firms: firms.length, details };
}

/**
 * Drafts one message. A model outage must not abort the whole scan, so the
 * failure is logged and that record is skipped — getGroqChatCompletion throws
 * rather than returning invented text.
 */
async function draft(prompt: string, temperature: number, context: string): Promise<string | null> {
  try {
    return await getGroqChatCompletion([{ role: 'user', content: prompt }], { temperature });
  } catch (err: any) {
    console.error(`[CACron] Could not draft message for ${context}:`, err?.message || err);
    return null;
  }
}

/** 1. Compliance Deadline Engine (daily 9:00 AM) */
export async function runComplianceEngine(businessId?: string): Promise<CAEngineResult> {
  console.log('[CACron] Running Compliance Deadline Engine...');

  return forEachFirm('Compliance Engine', businessId, async (firm) => {
    let remindersSent = 0;

    const { data: records, error } = await supabase
      .from('ca_compliance_calendar')
      .select('*')
      .eq('business_id', firm.id)
      .neq('status', 'Filed');

    if (error) {
      console.error(`[CACron] Compliance fetch error for ${firm.name}:`, error.message);
      return { processed: 0, remindersSent: 0 };
    }
    if (!records || records.length === 0) return { processed: 0, remindersSent: 0 };

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

      const reminderText = await draft(
        buildCAComplianceReminderPrompt(
          firm.name,
          item.client_name,
          item.compliance_type,
          item.due_date,
          stage,
          daysOverdue
        ),
        0.2,
        `compliance ${item.id}`
      );
      if (!reminderText) continue;

      if (item.phone) {
        const sent = await sendWhatsAppMessage(item.phone, reminderText);
        if (sent?.success === false) {
          console.error(`[CACron] Compliance reminder to ${item.phone} failed: ${sent.error}`);
          continue;
        }
        remindersSent++;
      }

      await supabase
        .from('ca_compliance_calendar')
        .update({
          reminder_count: (item.reminder_count || 0) + 1,
          last_reminder_date: new Date().toISOString(),
          status: days < 0 ? 'Overdue' : item.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      if (daysOverdue > 3) {
        await sendPartnerAlert({
          type: 'compliance_overdue',
          title: '🚨 Client Compliance Overdue > 3 Days',
          details: {
            firm: firm.name,
            client: item.client_name,
            phone: item.phone,
            compliance: item.compliance_type,
            due_date: item.due_date,
            days_overdue: daysOverdue,
          },
        });
      }
    }

    return { processed: records.length, remindersSent };
  });
}

/** 2. Document Chasing Engine (daily 9:30 AM) */
export async function runDocumentChasingEngine(businessId?: string): Promise<CAEngineResult> {
  console.log('[CACron] Running Document Chasing Engine...');

  return forEachFirm('Document Chasing Engine', businessId, async (firm) => {
    let remindersSent = 0;

    const { data: docs, error } = await supabase
      .from('ca_documents_tracker')
      .select('*')
      .eq('business_id', firm.id)
      .eq('status', 'Pending');

    if (error) {
      console.error(`[CACron] Document tracker fetch error for ${firm.name}:`, error.message);
      return { processed: 0, remindersSent: 0 };
    }
    if (!docs || docs.length === 0) return { processed: 0, remindersSent: 0 };

    for (const doc of docs as CADocumentTracker[]) {
      const refDate = doc.last_followup_date || doc.requested_date;
      const gap = getDaysSince(refDate);

      // Follow up every 3+ days
      if (gap === null || gap < 3) continue;

      const nextAttempt = (doc.followup_count || 0) + 1;

      const followupText = await draft(
        buildCADocumentFollowupPrompt(firm.name, doc.client_name, doc.document_name, doc.compliance_type, nextAttempt),
        0.2,
        `document ${doc.id}`
      );
      if (!followupText) continue;

      if (doc.phone) {
        const sent = await sendWhatsAppMessage(doc.phone, followupText);
        if (sent?.success === false) {
          console.error(`[CACron] Document follow-up to ${doc.phone} failed: ${sent.error}`);
          continue;
        }
        remindersSent++;
      }

      await supabase
        .from('ca_documents_tracker')
        .update({
          followup_count: nextAttempt,
          last_followup_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', doc.id);

      if (nextAttempt >= 3) {
        await sendPartnerAlert({
          type: 'doc_escalation',
          title: '📄 Document Pending - Follow-up 3+',
          details: {
            firm: firm.name,
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

    return { processed: docs.length, remindersSent };
  });
}

/** 3. Lead Nurturing Engine (daily 10:00 AM) */
export async function runLeadFollowupEngine(businessId?: string): Promise<CAEngineResult> {
  console.log('[CACron] Running Lead Followup Engine...');
  const todayStr = new Date().toISOString().slice(0, 10);
  const closedStatuses = ['Converted', 'Lost', 'Cold-Closed'];

  return forEachFirm('Lead Followup Engine', businessId, async (firm) => {
    let remindersSent = 0;

    const { data: leads, error } = await supabase
      .from('ca_leads')
      .select('*')
      .eq('business_id', firm.id)
      .not('status', 'in', `(${closedStatuses.map((s) => `"${s}"`).join(',')})`);

    if (error) {
      console.error(`[CACron] Leads fetch error for ${firm.name}:`, error.message);
      return { processed: 0, remindersSent: 0 };
    }
    if (!leads || leads.length === 0) return { processed: 0, remindersSent: 0 };

    for (const lead of leads as CALead[]) {
      if (!lead.followup_date || lead.followup_date > todayStr) continue;

      const attempts = (lead.followup_attempts || 0) + 1;

      if (attempts >= 4) {
        // Auto-close cold lead
        await supabase
          .from('ca_leads')
          .update({ status: 'Cold-Closed', followup_attempts: attempts, updated_at: new Date().toISOString() })
          .eq('id', lead.id);
        continue;
      }

      const checkinText = await draft(
        buildCALeadFollowupPrompt(firm.name, lead.name, lead.requirement || 'CA & Tax Advisory Services', attempts),
        0.3,
        `lead ${lead.id}`
      );
      if (!checkinText) continue;

      if (lead.phone) {
        const sent = await sendWhatsAppMessage(lead.phone, checkinText);
        if (sent?.success === false) {
          console.error(`[CACron] Lead check-in to ${lead.phone} failed: ${sent.error}`);
          continue;
        }
        remindersSent++;
      }

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

    return { processed: leads.length, remindersSent };
  });
}

/** 4. Invoice Fee Recovery Engine (daily 10:30 AM) */
export async function runInvoiceRecoveryEngine(businessId?: string): Promise<CAEngineResult> {
  console.log('[CACron] Running Invoice Fee Recovery Engine...');

  return forEachFirm('Invoice Recovery Engine', businessId, async (firm) => {
    let remindersSent = 0;

    // business_id filter added by migration 20260828000000. Without it this
    // query chased every unpaid invoice belonging to every tenant.
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('business_id', firm.id)
      .neq('status', 'Paid');

    if (error) {
      console.error(`[CACron] Invoices fetch error for ${firm.name}:`, error.message);
      return { processed: 0, remindersSent: 0 };
    }
    if (!invoices || invoices.length === 0) return { processed: 0, remindersSent: 0 };

    for (const inv of invoices as any[]) {
      const days = getDaysDiff(inv.due_date);
      if (days === null) continue;

      // Positive overdueDays means the due date is in the past
      const overdueDays = -days;

      let stage: 'upcoming_3d' | 'due_today' | 'overdue_mild' | 'overdue_moderate' | 'overdue_severe' | null = null;
      if (days === 3) stage = 'upcoming_3d';
      else if (days === 0) stage = 'due_today';
      else if (overdueDays >= 1 && overdueDays <= 7) stage = 'overdue_mild';
      else if (overdueDays >= 8 && overdueDays <= 15) stage = 'overdue_moderate';
      else if (overdueDays > 15) stage = 'overdue_severe';

      if (!stage) continue;

      const reminderText = await draft(
        buildCAInvoiceReminderPrompt(
          firm.name,
          inv.client_name || 'Client',
          inv.id,
          inv.amount || 0,
          inv.currency || 'INR',
          inv.due_date || 'Due on Receipt',
          stage,
          overdueDays > 0 ? overdueDays : 0
        ),
        0.2,
        `invoice ${inv.id}`
      );
      if (!reminderText) continue;

      if (inv.phone) {
        const sent = await sendWhatsAppMessage(inv.phone, reminderText);
        if (sent?.success === false) {
          console.error(`[CACron] Invoice reminder to ${inv.phone} failed: ${sent.error}`);
          continue;
        }
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

      if (overdueDays > 15) {
        await sendPartnerAlert({
          type: 'invoice_overdue',
          title: '💰 Invoice Severely Overdue (>15 Days)',
          details: {
            firm: firm.name,
            client: inv.client_name,
            phone: inv.phone,
            invoice_id: inv.id,
            amount: `${inv.currency || 'INR'} ${inv.amount}`,
            days_overdue: overdueDays,
          },
        });
      }
    }

    return { processed: invoices.length, remindersSent };
  });
}

let caSchedulerStarted = false;

/** Registers all 4 daily CA jobs. Idempotent. */
export function initCACronScheduler(): void {
  if (caSchedulerStarted) {
    console.log('[CACron] Scheduler already running.');
    return;
  }
  caSchedulerStarted = true;

  console.log('[CACron] Initializing CA Firm daily automation schedules...');

  cron.schedule('0 9 * * *', async () => {
    console.log('[Cron 09:00] Compliance Engine...');
    await runComplianceEngine().catch((e) => console.error('[CACron]', e?.message));
  });

  cron.schedule('30 9 * * *', async () => {
    console.log('[Cron 09:30] Document Chasing Engine...');
    await runDocumentChasingEngine().catch((e) => console.error('[CACron]', e?.message));
  });

  cron.schedule('0 10 * * *', async () => {
    console.log('[Cron 10:00] Lead Nurturing Engine...');
    await runLeadFollowupEngine().catch((e) => console.error('[CACron]', e?.message));
  });

  cron.schedule('30 10 * * *', async () => {
    console.log('[Cron 10:30] Fee Recovery Engine...');
    await runInvoiceRecoveryEngine().catch((e) => console.error('[CACron]', e?.message));
  });

  console.log('[CACron] ✅ All 4 daily jobs registered.');
}
