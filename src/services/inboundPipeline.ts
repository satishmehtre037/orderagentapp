import crypto from 'crypto';
import { ENV } from '../config/env';
import { supabase } from '../config/supabase';
import {
  getBusinessByWhatsappNumber,
  getBusinessConfigs,
  saveConversationMessage,
  getRecentConversations,
  saveCapturedRecord,
  cancelOrdersForCustomer,
} from './businessService';
import { buildSystemPrompt } from './promptBuilder';
import { getResponse, extractStructuredCapture } from './claudeService';
import { sendMessage } from './whatsappService';
import { downloadWhatsAppMedia, transcribeAudioWithGroq } from './whisperService';
import { findCAClient, handleCAClientQuery, processIncomingDocument, handleCALeadInquiry } from './caService';
import { resolveCategoryFromNameOrType } from '../lib/constants/categoryPresets';
import { isOptOutMessage, recordOptOut, optOutAcknowledgement, hasOptedOut } from './optOutService';

/**
 * The single inbound WhatsApp pipeline.
 *
 * There used to be two independent webhook handlers: the Express route at
 * src/routes/webhook.ts (the real AI brain) and src/app/api/webhook/route.ts (a
 * regex auto-replier), plus two more files re-exporting the second one. Whichever
 * URL was configured in Meta decided which behaviour the product had, and the
 * simpler one silently shadowed the AI. Both entry points are now thin adapters
 * over this module, so there is one behaviour regardless of deployment target.
 */

// ---------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------

export interface VerificationResult {
  ok: boolean;
  challenge?: string;
  reason?: string;
}

/**
 * Meta GET verification. The token is now REQUIRED to match.
 *
 * The Express handler previously echoed hub.challenge for any request with
 * mode=subscribe and never looked at hub.verify_token; the Next handler accepted
 * three hardcoded tokens *or* no token at all (`|| !token`). Either let anyone
 * who found the URL bind their own Meta app to this endpoint.
 */
export function verifySubscription(params: {
  mode?: string | null;
  token?: string | null;
  challenge?: string | null;
}): VerificationResult {
  const expected = ENV.WHATSAPP_VERIFY_TOKEN;

  if (!expected) {
    return { ok: false, reason: 'WHATSAPP_VERIFY_TOKEN is not configured on the server.' };
  }
  if (params.mode !== 'subscribe') {
    return { ok: false, reason: `Unexpected hub.mode "${params.mode}".` };
  }
  if (!params.challenge) {
    return { ok: false, reason: 'Missing hub.challenge.' };
  }

  const provided = params.token || '';
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  const matches = a.length === b.length && crypto.timingSafeEqual(a, b);

  if (!matches) {
    return { ok: false, reason: 'hub.verify_token does not match WHATSAPP_VERIFY_TOKEN.' };
  }

  return { ok: true, challenge: String(params.challenge) };
}

/**
 * Validates Meta's x-hub-signature-256 header against the raw request body.
 *
 * Returns true when APP_SECRET is unset so an existing deployment does not go
 * dark on upgrade, but logs loudly — an unverified webhook accepts forged
 * payloads from anyone who knows the URL.
 */
export function verifyPayloadSignature(rawBody: string | Buffer, signatureHeader?: string | null): boolean {
  const secret = ENV.WHATSAPP_APP_SECRET;

  if (!secret) {
    console.warn('[Webhook] ⚠️ WHATSAPP_APP_SECRET not set — accepting payload WITHOUT signature verification.');
    return true;
  }

  if (!signatureHeader) {
    console.error('[Webhook] ❌ Missing x-hub-signature-256 header. Rejecting payload.');
    return false;
  }

  const expected =
    'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

  const a = Buffer.from(signatureHeader);
  const b = Buffer.from(expected);

  if (a.length !== b.length) {
    console.error('[Webhook] ❌ Signature length mismatch. Rejecting payload.');
    return false;
  }

  const valid = crypto.timingSafeEqual(a, b);
  if (!valid) console.error('[Webhook] ❌ Invalid x-hub-signature-256. Rejecting payload.');
  return valid;
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

export interface ParsedInbound {
  businessNumber: string;
  customerNumber: string;
  messageText: string;
  profileName?: string;
  isVoiceNote: boolean;
  isMediaDocument: boolean;
  mediaPayload: { mediaId?: string; mimeType?: string; filename?: string };
  messageType: string;
}

/** Extracts every message in a Meta webhook payload (a batch may carry several). */
export async function parseInboundWebhook(body: any): Promise<ParsedInbound[]> {
  if (body?.object !== 'whatsapp_business_account') return [];

  const parsed: ParsedInbound[] = [];

  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      const value = change?.value;
      const businessNumber = value?.metadata?.display_phone_number || '';
      const contactProfile = value?.contacts?.[0];

      for (const message of value?.messages || []) {
        const customerNumber = message.from;
        let messageText = '';
        let isVoiceNote = false;
        let isMediaDocument = false;
        let mediaPayload: ParsedInbound['mediaPayload'] = {};

        if (message.type === 'text') {
          messageText = message.text?.body || '';
        } else if (message.type === 'interactive') {
          const buttonReply = message.interactive?.button_reply;
          const listReply = message.interactive?.list_reply;
          messageText =
            buttonReply?.title || buttonReply?.id || listReply?.title || listReply?.id || '[Interactive Click]';
          console.log(`[Webhook] 🔘 Interactive click: "${messageText}"`);
        } else if (message.type === 'button') {
          messageText = message.button?.text || message.button?.payload || '[Button Click]';
        } else if (message.type === 'audio' || message.type === 'voice') {
          const audioObj = message.audio || message.voice;
          const mediaId = audioObj?.id;
          if (!mediaId) {
            console.warn('[Webhook] ⚠️ Audio message missing media ID. Skipping.');
            continue;
          }
          try {
            const { buffer } = await downloadWhatsAppMedia(mediaId);
            messageText = await transcribeAudioWithGroq(buffer, 'voicenote.ogg');
            isVoiceNote = true;
            console.log(`[Webhook] 🎙️ Transcribed voice note: "${messageText}"`);
          } catch (voiceErr: any) {
            console.error('[Webhook] Voice transcription failed:', voiceErr?.message || voiceErr);
            await sendMessage(
              customerNumber,
              businessNumber,
              "🙏 Sorry, I couldn't clearly hear your voice note. Could you please send it again or type your message?"
            );
            continue;
          }
        } else if (message.type === 'document' || message.type === 'image') {
          isMediaDocument = true;
          const mediaObj = message.document || message.image;
          mediaPayload = {
            mediaId: mediaObj?.id,
            mimeType: mediaObj?.mime_type,
            filename: mediaObj?.filename || (message.type === 'image' ? 'photo.jpg' : 'document.pdf'),
          };
          messageText =
            mediaObj?.caption ||
            `[Attached ${message.type === 'image' ? 'Image' : 'Document'}: ${mediaPayload.filename}]`;
        } else {
          console.log(`[Webhook] Ignoring message type: ${message.type}`);
          continue;
        }

        if (!messageText.trim() && !isMediaDocument) continue;

        parsed.push({
          businessNumber,
          customerNumber,
          messageText,
          profileName: contactProfile?.profile?.name || contactProfile?.name,
          isVoiceNote,
          isMediaDocument,
          mediaPayload,
          messageType: message.type,
        });
      }
    }
  }

  return parsed;
}

// ---------------------------------------------------------------------------
// Handling
// ---------------------------------------------------------------------------

/** Processes every message in a payload. Errors are contained per-message. */
export async function processWebhookPayload(body: any): Promise<void> {
  const messages = await parseInboundWebhook(body);

  for (const msg of messages) {
    try {
      await handleInboundMessage(msg);
    } catch (err: any) {
      console.error(`[Webhook Pipeline] Exception handling message from ${msg.customerNumber}:`, err?.message || err);
    }
  }
}

export async function handleInboundMessage(inbound: ParsedInbound): Promise<void> {
  const { businessNumber, customerNumber, messageText, isVoiceNote, isMediaDocument, mediaPayload } = inbound;

  console.log(`\n======================================================`);
  console.log(
    `[Webhook] 📥 INBOUND ${isVoiceNote ? '(🎙️ Voice)' : isMediaDocument ? '(📄 Media)' : '(💬 Text)'}`
  );
  console.log(`[Webhook] To business : ${businessNumber}`);
  console.log(`[Webhook] From        : ${customerNumber}`);
  console.log(`[Webhook] Content     : "${messageText}"`);
  console.log(`======================================================`);

  // -------------------------------------------------------------------------
  // 1. STOP / unsubscribe — handled before anything else, and always honoured.
  // -------------------------------------------------------------------------
  if (isOptOutMessage(messageText)) {
    console.log(`[Webhook] 🛑 Opt-out request from ${customerNumber}.`);
    const business = await getBusinessByWhatsappNumber(businessNumber);
    await recordOptOut({
      phone: customerNumber,
      businessId: business?.id || null,
      reason: 'inbound_stop_message',
      sourceText: messageText,
    });
    await sendMessage(customerNumber, businessNumber, optOutAcknowledgement());
    if (business) {
      await saveConversationMessage(business.id, customerNumber, 'inbound', messageText);
      await saveConversationMessage(business.id, customerNumber, 'outbound', optOutAcknowledgement());
    }
    return;
  }

  // -------------------------------------------------------------------------
  // 2. Tenant resolution — strict.
  //
  // This block previously read:
  //   let bizId: string | null = 'e39dee77-e7b9-45cf-ad64-fd6400f59a29';
  //   const { data: bList } = await supabase.from('businesses').select('id').limit(1);
  //   if (bList && bList.length > 0) bizId = bList[0].id;
  //
  // so every inbound message was filed against one hardcoded UUID or an
  // arbitrary row. An unrecognised number is now dropped rather than served
  // another tenant's data.
  // -------------------------------------------------------------------------
  const business = await getBusinessByWhatsappNumber(businessNumber);

  if (!business) {
    console.warn(
      `[Webhook Pipeline] ⚠️ No business registered for ${businessNumber}. Dropping message from ${customerNumber}.`
    );
    return;
  }

  console.log(`[Webhook Pipeline] ✅ Tenant: "${business.name}" (${business.id}) [${business.category}]`);

  const messageToSave = isMediaDocument
    ? `📄 [Document Upload]: ${mediaPayload.filename}`
    : isVoiceNote
    ? `🎙️ [Voice Note]: ${messageText}`
    : messageText;

  await saveConversationMessage(business.id, customerNumber, 'inbound', messageToSave);

  // -------------------------------------------------------------------------
  // 3. Cold-outreach prospect replies.
  //
  // The old handler ran this branch for EVERY inbound message from any number
  // other than one hardcoded operator phone, and `return`ed early — so a
  // tenant's paying customer saying "yes" to a booking triggered a "HOT CLIENT
  // LEAD ALERT" for WebCore Studios and never reached the AI at all. It now
  // only fires for numbers we actually pitched, i.e. a lead_hunter_leads row.
  // -------------------------------------------------------------------------
  const handledAsProspect = await handleProspectReply(inbound, business);
  if (handledAsProspect) return;

  // -------------------------------------------------------------------------
  // 4. Pause + subscription guards
  // -------------------------------------------------------------------------
  const configs = await getBusinessConfigs(business.id);
  const isBotPaused = configs.some(
    (c) => c.config_key === 'bot_paused' && (c.config_value === true || c.config_value === 'true')
  );

  if (isBotPaused) {
    console.log(`[Webhook Pipeline] ⏸️ AI agent paused by owner for "${business.name}". Logged, not answered.`);
    return;
  }

  const isTrialExpired =
    business.subscription_status === 'expired' ||
    (business.subscription_status === 'trial' &&
      business.trial_end_date &&
      new Date(business.trial_end_date).getTime() < Date.now());

  if (isTrialExpired) {
    console.warn(`[Webhook Pipeline] ⚠️ "${business.name}" trial expired (${business.trial_end_date}).`);
    const unavailableNotice =
      `⚠️ *${business.name} Support Notice*\n\nOur automated AI assistant trial has ended. ` +
      `Please contact our team directly, or visit the owner dashboard to renew the subscription ` +
      `(₹999/month) and resume instant AI replies.`;
    await sendMessage(customerNumber, business.whatsapp_number, unavailableNotice);
    await saveConversationMessage(business.id, customerNumber, 'outbound', unavailableNotice);
    return;
  }

  const effectiveCategory = resolveCategoryFromNameOrType(business.category, business.name);

  // -------------------------------------------------------------------------
  // 5. CA firm automation suite
  // -------------------------------------------------------------------------
  if (effectiveCategory === 'ca_firm') {
    await handleCAFirmBranch(inbound, business);
    return;
  }

  // -------------------------------------------------------------------------
  // 6. Hospital / clinic 1-5 star feedback
  // -------------------------------------------------------------------------
  const isHospitalOrClinic = effectiveCategory === 'hospital' || effectiveCategory === 'clinic';
  const ratingMatch = messageText.trim().match(/^([1-5])(\s*(star|stars|\/5|\.0)?)?$/i);

  if (isHospitalOrClinic && ratingMatch) {
    await handleFeedbackRating(inbound, business, parseInt(ratingMatch[1], 10));
    return;
  }

  // -------------------------------------------------------------------------
  // 7. Standard AI pipeline
  // -------------------------------------------------------------------------
  await handleStandardAIReply(inbound, business, configs);
}

// ---------------------------------------------------------------------------
// Branch: cold-outreach prospect reply
// ---------------------------------------------------------------------------

async function handleProspectReply(inbound: ParsedInbound, business: any): Promise<boolean> {
  const { customerNumber, messageText, businessNumber, profileName } = inbound;
  const cleanSender = customerNumber.replace(/\D/g, '');
  const last10 = cleanSender.slice(-10);

  if (last10.length !== 10) return false;

  const { data: lead } = await supabase
    .from('lead_hunter_leads')
    .select('id, business_name, status, consent_status')
    .like('phone_number', `%${last10}`)
    .limit(1)
    .maybeSingle();

  // Not somebody we pitched — this is an ordinary customer, hand back to the AI.
  if (!lead) return false;
  if (lead.status === 'pending') return false; // sourced but never contacted

  console.log(`[Webhook] 📣 Reply from pitched prospect "${lead.business_name}" (${customerNumber}).`);

  const isPositive =
    /(yes|interested|demo|show demo|call me|tell me|cost|price|pricing|batao|haan|ready|need website|need app|sure|connect|schedule|karna hai|btn_show_demo|btn_pricing)/i.test(
      messageText
    );
  const isNegative = /(not now|not interested|no thanks|nahi|btn_not_now)/i.test(messageText);

  await supabase
    .from('lead_hunter_leads')
    .update({ status: 'replied', updated_at: new Date().toISOString() })
    .eq('id', lead.id);

  // Operator alert. Previously hardcoded to '918779841346'; now configuration,
  // and silently skipped rather than misdelivered when unset.
  if (ENV.ADMIN_ALERT_NUMBER) {
    const alertHeader = isPositive
      ? `🔥 *HOT LEAD REPLY*`
      : isNegative
      ? `ℹ️ *Prospect declined*`
      : `💬 *New prospect reply*`;

    const adminAlertText =
      `${alertHeader}\n\n🏢 *Business*: ${lead.business_name}\n` +
      `👤 *Contact*: ${profileName || 'Prospect'}\n📱 *Phone*: ${customerNumber}\n` +
      `💬 *Message*: "${messageText}"\n⏰ *Time*: ${new Date().toLocaleTimeString('en-IN')}\n\n` +
      `👉 https://wa.me/${cleanSender}`;

    await sendMessage(ENV.ADMIN_ALERT_NUMBER, businessNumber, adminAlertText);
  } else {
    console.warn('[Webhook] ADMIN_ALERT_NUMBER not configured — prospect alert not sent.');
  }

  if (isNegative) {
    // A decline is an opt-out. Recording it stops every future campaign from
    // re-pitching the same number, which is what previously happened.
    await recordOptOut({
      phone: customerNumber,
      businessId: business.id,
      reason: 'prospect_declined',
      sourceText: messageText,
    });

    const declineAck =
      `Understood — thank you for your time. 🙏\n\nWe won't message you again. ` +
      `If you ever want to look at a website, app, or WhatsApp automation, we're a message away.`;
    await sendMessage(customerNumber, businessNumber, declineAck);
    await saveConversationMessage(business.id, customerNumber, 'outbound', declineAck);
    return true;
  }

  if (isPositive) {
    const confirmText =
      `🙏 *Thank you for your interest!*\n\nOur team has received your response and will connect with you shortly ` +
      `with a live custom demo and pricing.` +
      (ENV.ADMIN_ALERT_NUMBER ? `\n\nNeed us sooner? Call or WhatsApp *+${ENV.ADMIN_ALERT_NUMBER}*. 🚀` : '');
    await sendMessage(customerNumber, businessNumber, confirmText);
    await saveConversationMessage(business.id, customerNumber, 'outbound', confirmText);
    return true;
  }

  // Ambiguous reply from a prospect: alert sent, but let the AI answer it.
  return false;
}

// ---------------------------------------------------------------------------
// Branch: CA firm
// ---------------------------------------------------------------------------

async function handleCAFirmBranch(inbound: ParsedInbound, business: any): Promise<void> {
  const { customerNumber, messageText, isMediaDocument, mediaPayload, profileName } = inbound;

  let caClient = await findCAClient({ phone: customerNumber, businessId: business.id });

  if (isMediaDocument) {
    if (!caClient) {
      const senderName = profileName || `Client (${customerNumber.slice(-4)})`;
      const { data: newClient } = await supabase
        .from('ca_clients')
        .insert({
          business_id: business.id,
          client_name: senderName,
          phone: customerNumber,
          entity_type: 'Proprietorship',
        })
        .select()
        .maybeSingle();

      caClient =
        newClient ||
        ({
          business_id: business.id,
          client_name: senderName,
          phone: customerNumber,
          entity_type: 'Proprietorship',
        } as any);
    }

    const docRes = await processIncomingDocument(caClient!, mediaPayload, business.name);
    await sendMessage(customerNumber, business.whatsapp_number, docRes.text);
    await saveConversationMessage(business.id, customerNumber, 'outbound', docRes.text);
    return;
  }

  if (caClient) {
    const supportReply = await handleCAClientQuery(caClient, messageText, 'whatsapp', business.name);
    await sendMessage(customerNumber, business.whatsapp_number, supportReply);
    await saveConversationMessage(business.id, customerNumber, 'outbound', supportReply);
    return;
  }

  const leadRes = await handleCALeadInquiry(
    customerNumber,
    messageText,
    profileName,
    'WhatsApp',
    business.id,
    business.name
  );
  await sendMessage(customerNumber, business.whatsapp_number, leadRes.replyText);
  await saveConversationMessage(business.id, customerNumber, 'outbound', leadRes.replyText);
}

// ---------------------------------------------------------------------------
// Branch: hospital / clinic star rating
// ---------------------------------------------------------------------------

async function handleFeedbackRating(inbound: ParsedInbound, business: any, numericRating: number): Promise<void> {
  const { customerNumber, profileName } = inbound;
  console.log(`[Webhook Pipeline] ⭐ Feedback rating ${numericRating}/5 for ${business.id}`);

  const { data: recentAppt } = await supabase
    .from('hospital_appointments')
    .select('id, patient_name, doctor_name, patient_phone')
    .eq('business_id', business.id)
    .eq('patient_phone', customerNumber)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const patientName = recentAppt?.patient_name || profileName || 'Patient';
  const doctorName = recentAppt?.doctor_name || 'your doctor';
  const isUnhappy = numericRating <= 3;

  await supabase.from('hospital_feedback').insert([
    {
      business_id: business.id,
      appointment_id: recentAppt?.id || null,
      patient_name: patientName,
      patient_phone: customerNumber,
      doctor_name: doctorName,
      rating: numericRating,
      status: isUnhappy ? 'escalated' : 'responded',
      google_review_requested: !isUnhappy,
      apology_sent: isUnhappy,
      responded_at: new Date().toISOString(),
    },
  ]);

  const feedbackReply = isUnhappy
    ? `🙏 *We sincerely apologise*\n\nNamaste ${patientName} ji,\n\nWe're sorry your experience didn't meet expectations (${numericRating}/5 ⭐).\n\nOur patient care supervisor has been notified and will reach out to resolve your concern. You can also reply here with any details.`
    : `⭐ *Thank you for your ${numericRating}-star rating!*\n\nNamaste ${patientName} ji,\n\nWe're glad you had a positive consultation with *${doctorName}* (${numericRating}/5 ⭐).\n\nYour feedback helps us keep improving. Stay healthy!`;

  await sendMessage(customerNumber, business.whatsapp_number, feedbackReply);
  await saveConversationMessage(business.id, customerNumber, 'outbound', feedbackReply);
}

// ---------------------------------------------------------------------------
// Branch: standard AI reply + capture extraction
// ---------------------------------------------------------------------------

async function handleStandardAIReply(inbound: ParsedInbound, business: any, configs: any[]): Promise<void> {
  const { customerNumber, messageText } = inbound;

  // Ultra-fast parallel execution of history & prompt building
  const [history, systemPrompt] = await Promise.all([
    getRecentConversations(business.id, customerNumber, 4),
    buildSystemPrompt(business.id).catch((pErr) => {
      console.warn('[Webhook Pipeline] Prompt builder fallback:', pErr);
      return `You are a helpful customer service assistant for ${business.name}.`;
    }),
  ]);

  const aiResponseText = await getResponse(systemPrompt, history, messageText, business, configs);

  let replyText = aiResponseText;
  let capturedData: any = null;

  // Method 1: markdown code fence ```json ... ```
  const codeBlockMatch = replyText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i);
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1]);
      capturedData = parsed.capture || parsed;
      replyText = replyText.replace(codeBlockMatch[0], '').trim();
    } catch (_) {}
  }

  // Method 2: outermost JSON block containing capture/type/details/items
  if (!capturedData) {
    const firstBrace = replyText.indexOf('{');
    const lastBrace = replyText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const potentialJson = replyText.slice(firstBrace, lastBrace + 1);
      try {
        const parsed = JSON.parse(potentialJson);
        if (parsed.capture || parsed.type || parsed.details || parsed.items) {
          capturedData = parsed.capture || parsed;
          replyText = (replyText.slice(0, firstBrace) + replyText.slice(lastBrace + 1)).trim();
        }
      } catch (_) {
        const captureIdx = replyText.indexOf('"capture"');
        if (captureIdx !== -1) {
          const startBrace = replyText.lastIndexOf('{', captureIdx);
          if (startBrace !== -1) {
            try {
              const parsed = JSON.parse(replyText.slice(startBrace, lastBrace + 1));
              capturedData = parsed.capture || parsed;
              replyText = (replyText.slice(0, startBrace) + replyText.slice(lastBrace + 1)).trim();
            } catch (_) {}
          }
        }
      }
    }
  }

  // Method 3: secondary AI intent analysis
  if (!capturedData) {
    const fullHistory = [...history, { sender: 'inbound', message: messageText } as any];
    capturedData = await extractStructuredCapture(fullHistory, business.category);
  }

  replyText = replyText.replace(/\{[\s\S]*?"(?:type|capture|details|items)"[\s\S]*?\}/g, '').trim();

  const isCancelIntent =
    /\b(cancel|cancle|discard|abort)\b/i.test(messageText) ||
    capturedData?.action === 'cancel' ||
    capturedData?.status === 'cancelled';

  if (isCancelIntent) {
    const isCancelAll =
      /\b(all|everything|both|entire|orders)\b/i.test(messageText) ||
      capturedData?.all === true ||
      capturedData?.cancel_all === true;

    console.log(`[Webhook Pipeline] ❌ Cancellation intent (all: ${isCancelAll}) for ${customerNumber}`);
    await cancelOrdersForCustomer(business.id, customerNumber, isCancelAll);
  } else if (capturedData) {
    const details = capturedData.details || capturedData;
    const items = Array.isArray(details?.items)
      ? details.items
      : typeof details?.items === 'string'
      ? [{ name: details.items }]
      : [];

    const hasValidItems = items.some((it: any) => {
      const name = (typeof it === 'string' ? it : it?.name || '').toLowerCase().trim();
      return (
        name.length > 1 &&
        !name.includes('greeting') &&
        !name.includes('hello') &&
        !name.includes('hi') &&
        !name.includes('inquiry') &&
        !name.includes('not specified') &&
        !name.includes('none')
      );
    });

    const hasAppointmentDetails = Boolean(
      details?.appointment_time || details?.slot || details?.date || details?.time
    );
    const isValidCapture =
      (hasValidItems || hasAppointmentDetails) && details?.confirmed !== false && details?.action !== 'none';

    if (isValidCapture) {
      console.log(`[Webhook Pipeline] 📦 Capture extracted:`, JSON.stringify(capturedData));

      const defaultType =
        business.category === 'salon' || business.category === 'clinic' || business.category === 'hospital'
          ? 'booking'
          : business.category === 'tuition' ||
            business.category === 'real_estate' ||
            business.category === 'ca_firm'
          ? 'lead'
          : 'order';

      await saveCapturedRecord(business.id, capturedData.type || defaultType, customerNumber, details);
    } else {
      console.log(`[Webhook Pipeline] ℹ️ General inquiry — no ledger record created.`);
    }
  }

  const sendResult = await sendMessage(customerNumber, business.whatsapp_number, replyText);

  if (!sendResult.success) {
    console.error(`[Webhook Pipeline] ❌ Reply to ${customerNumber} was NOT delivered: ${sendResult.error}`);
  }

  await saveConversationMessage(business.id, customerNumber, 'outbound', replyText);
  console.log(`[Webhook Pipeline] ✅ Processed message for "${business.name}".\n`);
}

/** Re-exported so callers can gate outbound sends without a second import. */
export { hasOptedOut };
