"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessage = sendMessage;
const env_js_1 = require("../config/env.js");
/**
 * Sends a text message to a customer via Meta WhatsApp Cloud API
 */
async function sendMessage(toNumber, businessWhatsappNumber, message) {
    console.log(`[WhatsApp Service] Sending reply to ${toNumber} (Business: ${businessWhatsappNumber})`);
    const token = env_js_1.ENV.WHATSAPP_CLOUD_API_TOKEN;
    const phoneNumberId = env_js_1.ENV.WHATSAPP_PHONE_NUMBER_ID;
    if (!token || !phoneNumberId) {
        console.warn(`[WhatsApp Service Warning] WHATSAPP_CLOUD_API_TOKEN or WHATSAPP_PHONE_NUMBER_ID missing in .env.`);
        console.log(`[WhatsApp Service Mock] Would send to ${toNumber}:\n${message}`);
        return;
    }
    const cleanToNumber = toNumber.replace(/\D/g, '');
    const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
    const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanToNumber,
        type: 'text',
        text: {
            preview_url: false,
            body: message,
        },
    };
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        const data = (await res.json());
        if (!res.ok) {
            console.error(`[WhatsApp Service Error] Meta API responded with status ${res.status}:`, data);
        }
        else {
            console.log(`[WhatsApp Service] Message successfully delivered to ${cleanToNumber}. Response ID:`, data?.messages?.[0]?.id || 'OK');
        }
    }
    catch (error) {
        console.error(`[WhatsApp Service Error] Network/API error sending message:`, error?.message || error);
    }
}
