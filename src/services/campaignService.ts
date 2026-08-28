import { supabase } from '../config/supabase';
import { ENV } from '../config/env';
import { sendInteractiveButtonsMessage } from './whatsappService';
import { resolveOperatorBusinessId } from './businessService';
import { checkOutreachAllowed, normalizeIndianPhone } from './optOutService';
import {
  buildPersonalizedPitch,
  renderCustomMessage,
  PITCH_BUTTONS,
  type PitchType,
} from './pitchTemplates';

/**
 * Campaign queue — database backed.
 *
 * The previous implementation kept the whole campaign in module memory: a
 * `queue` array, a `currentIndex`, and a `for` loop that counted down 35 seconds
 * between sends with `setTimeout`. On Vercel that loop was killed when the
 * serverless function returned, and on any restart or redeploy the campaign
 * vanished mid-run with no record of who had already been contacted. Two Node
 * instances behind a load balancer each had their own private copy of "the"
 * campaign, so pause/resume hit whichever instance the request landed on.
 *
 * State now lives in `campaigns` + `campaign_targets`. Pacing is a timestamp
 * (`next_send_at`) rather than a countdown, so a cold start resumes exactly
 * where it left off without double-sending and without losing the delay.
 * `tickCampaign()` sends at most one message per call and is safe to invoke
 * from several workers at once — it claims the slot with a compare-and-swap on
 * `next_send_at` before sending.
 */

export interface CampaignLead {
  id?: string;
  business_name: string;
  phone_number: string;
  category?: string;
  city?: string;
  status?: string;
  [key: string]: any;
}

export interface CampaignLog {
  time: string;
  text: string;
  type: 'info' | 'success' | 'warn';
}

export interface CampaignState {
  id: string;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'cancelled';
  currentIndex: number;
  total: number;
  delaySeconds: number;
  countdown: number;
  currentLead: CampaignLead | null;
  pitchType: string;
  senderName: string;
  startedAt: string | null;
  finishedAt: string | null;
  logs: CampaignLog[];
  sent?: number;
  failed?: number;
  skipped?: number;
}

const IDLE_STATE: CampaignState = {
  id: '',
  status: 'idle',
  currentIndex: 0,
  total: 0,
  delaySeconds: 35,
  countdown: 0,
  currentLead: null,
  pitchType: 'all_in_one',
  senderName: '',
  startedAt: null,
  finishedAt: null,
  logs: [],
};

const MAX_LOGS = 70;
const DEFAULT_SENDER = 'WebCore Studios';

function nowIso(): string {
  return new Date().toISOString();
}

function logEntry(text: string, type: CampaignLog['type'] = 'info'): CampaignLog {
  return {
    time: new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    text,
    type,
  };
}

/** Appends to the campaign's log ring buffer, newest first. */
async function appendLog(campaignId: string, text: string, type: CampaignLog['type'] = 'info') {
  try {
    const { data } = await supabase.from('campaigns').select('logs').eq('id', campaignId).maybeSingle();
    const existing: CampaignLog[] = Array.isArray(data?.logs) ? data!.logs : [];
    const logs = [logEntry(text, type), ...existing].slice(0, MAX_LOGS);
    await supabase.from('campaigns').update({ logs }).eq('id', campaignId);
  } catch (err: any) {
    console.warn('[Campaign] Could not persist log:', err?.message || err);
  }
}

/** The campaign the dashboard should be looking at: the live one, else the most recent. */
async function loadCurrentCampaign(): Promise<any | null> {
  const { data: active, error: activeErr } = await supabase
    .from('campaigns')
    .select('*')
    .in('status', ['running', 'paused'])
    .order('created_at', { ascending: false })
    .limit(1);

  if (activeErr) {
    console.error('[Campaign] Failed to read active campaign:', activeErr.message);
    return null;
  }
  if (active && active.length > 0) return active[0];

  const { data: recent } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  return recent && recent.length > 0 ? recent[0] : null;
}

async function targetCounts(campaignId: string): Promise<{ sent: number; failed: number; skipped: number; pending: number }> {
  const { data } = await supabase.from('campaign_targets').select('status').eq('campaign_id', campaignId);
  const rows = data || [];
  return {
    sent: rows.filter((r: any) => r.status === 'sent').length,
    failed: rows.filter((r: any) => r.status === 'failed').length,
    skipped: rows.filter((r: any) => String(r.status || '').startsWith('skipped')).length,
    pending: rows.filter((r: any) => r.status === 'pending').length,
  };
}

function toState(row: any, counts: { sent: number; failed: number; skipped: number }, currentLead: CampaignLead | null): CampaignState {
  const nextSendAt = row.next_send_at ? new Date(row.next_send_at).getTime() : 0;
  const countdown =
    row.status === 'running' && nextSendAt > Date.now() ? Math.ceil((nextSendAt - Date.now()) / 1000) : 0;

  return {
    id: row.id,
    status: row.status,
    currentIndex: row.current_index ?? 0,
    total: row.total ?? 0,
    delaySeconds: row.delay_seconds ?? 35,
    countdown,
    currentLead,
    pitchType: row.pitch_type || 'all_in_one',
    senderName: row.sender_name || DEFAULT_SENDER,
    startedAt: row.started_at || null,
    finishedAt: row.finished_at || null,
    logs: Array.isArray(row.logs) ? row.logs : [],
    ...counts,
  };
}

/** Reads live campaign state. Any server instance returns the same answer. */
export async function getStatus(): Promise<CampaignState> {
  const row = await loadCurrentCampaign();
  if (!row) return { ...IDLE_STATE };

  const counts = await targetCounts(row.id);

  // The target currently at the head of the queue, for the dashboard's "now pitching" line.
  const { data: nextTarget } = await supabase
    .from('campaign_targets')
    .select('*')
    .eq('campaign_id', row.id)
    .eq('status', 'pending')
    .order('position', { ascending: true })
    .limit(1);

  const currentLead: CampaignLead | null =
    nextTarget && nextTarget.length > 0
      ? {
          id: nextTarget[0].lead_id || undefined,
          business_name: nextTarget[0].business_name,
          phone_number: nextTarget[0].phone_number,
          category: nextTarget[0].category || undefined,
          city: nextTarget[0].city || undefined,
        }
      : null;

  return toState(row, { sent: counts.sent, failed: counts.failed, skipped: counts.skipped }, currentLead);
}

/**
 * Creates a campaign and its target list. Nothing is sent here — the worker
 * picks it up on the next tick, so this returns fast enough for a serverless
 * request and survives the function shutting down immediately afterwards.
 */
export async function startCampaign(params: {
  leads: CampaignLead[];
  pitchType?: string;
  customMessage?: string;
  senderName?: string;
  delaySeconds?: number;
}): Promise<{ success: boolean; error?: string; campaignId?: string; queued?: number; rejected?: number }> {
  const { data: alreadyRunning } = await supabase
    .from('campaigns')
    .select('id')
    .in('status', ['running', 'paused'])
    .limit(1);

  if (alreadyRunning && alreadyRunning.length > 0) {
    return {
      success: false,
      error: 'A campaign is already running or paused. Cancel it before starting another.',
    };
  }

  const businessId = await resolveOperatorBusinessId();

  // Normalise and de-duplicate before writing anything.
  const seen = new Set<string>();
  const valid: Array<{ lead: CampaignLead; phone: string }> = [];
  let rejected = 0;

  for (const lead of params.leads || []) {
    const phone = normalizeIndianPhone(lead?.phone_number || '');
    if (!phone || seen.has(phone)) {
      rejected++;
      continue;
    }
    seen.add(phone);
    valid.push({ lead, phone });
  }

  if (valid.length === 0) {
    return { success: false, error: 'No leads with a valid 10-digit Indian mobile number were provided.' };
  }

  const delaySeconds = params.delaySeconds && params.delaySeconds >= 10 ? params.delaySeconds : 35;

  const { data: created, error: createErr } = await supabase
    .from('campaigns')
    .insert({
      business_id: businessId,
      status: 'running',
      pitch_type: params.pitchType || 'all_in_one',
      sender_name: params.senderName || DEFAULT_SENDER,
      custom_message: params.customMessage || null,
      delay_seconds: delaySeconds,
      total: valid.length,
      current_index: 0,
      next_send_at: nowIso(), // first send is due immediately
      logs: [
        logEntry(
          `🚀 Campaign queued with ${valid.length} leads (${delaySeconds}s pacing)${
            rejected > 0 ? `, ${rejected} rejected as invalid or duplicate` : ''
          }`,
          'info'
        ),
      ],
      started_at: nowIso(),
    })
    .select()
    .single();

  if (createErr || !created) {
    console.error('[Campaign] Failed to create campaign:', createErr?.message);
    return { success: false, error: createErr?.message || 'Could not create campaign.' };
  }

  const targets = valid.map(({ lead, phone }, index) => ({
    campaign_id: created.id,
    lead_id: lead.id || null,
    position: index,
    business_name: lead.business_name || 'Business Owner',
    phone_number: phone,
    category: lead.category || null,
    city: lead.city || null,
    status: 'pending',
  }));

  // Chunked so a large list does not exceed the request body limit.
  for (let i = 0; i < targets.length; i += 500) {
    const { error: targetErr } = await supabase.from('campaign_targets').insert(targets.slice(i, i + 500));
    if (targetErr) {
      console.error('[Campaign] Failed to insert targets:', targetErr.message);
      await supabase
        .from('campaigns')
        .update({ status: 'cancelled', finished_at: nowIso() })
        .eq('id', created.id);
      return { success: false, error: `Could not queue targets: ${targetErr.message}` };
    }
  }

  console.log(`[Campaign] ✅ ${created.id} queued with ${valid.length} targets.`);
  return { success: true, campaignId: created.id, queued: valid.length, rejected };
}

async function setCampaignStatus(
  from: string[],
  to: 'running' | 'paused' | 'cancelled',
  logText: string,
  logType: CampaignLog['type']
): Promise<{ success: boolean; error?: string }> {
  const row = await loadCurrentCampaign();
  if (!row) return { success: false, error: 'No campaign found.' };
  if (!from.includes(row.status)) {
    return { success: false, error: `Campaign is ${row.status}; expected one of ${from.join(', ')}.` };
  }

  const patch: Record<string, any> = { status: to };
  if (to === 'cancelled') patch.finished_at = nowIso();
  // Resuming restarts the clock rather than firing a burst of overdue sends.
  if (to === 'running') patch.next_send_at = new Date(Date.now() + (row.delay_seconds ?? 35) * 1000).toISOString();

  const { error } = await supabase.from('campaigns').update(patch).eq('id', row.id);
  if (error) return { success: false, error: error.message };

  await appendLog(row.id, logText, logType);
  return { success: true };
}

export async function pauseCampaign() {
  return setCampaignStatus(['running'], 'paused', '⏸️ Campaign paused by user', 'warn');
}

export async function resumeCampaign() {
  return setCampaignStatus(['paused'], 'running', '▶️ Campaign resumed', 'info');
}

export async function cancelCampaign() {
  const result = await setCampaignStatus(['running', 'paused'], 'cancelled', '🛑 Campaign cancelled by user', 'warn');
  return result;
}

/**
 * Sends at most one queued pitch, if one is due.
 *
 * Call this from a scheduler (the Express interval, or a platform cron hitting
 * /api/admin/lead-hunter/campaign/tick). Returning after a single send keeps
 * each invocation short and means a killed process loses nothing.
 */
export async function tickCampaign(): Promise<{
  acted: boolean;
  reason?: string;
  campaignId?: string;
  target?: string;
  result?: 'sent' | 'failed' | 'skipped';
}> {
  const { data: dueRows, error: dueErr } = await supabase
    .from('campaigns')
    .select('*')
    .eq('status', 'running')
    .lte('next_send_at', nowIso())
    .order('created_at', { ascending: true })
    .limit(1);

  if (dueErr) {
    console.error('[Campaign Worker] Could not read due campaigns:', dueErr.message);
    return { acted: false, reason: 'query_failed' };
  }
  if (!dueRows || dueRows.length === 0) return { acted: false, reason: 'nothing_due' };

  const campaign = dueRows[0];

  // Claim this slot: only the worker that successfully moves next_send_at
  // forward proceeds. If two workers tick simultaneously the loser sees zero
  // updated rows and backs off, so the lead is never pitched twice.
  const claimedUntil = new Date(Date.now() + (campaign.delay_seconds ?? 35) * 1000).toISOString();
  const { data: claimed, error: claimErr } = await supabase
    .from('campaigns')
    .update({ next_send_at: claimedUntil })
    .eq('id', campaign.id)
    .eq('status', 'running')
    .eq('next_send_at', campaign.next_send_at)
    .select('id');

  if (claimErr) {
    console.error('[Campaign Worker] Claim failed:', claimErr.message);
    return { acted: false, reason: 'claim_failed' };
  }
  if (!claimed || claimed.length === 0) {
    return { acted: false, reason: 'claimed_by_another_worker' };
  }

  const { data: pending } = await supabase
    .from('campaign_targets')
    .select('*')
    .eq('campaign_id', campaign.id)
    .eq('status', 'pending')
    .order('position', { ascending: true })
    .limit(1);

  if (!pending || pending.length === 0) {
    const counts = await targetCounts(campaign.id);
    await supabase
      .from('campaigns')
      .update({ status: 'completed', finished_at: nowIso() })
      .eq('id', campaign.id);
    await appendLog(
      campaign.id,
      `🎉 Campaign complete — ${counts.sent} sent, ${counts.skipped} skipped, ${counts.failed} failed.`,
      'success'
    );
    console.log(`[Campaign Worker] ✅ ${campaign.id} complete.`);
    return { acted: true, campaignId: campaign.id, reason: 'completed' };
  }

  const target = pending[0];
  const outcome = await dispatchTarget(campaign, target);

  await supabase
    .from('campaigns')
    .update({ current_index: (target.position ?? 0) + 1 })
    .eq('id', campaign.id);

  return {
    acted: true,
    campaignId: campaign.id,
    target: target.business_name,
    result: outcome,
  };
}

async function dispatchTarget(campaign: any, target: any): Promise<'sent' | 'failed' | 'skipped'> {
  const businessName = target.business_name || 'Business Owner';
  const city = target.city || 'your city';
  const category = target.category || 'business';
  const label = `[${(target.position ?? 0) + 1}/${campaign.total}]`;

  // Consent gate. A cold WhatsApp pitch to someone who has not opted in — or who
  // has replied STOP — is exactly what gets a WABA number banned, so it is
  // checked here rather than trusted from whatever queued the campaign.
  const consentStatus = await lookupConsentStatus(target.lead_id, target.phone_number);
  const gate = await checkOutreachAllowed({ phone: target.phone_number, consentStatus });

  if (!gate.allowed) {
    const status = gate.reason === 'opted_out' ? 'skipped_opt_out' : 'skipped_no_consent';
    await supabase
      .from('campaign_targets')
      .update({ status, error: gate.detail })
      .eq('id', target.id);
    await appendLog(campaign.id, `${label} ⏭️ Skipped ${businessName}: ${gate.detail}`, 'warn');
    console.warn(`[Campaign Worker] Skipped ${businessName} (${gate.reason}).`);
    return 'skipped';
  }

  const pitchText = campaign.custom_message
    ? renderCustomMessage(campaign.custom_message, {
        businessName,
        city,
        category,
        senderName: campaign.sender_name || DEFAULT_SENDER,
      })
    : buildPersonalizedPitch(
        businessName,
        category,
        city,
        (campaign.pitch_type || 'all_in_one') as PitchType,
        campaign.sender_name || DEFAULT_SENDER
      );

  await appendLog(campaign.id, `${label} 📤 Pitching ${businessName} (${target.phone_number})...`, 'info');

  const sendResult = await sendInteractiveButtonsMessage(
    target.phone_number,
    ENV.WHATSAPP_BUSINESS_NUMBER,
    pitchText,
    PITCH_BUTTONS.map((b) => ({ id: b.id, title: b.title }))
  );

  if (!sendResult.success) {
    await supabase
      .from('campaign_targets')
      .update({ status: 'failed', error: sendResult.error || 'send failed' })
      .eq('id', target.id);
    await appendLog(campaign.id, `${label} ⚠️ Failed ${businessName}: ${sendResult.error}`, 'warn');

    // A credentials problem will fail every remaining target too — pause rather
    // than burn through the whole queue logging the same error.
    if (sendResult.notConfigured) {
      await supabase.from('campaigns').update({ status: 'paused' }).eq('id', campaign.id);
      await appendLog(
        campaign.id,
        '⏸️ Campaign auto-paused: WhatsApp credentials are not configured. Set WHATSAPP_CLOUD_API_TOKEN and WHATSAPP_PHONE_NUMBER_ID, then resume.',
        'warn'
      );
    }
    return 'failed';
  }

  await supabase
    .from('campaign_targets')
    .update({ status: 'sent', sent_at: nowIso(), error: null })
    .eq('id', target.id);

  await recordOutboundConversation(campaign.business_id, target.phone_number, pitchText);
  await markLeadContacted(target.lead_id, target.phone_number, campaign.pitch_type);

  await appendLog(campaign.id, `${label} ✅ Delivered to ${businessName}`, 'success');
  return 'sent';
}

/** Consent comes from the lead record, never from the campaign request body. */
async function lookupConsentStatus(leadId: string | null, phone: string): Promise<string> {
  try {
    if (leadId) {
      const { data } = await supabase
        .from('lead_hunter_leads')
        .select('consent_status')
        .eq('id', leadId)
        .maybeSingle();
      if (data) return data.consent_status || 'none';
    }

    const last10 = (phone || '').replace(/\D/g, '').slice(-10);
    if (last10.length === 10) {
      const { data } = await supabase
        .from('lead_hunter_leads')
        .select('consent_status')
        .like('phone_number', `%${last10}`)
        .limit(1);
      if (data && data.length > 0) return data[0].consent_status || 'none';
    }
  } catch (err: any) {
    console.warn('[Campaign] Consent lookup failed:', err?.message || err);
  }
  // Unknown number, or a lookup we could not complete: treat as no consent.
  return 'none';
}

async function recordOutboundConversation(businessId: string | null, phone: string, text: string) {
  const bizId = businessId || (await resolveOperatorBusinessId());
  if (!bizId) {
    console.warn('[Campaign] No operator business resolved — outbound pitch not logged to conversations.');
    return;
  }
  try {
    await supabase.from('conversations').insert({
      business_id: bizId,
      customer_number: phone,
      message_text: text,
      message_direction: 'outbound',
    });
  } catch (err: any) {
    console.warn('[Campaign] Conversation log failed:', err?.message || err);
  }
}

async function markLeadContacted(leadId: string | null, phone: string, pitchType: string | null) {
  try {
    const columns = 'id, contact_attempts, first_contacted_at';
    let lead: any = null;

    if (leadId) {
      const { data } = await supabase.from('lead_hunter_leads').select(columns).eq('id', leadId).maybeSingle();
      lead = data;
    } else {
      const last10 = (phone || '').replace(/\D/g, '').slice(-10);
      if (last10.length !== 10) return;
      const { data } = await supabase
        .from('lead_hunter_leads')
        .select(columns)
        .like('phone_number', `%${last10}`)
        .limit(1);
      lead = data && data.length > 0 ? data[0] : null;
    }

    if (!lead) return;

    await supabase
      .from('lead_hunter_leads')
      .update({
        status: 'sent',
        pitch_type: pitchType || null,
        first_contacted_at: lead.first_contacted_at || nowIso(),
        last_contacted_at: nowIso(),
        contact_attempts: (lead.contact_attempts || 0) + 1,
      })
      .eq('id', lead.id);
  } catch (err: any) {
    console.warn('[Campaign] Could not update lead contact state:', err?.message || err);
  }
}

/**
 * Runs ticks on an interval inside a long-lived process (the Express server).
 * Serverless deployments should hit the /campaign/tick route from a platform
 * cron instead; both paths are safe to run simultaneously.
 */
export function startCampaignWorker(intervalMs = 5000): NodeJS.Timeout {
  console.log(`[Campaign Worker] Started — polling every ${Math.round(intervalMs / 1000)}s.`);
  return setInterval(async () => {
    try {
      await tickCampaign();
    } catch (err: any) {
      console.error('[Campaign Worker] Tick failed:', err?.message || err);
    }
  }, intervalMs);
}

/**
 * Kept so existing route handlers keep working. Every method is async now
 * because the state is in Postgres, not in this process.
 */
export const campaignService = {
  getStatus,
  startCampaign,
  pauseCampaign,
  resumeCampaign,
  cancelCampaign,
  tickCampaign,
};

// Re-exported from the single canonical copy in pitchTemplates. This module used
// to carry its own 80-line duplicate that drifted from the one in send-pitch.
export { buildPersonalizedPitch };
