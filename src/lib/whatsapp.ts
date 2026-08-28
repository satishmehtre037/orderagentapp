import { ENV } from '@/config/env';
import {
  sendMessage,
  sendInteractiveButtonsMessage,
  sendMediaMessage,
  type SendResult,
} from '@/services/whatsappService';

/**
 * Thin helpers over whatsappService.
 *
 * The `businessNumber` parameter used to default to the literal '919876543210',
 * a placeholder number that was neither the operator's nor any tenant's. It now
 * defaults to WHATSAPP_BUSINESS_NUMBER.
 */

export type { SendResult };

export async function sendWhatsAppTextMessage(
  toNumber: string,
  message: string,
  businessNumber: string = ENV.WHATSAPP_BUSINESS_NUMBER
): Promise<SendResult> {
  return sendMessage(toNumber, businessNumber, message);
}

export async function sendWhatsAppInteractiveButtons(
  toNumber: string,
  bodyText: string,
  buttons: Array<{ id: string; title: string }>,
  businessNumber: string = ENV.WHATSAPP_BUSINESS_NUMBER
): Promise<SendResult> {
  return sendInteractiveButtonsMessage(toNumber, businessNumber, bodyText, buttons);
}

/** Sends a real attachment (document or image), not a text message with a URL in it. */
export async function sendWhatsAppMediaMessage(
  toNumber: string,
  mediaUrl: string,
  caption?: string,
  options: { filename?: string; type?: 'document' | 'image' } = {}
): Promise<SendResult> {
  return sendMediaMessage(toNumber, mediaUrl, { caption, ...options });
}
