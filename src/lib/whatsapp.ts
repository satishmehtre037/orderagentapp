import { sendMessage, sendInteractiveButtonsMessage } from '@/services/whatsappService';

export async function sendWhatsAppTextMessage(
  toNumber: string,
  message: string,
  businessNumber: string = '919876543210'
): Promise<void> {
  try {
    await sendMessage(toNumber, businessNumber, message);
  } catch (error) {
    console.error('[WhatsApp Helper Error]:', error);
  }
}

export async function sendWhatsAppInteractiveButtons(
  toNumber: string,
  bodyText: string,
  buttons: Array<{ id: string; title: string }>,
  businessNumber: string = '919876543210'
): Promise<boolean> {
  try {
    return await sendInteractiveButtonsMessage(toNumber, businessNumber, bodyText, buttons);
  } catch (error) {
    console.error('[WhatsApp Interactive Buttons Error]:', error);
    return false;
  }
}

export async function sendWhatsAppMediaMessage(
  toNumber: string,
  mediaUrl: string,
  caption?: string,
  businessNumber: string = '919876543210'
): Promise<void> {
  try {
    const fullMsg = caption ? `${caption}\n\n📄 Download: ${mediaUrl}` : `📄 File: ${mediaUrl}`;
    await sendMessage(toNumber, businessNumber, fullMsg);
  } catch (error) {
    console.error('[WhatsApp Media Helper Error]:', error);
  }
}
