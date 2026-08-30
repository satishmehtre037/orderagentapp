import { NextResponse } from 'next/server';
import { sendMessage } from '@/services/whatsappService';
import { saveConversationMessage } from '@/services/businessService';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { businessId, to, message, customerNumber } = body;

    const recipient = to || customerNumber || body.customer_number;
    if (!recipient || !message) {
      return NextResponse.json({ error: 'Missing recipient phone number or message' }, { status: 400 });
    }

    const cleanPhone = String(recipient).replace(/\D/g, '');
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    console.log(`[API WhatsApp Send] 📲 Dispatching message to ${formattedPhone}...`);
    const sendResult = await sendMessage(formattedPhone, '', message);

    if (businessId) {
      await saveConversationMessage(businessId, formattedPhone, 'outbound', message);
    }

    return NextResponse.json({ success: true, result: sendResult });
  } catch (err: any) {
    console.error('[API WhatsApp Send Exception]:', err);
    return NextResponse.json({ error: err.message || 'Failed to send WhatsApp message' }, { status: 500 });
  }
}
