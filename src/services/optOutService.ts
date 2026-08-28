import { supabase } from '../config/supabase';

/**
 * Opt-out / consent enforcement.
 *
 * Two independent gates, both of which must pass before anything is dispatched
 * to a number the recipient did not initiate contact from:
 *
 *   1. hasOptedOut()      — the recipient told us to stop. Absolute, forever.
 *   2. hasOutreachConsent() — we have a recorded, inspectable reason to be
 *                             messaging them in the first place.
 *
 * A missing consent record is a REFUSAL, not a default-allow. That is the whole
 * point: unsolicited commercial WhatsApp to Indian mobiles is both a TRAI/DLT
 * problem and the fastest way to lose the WABA number the product runs on.
 */

/** Consent values that permit outbound outreach. */
export const OUTREACH_ALLOWED_CONSENT = ['opt_in', 'legitimate_b2b'] as const;

/**
 * STOP intents, English + common Hindi/Marathi phrasings and Devanagari.
 * Deliberately broad: a false positive costs one unwanted silence, a false
 * negative costs a compliance complaint.
 */
const OPT_OUT_PATTERN =
  /(^|\b)(stop|unsubscribe|opt\s?out|optout|remove me|do not (?:contact|message|disturb)|dont (?:contact|message)|no more messages?|block me|band karo|band kar|bandh kara|mat bhejo|mat bhej|message mat|pareshan mat|nahi chahiye)(\b|$)|बंद करो|मत भेजो|मत भेजें|परेशान मत|नको पाठवू/i;

export function isOptOutMessage(text: string): boolean {
  if (!text) return false;
  return OPT_OUT_PATTERN.test(text.trim());
}

/** Canonical form used as the opt-out key: digits only, no leading '+'. */
export function toPhoneDigits(phone: string): string {
  return (phone || '').replace(/\D/g, '');
}

/**
 * Normalises to E.164 for India. Returns null when the input cannot be a real
 * Indian mobile — 10 digits starting 6-9, optionally already 91-prefixed.
 */
export function normalizeIndianPhone(raw: string): string | null {
  const digits = toPhoneDigits(raw);
  if (!digits) return null;

  let local = digits;
  if (local.length === 12 && local.startsWith('91')) local = local.slice(2);
  else if (local.length === 11 && local.startsWith('0')) local = local.slice(1);
  else if (local.length === 13 && local.startsWith('091')) local = local.slice(3);

  if (local.length !== 10) return null;
  if (!/^[6-9]/.test(local)) return null;

  return `+91${local}`;
}

export async function hasOptedOut(phone: string): Promise<boolean> {
  const digits = toPhoneDigits(phone);
  if (!digits) return false;

  // Match on the last 10 digits so +91XXXXXXXXXX and XXXXXXXXXX are the same person.
  const last10 = digits.slice(-10);

  const { data, error } = await supabase
    .from('opt_outs')
    .select('id')
    .like('phone_digits', `%${last10}`)
    .limit(1);

  if (error) {
    // Fail CLOSED: if we cannot prove they haven't opted out, don't send.
    console.error('[OptOut] Registry lookup failed — suppressing send to be safe:', error.message);
    return true;
  }

  return Boolean(data && data.length > 0);
}

export async function recordOptOut(params: {
  phone: string;
  businessId?: string | null;
  reason?: string;
  sourceText?: string;
}): Promise<void> {
  const digits = toPhoneDigits(params.phone);
  if (!digits) return;

  const { error } = await supabase.from('opt_outs').upsert(
    {
      phone_digits: digits,
      business_id: params.businessId || null,
      reason: params.reason || 'user_requested_stop',
      source_text: (params.sourceText || '').slice(0, 500),
    },
    { onConflict: 'phone_digits' }
  );

  if (error) {
    console.error('[OptOut] Failed to record opt-out:', error.message);
    return;
  }

  console.log(`[OptOut] ✅ ${digits} added to the suppression list. No further outbound will be sent.`);

  // Reflect it on the prospect record too, so the Lead Hunter UI stops offering them.
  await supabase
    .from('lead_hunter_leads')
    .update({ consent_status: 'opted_out', status: 'opted_out', updated_at: new Date().toISOString() })
    .like('phone_number', `%${digits.slice(-10)}`);
}

export interface OutreachGateResult {
  allowed: boolean;
  /** Machine-readable reason, used as campaign_targets.status when blocked. */
  reason: 'ok' | 'opted_out' | 'no_consent' | 'invalid_phone';
  detail?: string;
}

/**
 * The single gate every cold-outreach dispatch must pass through.
 *
 * `consentStatus` comes from lead_hunter_leads.consent_status. A lead that was
 * never persisted has no consent record and is therefore refused — that is
 * intentional, not an oversight.
 */
export async function checkOutreachAllowed(params: {
  phone: string;
  consentStatus?: string | null;
}): Promise<OutreachGateResult> {
  const normalized = normalizeIndianPhone(params.phone);
  if (!normalized) {
    return { allowed: false, reason: 'invalid_phone', detail: `"${params.phone}" is not a valid Indian mobile number` };
  }

  if (await hasOptedOut(normalized)) {
    return { allowed: false, reason: 'opted_out', detail: 'Recipient is on the opt-out suppression list' };
  }

  const consent = params.consentStatus || 'none';
  if (!(OUTREACH_ALLOWED_CONSENT as readonly string[]).includes(consent)) {
    return {
      allowed: false,
      reason: 'no_consent',
      detail: `consent_status="${consent}" — mark the lead as opt_in or legitimate_b2b (with a recorded reason) before contacting them`,
    };
  }

  return { allowed: true, reason: 'ok' };
}

/** Acknowledgement sent once when someone opts out, then silence. */
export function optOutAcknowledgement(): string {
  return `You've been unsubscribed. 🙏\n\nYou will not receive any further messages from us. Sorry for the interruption.`;
}
