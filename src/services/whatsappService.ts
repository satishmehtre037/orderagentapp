import { ENV } from '../config/env';

const GRAPH_VERSION = 'v20.0';

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  /** True when the send was skipped because credentials are not configured. */
  notConfigured?: boolean;
}

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

function credentials(): { token: string; phoneNumberId: string } | null {
  const token = ENV.WHATSAPP_CLOUD_API_TOKEN || process.env.WHATSAPP_CLOUD_API_TOKEN || '';
  const phoneNumberId = ENV.WHATSAPP_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  if (!token || !phoneNumberId) return null;
  return { token, phoneNumberId };
}

async function postToGraph(payload: Record<string, any>, label: string): Promise<SendResult> {
  const creds = credentials();

  if (!creds) {
    // Previously this logged "[Mock] Would send ..." and returned as if nothing
    // was wrong, so a misconfigured deployment looked healthy while silently
    // delivering nothing. Callers now get an explicit failure.
    const error = 'WHATSAPP_CLOUD_API_TOKEN / WHATSAPP_PHONE_NUMBER_ID are not configured — message NOT sent.';
    console.error(`[WhatsApp Service] ❌ ${label}: ${error}`);
    return { success: false, error, notConfigured: true };
  }

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${creds.phoneNumberId}/messages`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${creds.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as any;

    if (!res.ok) {
      const error = data?.error?.message || `Meta API returned ${res.status}`;
      console.error(`[WhatsApp Service] ❌ ${label} failed: ${error}`);
      return { success: false, error };
    }

    const messageId = data?.messages?.[0]?.id;
    console.log(`[WhatsApp Service] ✅ ${label} delivered to ${payload.to} (${messageId || 'OK'})`);
    return { success: true, messageId };
  } catch (err: any) {
    const error = err?.message || String(err);
    console.error(`[WhatsApp Service] ❌ ${label} network error: ${error}`);
    return { success: false, error };
  }
}

/**
 * Sends a text message to a customer via Meta WhatsApp Cloud API.
 *
 * `businessWhatsappNumber` is informational (used for logging and for choosing
 * a sender in a future multi-number setup); the actual sender is
 * WHATSAPP_PHONE_NUMBER_ID.
 */
export async function sendMessage(
  toNumber: string,
  businessWhatsappNumber: string,
  message: string
): Promise<SendResult> {
  const formattedMessage = formatWhatsAppMessage(message);
  let cleanToNumber = (toNumber || '').replace(/\D/g, '');

  if (!cleanToNumber) {
    return { success: false, error: 'No recipient number supplied.' };
  }

  // Normalize 10-digit Indian numbers to E.164 standard with 91 prefix
  if (cleanToNumber.length === 10) {
    cleanToNumber = `91${cleanToNumber}`;
  }

  return postToGraph(
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanToNumber,
      type: 'text',
      text: { preview_url: false, body: formattedMessage },
    },
    `text→${cleanToNumber}`
  );
}

/**
 * Sends an Interactive Button message (up to 3 quick reply buttons).
 * Falls back to a plain text message if Meta rejects the interactive payload.
 */
export async function sendInteractiveButtonsMessage(
  toNumber: string,
  businessWhatsappNumber: string,
  bodyText: string,
  buttons: Array<{ id: string; title: string }>
): Promise<SendResult> {
  const formattedMessage = formatWhatsAppMessage(bodyText);
  let cleanToNumber = (toNumber || '').replace(/\D/g, '');

  if (!cleanToNumber) {
    return { success: false, error: 'No recipient number supplied.' };
  }

  if (cleanToNumber.length === 10) {
    cleanToNumber = `91${cleanToNumber}`;
  }

  // Meta limits: max 3 buttons, title max 20 chars, body max 1024 chars.
  const validButtons = buttons.slice(0, 3).map((btn) => ({
    type: 'reply',
    reply: { id: btn.id.slice(0, 256), title: btn.title.slice(0, 20) },
  }));

  const trimmedBody = formattedMessage.length > 1000 ? formattedMessage.slice(0, 990) + '...' : formattedMessage;

  const result = await postToGraph(
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanToNumber,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: trimmedBody },
        action: { buttons: validButtons },
      },
    },
    `buttons→${cleanToNumber}`
  );

  if (result.success || result.notConfigured) return result;

  // Interactive messages can be rejected for template/policy reasons that plain
  // text is not. Retry once as text so the pitch still lands.
  console.warn(`[WhatsApp Service] Retrying ${cleanToNumber} as plain text after interactive rejection.`);
  return sendMessage(toNumber, businessWhatsappNumber, formattedMessage);
}

/**
 * Sends a real document or image message.
 *
 * The previous helper only appended "📄 Download: <url>" to a text message, so
 * lab reports and invoices arrived as bare links instead of attachments.
 */
export async function sendMediaMessage(
  toNumber: string,
  mediaUrl: string,
  options: { caption?: string; filename?: string; type?: 'document' | 'image' } = {}
): Promise<SendResult> {
  let cleanToNumber = (toNumber || '').replace(/\D/g, '');
  if (!cleanToNumber) return { success: false, error: 'No recipient number supplied.' };
  if (!mediaUrl) return { success: false, error: 'No media URL supplied.' };

  if (cleanToNumber.length === 10) {
    cleanToNumber = `91${cleanToNumber}`;
  }

  const inferredType =
    options.type || (/\.(png|jpe?g|webp)(\?|$)/i.test(mediaUrl) ? 'image' : 'document');

  const media: Record<string, any> = { link: mediaUrl };
  if (options.caption) media.caption = options.caption.slice(0, 1024);
  if (inferredType === 'document') {
    media.filename = options.filename || mediaUrl.split('/').pop()?.split('?')[0] || 'document.pdf';
  }

  const result = await postToGraph(
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanToNumber,
      type: inferredType,
      [inferredType]: media,
    },
    `${inferredType}→${cleanToNumber}`
  );

  if (result.success || result.notConfigured) return result;

  // Meta refuses links it cannot fetch (private buckets, expired signed URLs).
  // Send the link as text so the recipient is not left with nothing.
  console.warn(`[WhatsApp Service] Media send rejected; falling back to a link for ${cleanToNumber}.`);
  const fallback = options.caption ? `${options.caption}\n\n📄 ${mediaUrl}` : `📄 ${mediaUrl}`;
  return sendMessage(toNumber, '', fallback);
}

/**
 * Convenient shorthand for sending messages without explicitly supplying business number
 */
export async function sendWhatsAppMessage(
  toNumber: string,
  message: string,
  businessWhatsappNumber = ENV.WHATSAPP_BUSINESS_NUMBER
): Promise<SendResult> {
  return sendMessage(toNumber, businessWhatsappNumber, message);
}
