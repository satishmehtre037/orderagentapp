"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const env_js_1 = require("../config/env.js");
const businessService_js_1 = require("../services/businessService.js");
const promptBuilder_js_1 = require("../services/promptBuilder.js");
const claudeService_js_1 = require("../services/claudeService.js");
const whatsappService_js_1 = require("../services/whatsappService.js");
const router = (0, express_1.Router)();
/**
 * GET /webhook
 * Verification endpoint for Meta WhatsApp Cloud API
 */
router.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    console.log(`[Webhook Verification] Incoming challenge. Mode: ${mode}, Token: ${token}`);
    if (mode === 'subscribe' && token === env_js_1.ENV.WHATSAPP_VERIFY_TOKEN) {
        console.log(`[Webhook Verification] Token matched successfully! Responding with challenge.`);
        res.status(200).send(challenge);
    }
    else {
        console.warn(`[Webhook Verification Failed] Token mismatch or invalid mode.`);
        res.sendStatus(403);
    }
});
/**
 * POST /webhook
 * Receives incoming messages from Meta WhatsApp Cloud API
 */
router.post('/webhook', async (req, res) => {
    // Always return 200 OK immediately to Meta to acknowledge receipt
    res.status(200).send('EVENT_RECEIVED');
    try {
        const body = req.body;
        if (!body || body.object !== 'whatsapp_business_account') {
            return;
        }
        const entries = body.entry || [];
        for (const entry of entries) {
            const changes = entry.changes || [];
            for (const change of changes) {
                const value = change.value;
                if (!value || !value.messages || value.messages.length === 0) {
                    // Status updates (sent/delivered/read) - ignore for now
                    continue;
                }
                const message = value.messages[0];
                const metadata = value.metadata || {};
                const businessWhatsappNumber = metadata.display_phone_number || metadata.phone_number_id;
                const customerNumber = message.from;
                const messageText = message.text?.body;
                if (!messageText) {
                    console.log(`[Webhook] Received non-text message from ${customerNumber}. Skipping.`);
                    continue;
                }
                console.log(`\n======================================================`);
                console.log(`[Webhook] 📥 INCOMING MESSAGE RECEIVED`);
                console.log(`[Webhook] Business Number: ${businessWhatsappNumber}`);
                console.log(`[Webhook] Customer Number: ${customerNumber}`);
                console.log(`[Webhook] Message Text   : "${messageText}"`);
                console.log(`======================================================`);
                // Process message in pipeline
                await processIncomingMessage(businessWhatsappNumber, customerNumber, messageText);
            }
        }
    }
    catch (err) {
        console.error(`[Webhook Handler Error] Exception in webhook processing loop:`, err?.message || err);
    }
});
/**
 * Main execution pipeline for incoming WhatsApp messages
 */
async function processIncomingMessage(businessWhatsappNumber, customerNumber, messageText) {
    // 1. Identify business tenant
    const business = await (0, businessService_js_1.getBusinessByWhatsappNumber)(businessWhatsappNumber);
    if (!business) {
        console.warn(`[Webhook Pipeline] ⚠️ No registered business found for number: ${businessWhatsappNumber}. Ignoring.`);
        return;
    }
    // 2. Save incoming message to database
    await (0, businessService_js_1.saveConversationMessage)(business.id, customerNumber, 'inbound', messageText);
    // 3. Fetch past conversation history (last 10 messages)
    const history = await (0, businessService_js_1.getRecentConversations)(business.id, customerNumber, 10);
    // 4. Build dynamic category-aware system prompt
    const systemPrompt = await (0, promptBuilder_js_1.buildSystemPrompt)(business.id);
    // 5. Query Claude AI engine
    const fullClaudeResponse = await (0, claudeService_js_1.getResponse)(systemPrompt, history, messageText);
    // 6. Check for captured order/booking/lead JSON block
    const { cleanMessage, capture } = extractCaptureBlock(fullClaudeResponse);
    if (capture) {
        console.log(`[Webhook Pipeline] 🎯 Captured payload detected! Type: ${capture.type.toUpperCase()}`);
        await (0, businessService_js_1.saveCapturedRecord)(business.id, capture.type, customerNumber, capture.details);
    }
    // 7. Send final response to customer via Meta Cloud API
    await (0, whatsappService_js_1.sendMessage)(customerNumber, businessWhatsappNumber, cleanMessage);
    // 8. Save outbound message to database
    await (0, businessService_js_1.saveConversationMessage)(business.id, customerNumber, 'outbound', cleanMessage);
    console.log(`[Webhook Pipeline] ✅ Process complete for customer ${customerNumber}\n`);
}
/**
 * Parses and strips JSON capture blocks from Claude's response
 */
function extractCaptureBlock(rawResponse) {
    const jsonPattern = /\{"capture":\s*\{[\s\S]*?\}\}/g;
    const match = rawResponse.match(jsonPattern);
    if (!match) {
        return { cleanMessage: rawResponse.trim(), capture: null };
    }
    try {
        const jsonStr = match[0];
        const parsed = JSON.parse(jsonStr);
        if (parsed.capture && parsed.capture.type && parsed.capture.details) {
            const cleanMessage = rawResponse.replace(jsonStr, '').trim();
            return {
                cleanMessage,
                capture: {
                    type: parsed.capture.type,
                    details: parsed.capture.details,
                },
            };
        }
    }
    catch (e) {
        console.error(`[Capture Parser Error] Failed to parse capture JSON block:`, e);
    }
    return { cleanMessage: rawResponse.trim(), capture: null };
}
exports.default = router;
