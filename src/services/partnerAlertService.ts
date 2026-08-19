import { sendWhatsAppMessage } from './whatsappService';

export interface PartnerAlertOptions {
  type: 'hot_lead' | 'compliance_overdue' | 'doc_escalation' | 'invoice_overdue' | 'system_error';
  title: string;
  details: Record<string, any>;
  rawMessage?: string;
}

/**
 * Dispatches high-priority alerts to the CA Partner via Telegram or WhatsApp
 */
export async function sendPartnerAlert(alert: PartnerAlertOptions): Promise<boolean> {
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_PARTNER_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_PARTNER_CHAT_ID;
  const adminWhatsAppNumber = process.env.ADMIN_WHATSAPP_NUMBER || process.env.PARTNER_WHATSAPP_NUMBER;

  const formattedDetails = Object.entries(alert.details)
    .filter(([_, val]) => val !== undefined && val !== null && val !== '')
    .map(([key, val]) => `*${key.replace(/_/g, ' ').toUpperCase()}:* ${val}`)
    .join('\n');

  const messageText = alert.rawMessage || `🚨 *${alert.title}*\n\n${formattedDetails}\n\n_Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}_`;

  let sent = false;

  // 1. Try Telegram if credentials exist
  if (telegramBotToken && telegramChatId) {
    try {
      const tgRes = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: messageText,
          parse_mode: 'Markdown',
        }),
      });

      if (tgRes.ok) {
        console.log(`[PartnerAlert] Telegram alert dispatched successfully: ${alert.title}`);
        sent = true;
      } else {
        const errText = await tgRes.text();
        console.warn(`[PartnerAlert] Telegram alert failed (${tgRes.status}):`, errText);
      }
    } catch (tgErr: any) {
      console.error('[PartnerAlert] Telegram API error:', tgErr.message);
    }
  }

  // 2. Fallback to WhatsApp Admin alert if Telegram not configured or failed
  if (!sent && adminWhatsAppNumber) {
    try {
      await sendWhatsAppMessage(adminWhatsAppNumber, messageText);
      console.log(`[PartnerAlert] WhatsApp fallback alert sent to partner: ${adminWhatsAppNumber}`);
      sent = true;
    } catch (waErr: any) {
      console.error('[PartnerAlert] WhatsApp alert failed:', waErr.message);
    }
  }

  if (!sent) {
    console.log(`[PartnerAlert Logged (No webhook target configured)]: ${alert.title}\n${messageText}`);
  }

  return sent;
}
