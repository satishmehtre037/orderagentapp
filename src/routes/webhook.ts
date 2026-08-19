import { Router, Request, Response } from 'express';
import { ENV } from '../config/env';
import { supabase } from '../config/supabase';
import {
  getBusinessByWhatsappNumber,
  getBusinessConfigs,
  saveConversationMessage,
  getRecentConversations,
  saveCapturedRecord,
  cancelOrdersForCustomer,
  cancelLatestOrderForCustomer,
} from '../services/businessService';
import { buildSystemPrompt } from '../services/promptBuilder';
import { getResponse, extractStructuredCapture } from '../services/groqService';
import { sendMessage } from '../services/whatsappService';
import { downloadWhatsAppMedia, transcribeAudioWithGroq } from '../services/whisperService';
import {
  findCAClient,
  handleCAClientQuery,
  processIncomingDocument,
  handleCALeadInquiry,
} from '../services/caService';

const router = Router();

/**
 * 1. Meta Webhook Verification Endpoint (GET /webhook)
 */
router.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log(`\n======================================================`);
  console.log(`[Webhook Verification] Incoming Meta GET Request`);
  console.log(`[Webhook Verification] hub.mode        : ${mode}`);
  console.log(`[Webhook Verification] hub.verify_token: "${token}"`);
  console.log(`[Webhook Verification] hub.challenge   : "${challenge}"`);
  console.log(`======================================================\n`);

  if (mode === 'subscribe' && challenge) {
    console.log('[Webhook Verification] ✅ Responding 200 OK with plain text challenge:', challenge);
    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).send(String(challenge));
  }

  console.warn('[Webhook Verification Failed] Invalid mode or missing challenge.');
  return res.sendStatus(403);
});

/**
 * 2. Meta WhatsApp Inbound Message Handler (POST /webhook)
 */
router.post('/webhook', async (req: Request, res: Response) => {
  // Always return 200 OK immediately to Meta to prevent retry storms
  res.status(200).send('EVENT_RECEIVED');

  try {
    const body = req.body;

    if (body.object !== 'whatsapp_business_account') {
      return;
    }

    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];
    const contactProfile = value?.contacts?.[0];

    if (!message) {
      return;
    }

    const businessNumber = value.metadata?.display_phone_number || '';
    const customerNumber = message.from;
    let messageText = '';
    let isVoiceNote = false;
    let isMediaDocument = false;
    let mediaPayload: { mediaId?: string; mimeType?: string; filename?: string } = {};

    // Handle Text Messages vs WhatsApp Voice Notes vs Documents/Images
    if (message.type === 'text') {
      messageText = message.text?.body || '';
    } else if (message.type === 'audio' || message.type === 'voice') {
      const audioObj = message.audio || message.voice;
      const mediaId = audioObj?.id;

      if (!mediaId) {
        console.warn('[Webhook] ⚠️ Audio message missing media ID. Skipping.');
        return;
      }

      console.log(`\n[Webhook] 🎙️ Processing incoming WhatsApp Voice Note (Media ID: ${mediaId})...`);
      try {
        const { buffer } = await downloadWhatsAppMedia(mediaId);
        const transcribedText = await transcribeAudioWithGroq(buffer, 'voicenote.ogg');
        messageText = transcribedText;
        isVoiceNote = true;
        console.log(`[Webhook] 🎙️ Transcribed Voice Note: "${messageText}"`);
      } catch (voiceErr: any) {
        console.error('[Webhook Voice Error] Failed to transcribe voice note:', voiceErr);
        const failText = "🙏 Sorry, I couldn't clearly hear your voice note. Could you please send it again or type your message?";
        await sendMessage(customerNumber, businessNumber, failText);
        return;
      }
    } else if (message.type === 'document' || message.type === 'image') {
      isMediaDocument = true;
      const mediaObj = message.document || message.image;
      mediaPayload = {
        mediaId: mediaObj?.id,
        mimeType: mediaObj?.mime_type,
        filename: mediaObj?.filename || (message.type === 'image' ? 'photo.jpg' : 'document.pdf'),
      };
      messageText = mediaObj?.caption || `[Attached ${message.type === 'image' ? 'Image' : 'Document'}: ${mediaPayload.filename}]`;
    } else {
      console.log(`[Webhook] Ignored non-text/non-audio/non-media message type: ${message.type}`);
      return;
    }

    if (!messageText.trim() && !isMediaDocument) {
      return;
    }

    console.log(`\n======================================================`);
    console.log(`[Webhook] 📥 INCOMING MESSAGE RECEIVED ${isVoiceNote ? '(🎙️ Voice Note)' : isMediaDocument ? '(📄 Document/Image)' : '(💬 Text)'}`);
    console.log(`[Webhook] Business Number: ${businessNumber}`);
    console.log(`[Webhook] Customer Number: ${customerNumber}`);
    console.log(`[Webhook] Message Content: "${messageText}"`);
    console.log(`======================================================`);

    // 1. Business lookup by WhatsApp Phone Number (with guaranteed fallback)
    let business = await getBusinessByWhatsappNumber(businessNumber);

    if (!business) {
      console.log(`[Webhook Pipeline] ⚠️ No business found for number: ${businessNumber}. Ignoring.`);
      return;
    }

    console.log(`[Webhook Pipeline] ✅ Using business: "${business.name}" (${business.id}) [Category: ${business.category}]`);

    // 2. CHECK SUBSCRIPTION & PAUSE STATUS GUARD
    const configs = await getBusinessConfigs(business.id);
    const isBotPaused = configs.some(
      (c) => c.config_key === 'bot_paused' && (c.config_value === true || c.config_value === 'true')
    );

    if (isBotPaused) {
      console.log(
        `[Webhook Pipeline] ⏸️ Business "${business.name}" AI Agent is PAUSED by store owner. Saving message to ledger and skipping AI processing.`
      );
      await saveConversationMessage(business.id, customerNumber, 'inbound', messageText);
      return;
    }

    const isTrialExpired =
      business.subscription_status === 'expired' ||
      (business.subscription_status === 'trial' &&
        business.trial_end_date &&
        new Date(business.trial_end_date).getTime() < Date.now());

    if (isTrialExpired) {
      console.warn(
        `[Webhook Pipeline] ⚠️ Business "${business.name}" (${business.id}) trial EXPIRED (End Date: ${business.trial_end_date}). AI Agent is paused.`
      );

      await saveConversationMessage(business.id, customerNumber, 'inbound', messageText);
      const unavailableNotice =
        `⚠️ *${business.name} Support Notice*\nOur automated AI assistant trial period has ended. Please contact our store team directly or visit your owner dashboard to renew the subscription plan (₹1/month) and resume instant AI replies.`;
      await sendMessage(customerNumber, business.whatsapp_number, unavailableNotice);
      await saveConversationMessage(business.id, customerNumber, 'outbound', unavailableNotice);
      return;
    }

    // --------------------------------------------------------------------------
    // 3. CA FIRM AUTOMATION SUITE ROUTER (Branch 1 from n8n)
    // --------------------------------------------------------------------------
    if (business.category === 'ca_firm') {
      const messageToSave = isMediaDocument ? `📄 [Document Upload]: ${mediaPayload.filename}` : isVoiceNote ? `🎙️ [Voice Note]: ${messageText}` : messageText;
      await saveConversationMessage(business.id, customerNumber, 'inbound', messageToSave);

      // Check if sender is a registered CA Client
      let caClient = await findCAClient({ phone: customerNumber, businessId: business.id });

      if (isMediaDocument) {
        if (!caClient) {
          // Auto create client record for incoming document upload
          const senderName = contactProfile?.profile?.name || `Client (${customerNumber.slice(-4)})`;
          try {
            const { data: newClient } = await supabase
              .from('ca_clients')
              .insert({
                business_id: business.id,
                client_name: senderName,
                phone: customerNumber,
                entity_type: 'Proprietorship',
              })
              .select()
              .single();

            caClient = newClient || ({
              business_id: business.id,
              client_name: senderName,
              phone: customerNumber,
              entity_type: 'Proprietorship',
            } as any);
          } catch (err: any) {
            caClient = {
              business_id: business.id,
              client_name: senderName,
              phone: customerNumber,
              entity_type: 'Proprietorship',
            } as any;
          }
        }

        const docRes = await processIncomingDocument(caClient!, mediaPayload, business.name);
        await sendMessage(customerNumber, business.whatsapp_number, docRes.text);
        await saveConversationMessage(business.id, customerNumber, 'outbound', docRes.text);
        return;
      }

      if (caClient) {
        // Known client + text -> AI Support Agent with live compliance calendar & document context
        const supportReply = await handleCAClientQuery(caClient, messageText, 'whatsapp', business.name);
        await sendMessage(customerNumber, business.whatsapp_number, supportReply);
        await saveConversationMessage(business.id, customerNumber, 'outbound', supportReply);
        return;
      } else {
        // Unknown sender -> Lead Qualification Agent & Classification
        const leadRes = await handleCALeadInquiry(
          customerNumber,
          messageText,
          contactProfile?.profile?.name,
          'WhatsApp',
          business.id,
          business.name
        );
        await sendMessage(customerNumber, business.whatsapp_number, leadRes.replyText);
        await saveConversationMessage(business.id, customerNumber, 'outbound', leadRes.replyText);
        return;
      }
    }

    // 3. Save incoming message to database (Standard category pipeline)
    const messageToSave = isVoiceNote ? `🎙️ [Voice Note]: ${messageText}` : messageText;
    await saveConversationMessage(business.id, customerNumber, 'inbound', messageToSave);

    // 4. Fetch past conversation history (last 4 messages to avoid stale context loops)
    const history = await getRecentConversations(business.id, customerNumber, 4);

    // 5. Build hydrated system prompt using Prompt Builder
    let systemPrompt = '';
    try {
      systemPrompt = await buildSystemPrompt(business.id);
    } catch (pErr) {
      console.warn('[Webhook Pipeline Warning] Prompt builder fallback:', pErr);
      systemPrompt = `You are a helpful customer service assistant for ${business.name}.`;
    }

    // 6. Generate response from Groq Llama AI
    const aiResponseText = await getResponse(systemPrompt, history, messageText, business, configs);

    // Robust JSON extraction and stripping
    let replyText = aiResponseText;
    let capturedData: any = null;

    // Method 1: Look for markdown code fence ```json ... ```
    const codeBlockMatch = replyText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i);
    if (codeBlockMatch) {
      try {
        const parsed = JSON.parse(codeBlockMatch[1]);
        capturedData = parsed.capture || parsed;
        replyText = replyText.replace(codeBlockMatch[0], '').trim();
      } catch (_) {}
    }

    // Method 2: Find outermost JSON block { ... } containing "capture", "type", or "items"
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
          // If first parse failed, check starting at "capture" keyword
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

    // Method 3: Fallback secondary AI Intent analysis if not detected yet
    if (!capturedData) {
      const fullHistory = [...history, { sender: 'inbound', message: messageText } as any];
      capturedData = await extractStructuredCapture(fullHistory, business.category);
    }

    // Extra safety: strip any stray JSON artifacts before sending to customer
    replyText = replyText.replace(/\{[\s\S]*?"(?:type|capture|details|items)"[\s\S]*?\}/g, '').trim();

    // Check for Cancellation Intent
    const isCancelIntent =
      /\b(cancel|cancle|discard|abort)\b/i.test(messageText) ||
      capturedData?.action === 'cancel' ||
      capturedData?.status === 'cancelled';

    if (isCancelIntent) {
      const isCancelAll =
        /\b(all|everything|both|entire|orders)\b/i.test(messageText) ||
        capturedData?.all === true ||
        capturedData?.cancel_all === true;

      console.log(`[Webhook Pipeline] ❌ Cancellation intent (all: ${isCancelAll}) detected for customer ${customerNumber}`);
      await cancelOrdersForCustomer(business.id, customerNumber, isCancelAll);
    } else if (capturedData) {
      // 7. Validate that this is an ACTUAL confirmed order/booking with real items/services
      const details = capturedData.details || capturedData;
      const items = Array.isArray(details?.items)
        ? details.items
        : typeof details?.items === 'string'
        ? [{ name: details.items }]
        : [];

      // Check if items contain real service/product names (rejecting greetings, inquiries, placeholders)
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

      const hasAppointmentDetails = Boolean(details?.appointment_time || details?.slot || details?.date || details?.time);
      const isValidCapture =
        (hasValidItems || hasAppointmentDetails) &&
        details?.confirmed !== false &&
        details?.action !== 'none';

      if (isValidCapture) {
        console.log(`[Webhook Pipeline] 📦 Confirmed order/booking payload extracted:`);
        console.log(JSON.stringify(capturedData, null, 2));

        const defaultType =
          business.category === 'salon'
            ? 'booking'
            : business.category === 'tuition'
            ? 'lead'
            : 'order';
        const captureType = capturedData.type || defaultType;

        await saveCapturedRecord(
          business.id,
          captureType,
          customerNumber,
          details
        );
      } else {
        console.log(`[Webhook Pipeline] ℹ️ Casual greeting or general inquiry from customer. Not creating a ledger order.`);
      }
    }

    // 8. Send response message back to customer via WhatsApp Cloud API
    await sendMessage(customerNumber, business.whatsapp_number, replyText);

    // 9. Save AI outbound message to database
    await saveConversationMessage(business.id, customerNumber, 'outbound', replyText);

    console.log(`[Webhook Pipeline] ✅ Processed message for business "${business.name}" successfully.\n`);
  } catch (err: any) {
    console.error('[Webhook Pipeline Exception]:', err.message || err);
  }
});

export default router;
