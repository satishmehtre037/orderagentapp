import { Router, Request, Response } from 'express';
import { ENV } from '../config/env.js';
import {
  getBusinessByWhatsappNumber,
  saveConversationMessage,
  getRecentConversations,
  saveCapturedRecord,
  cancelOrdersForCustomer,
  cancelLatestOrderForCustomer,
} from '../services/businessService.js';
import { buildSystemPrompt } from '../services/promptBuilder.js';
import { getResponse, extractStructuredCapture } from '../services/groqService.js';
import { sendMessage } from '../services/whatsappService.js';

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

    if (!message || message.type !== 'text') {
      return;
    }

    const businessNumber = value.metadata?.display_phone_number || '';
    const customerNumber = message.from;
    const messageText = message.text?.body || '';

    console.log(`\n======================================================`);
    console.log(`[Webhook] 📥 INCOMING MESSAGE RECEIVED`);
    console.log(`[Webhook] Business Number: ${businessNumber}`);
    console.log(`[Webhook] Customer Number: ${customerNumber}`);
    console.log(`[Webhook] Message Text   : "${messageText}"`);
    console.log(`======================================================`);

    // 1. Business lookup by WhatsApp Phone Number (with guaranteed fallback)
    let business = await getBusinessByWhatsappNumber(businessNumber);

    if (!business) {
      console.log(`[Webhook Pipeline] ⚠️ No business found for number: ${businessNumber}. Ignoring.`);
      return;
    }

    console.log(`[Webhook Pipeline] ✅ Using business: "${business.name}" (${business.id})`);

    // 2. CHECK SUBSCRIPTION STATUS GUARD (Expired trial bypass check)
    const isTrialExpired =
      business.subscription_status === 'expired' ||
      (business.subscription_status === 'trial' &&
        business.trial_end_date &&
        new Date(business.trial_end_date).getTime() < Date.now());

    if (isTrialExpired) {
      console.warn(
        `[Webhook Pipeline] ⚠️ Business "${business.name}" (${business.id}) trial EXPIRED (End Date: ${business.trial_end_date}). AI Agent is paused.`
      );

      // Save inbound message
      await saveConversationMessage(business.id, customerNumber, 'inbound', messageText);

      // Send polite expiration notice to customer
      const unavailableNotice =
        `⚠️ *${business.name} Support Notice*\nOur automated AI assistant trial period has ended. Please contact our store team directly or visit your owner dashboard to renew the subscription plan (₹1/month) and resume instant AI replies.`;
      await sendMessage(customerNumber, business.whatsapp_number, unavailableNotice);

      // Save outbound notice
      await saveConversationMessage(business.id, customerNumber, 'outbound', unavailableNotice);
      return;
    }

    // 3. Save incoming message to database
    await saveConversationMessage(business.id, customerNumber, 'inbound', messageText);

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
    const aiResponseText = await getResponse(systemPrompt, history, messageText);

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
