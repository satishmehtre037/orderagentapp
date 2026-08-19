import { ENV } from '../config/env';

/**
 * Cleans and formats markdown text for WhatsApp compatibility
 */
export function formatWhatsAppMessage(text: string): string {
  return text
    // Strip markdown code blocks ```json ... ```
    .replace(/```(?:json)?[\s\S]*?```/gi, '')
    // Strip raw capture JSON blocks { "capture": ... } or { "type": ... }
    .replace(/\{[\s\S]*?"(?:type|capture|details|items)"[\s\S]*?\}/gi, '')
    // Replace bullet asterisk combinations (* *item* or * item) with clean bullet points (• item)
    .replace(/^[\s]*\*\s+\*([^*]+)\*/gm, '• *$1*')
    .replace(/^[\s]*\*\s+/gm, '• ')
    // Convert markdown bold **text** to WhatsApp bold *text*
    .replace(/\*\*([^*]+)\*\*/g, '*$1*')
    // Remove excessive empty lines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Sends a text message to a customer via Meta WhatsApp Cloud API
 */
export async function sendMessage(
  toNumber: string,
  businessWhatsappNumber: string,
  message: string
): Promise<void> {
  const formattedMessage = formatWhatsAppMessage(message);
  console.log(`[WhatsApp Service] Sending reply to ${toNumber} (Business: ${businessWhatsappNumber})`);

  const token = ENV.WHATSAPP_CLOUD_API_TOKEN || process.env.WHATSAPP_CLOUD_API_TOKEN;
  const phoneNumberId = ENV.WHATSAPP_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.warn(`[WhatsApp Service Warning] WHATSAPP_CLOUD_API_TOKEN or WHATSAPP_PHONE_NUMBER_ID missing in environment.`);
    console.log(`[WhatsApp Service Mock] Would send to ${toNumber}:\n${formattedMessage}`);
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
      body: formattedMessage,
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

    const data = (await res.json()) as any;

    if (!res.ok) {
      console.error(`[WhatsApp Service Error] Meta API responded with status ${res.status}:`, data);
    } else {
      console.log(`[WhatsApp Service] Message successfully delivered to ${cleanToNumber}. Response ID:`, data?.messages?.[0]?.id || 'OK');
    }
  } catch (error: any) {
    console.error(`[WhatsApp Service Error] Network/API error sending message:`, error?.message || error);
  }
}

/**
 * Sends an Interactive Button message via Meta WhatsApp Cloud API (up to 3 quick reply buttons)
 */
export async function sendInteractiveButtonsMessage(
  toNumber: string,
  businessWhatsappNumber: string,
  bodyText: string,
  buttons: Array<{ id: string; title: string }>
): Promise<boolean> {
  const formattedMessage = formatWhatsAppMessage(bodyText);
  const token = ENV.WHATSAPP_CLOUD_API_TOKEN || process.env.WHATSAPP_CLOUD_API_TOKEN;
  const phoneNumberId = ENV.WHATSAPP_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.warn(`[WhatsApp Service Warning] Credentials missing. Mocking buttons message.`);
    return false;
  }

  const cleanToNumber = toNumber.replace(/\D/g, '');
  const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

  // WhatsApp button title max length is 20 chars
  const validButtons = buttons.slice(0, 3).map((btn) => ({
    type: 'reply',
    reply: {
      id: btn.id.slice(0, 256),
      title: btn.title.slice(0, 20),
    },
  }));

  // Interactive body text max length is 1024 characters
  const trimmedBody = formattedMessage.length > 1000 ? formattedMessage.slice(0, 990) + '...' : formattedMessage;

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: cleanToNumber,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: {
        text: trimmedBody,
      },
      action: {
        buttons: validButtons,
      },
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

    const data = (await res.json()) as any;

    if (!res.ok) {
      console.warn(`[WhatsApp Interactive Button Notice] Falling back to text message. Meta status ${res.status}:`, data?.error?.message);
      await sendMessage(toNumber, businessWhatsappNumber, formattedMessage);
      return false;
    } else {
      console.log(`[WhatsApp Service] Interactive Button Message delivered to ${cleanToNumber}. Response ID:`, data?.messages?.[0]?.id || 'OK');
      return true;
    }
  } catch (error: any) {
    console.error(`[WhatsApp Service Error] Network error sending button message:`, error?.message || error);
    await sendMessage(toNumber, businessWhatsappNumber, formattedMessage);
    return false;
  }
}

/**
 * Convenient shorthand for sending messages without explicitly supplying business number
 */
export async function sendWhatsAppMessage(
  toNumber: string,
  message: string,
  businessWhatsappNumber = ''
): Promise<void> {
  return sendMessage(toNumber, businessWhatsappNumber, message);
}


