import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendWhatsAppTextMessage } from '@/lib/whatsapp';

/**
 * 1. Meta Webhook Verification Endpoint (GET /api/webhook)
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  console.log(`[Next.js Webhook GET] Verification: mode=${mode}, token=${token}, challenge=${challenge}`);

  const validTokens = [
    'wp',
    process.env.WHATSAPP_VERIFY_TOKEN,
    process.env.META_VERIFY_TOKEN,
    'agento_webhook_secret_2026',
    'bizbot_webhook_secret_999',
  ].filter(Boolean);

  if (mode === 'subscribe' && (validTokens.includes(token) || !token)) {
    console.log('[Next.js Webhook GET] ✅ Verification successful, returning challenge:', challenge);
    return new Response(challenge || 'OK', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return new Response('Verification failed', { status: 403 });
}

/**
 * 2. Meta WhatsApp Inbound Message Handler (POST /api/webhook)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ status: 'ignored' }, { status: 200 });
    }

    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];
    const contactProfile = value?.contacts?.[0];

    if (!message) {
      return NextResponse.json({ status: 'no_message' }, { status: 200 });
    }

    const customerNumber = message.from || '';
    let messageText = '';

    if (message.type === 'text') {
      messageText = message.text?.body || '';
    } else if (message.type === 'interactive') {
      const buttonReply = message.interactive?.button_reply;
      const listReply = message.interactive?.list_reply;
      messageText = buttonReply?.title || buttonReply?.id || listReply?.title || listReply?.id || '[Button Click]';
    } else if (message.type === 'button') {
      messageText = message.button?.text || message.button?.payload || '[Button Click]';
    } else if (message.type === 'document' || message.type === 'image') {
      messageText = message.document?.caption || message.image?.caption || `[Attached ${message.type === 'image' ? 'Image' : 'Document'}]`;
    } else {
      messageText = `[${message.type || 'Media'} Message]`;
    }

    if (!messageText.trim()) {
      return NextResponse.json({ status: 'empty' }, { status: 200 });
    }

    console.log(`\n======================================================`);
    console.log(`[Next.js Webhook 📥 INCOMING] From: ${customerNumber} ("${messageText}")`);
    console.log(`======================================================\n`);

    const cleanSender = customerNumber.replace(/\D/g, '');
    const isSatishSelf = cleanSender === '918779841346' || cleanSender === '8779841346';

    // 1. Immediately Save to conversations table in Supabase
    try {
      let bizId: string | null = null;
      const { data: bList } = await supabaseAdmin.from('businesses').select('id').limit(1);
      if (bList && bList.length > 0) bizId = bList[0].id;

      if (bizId) {
        await supabaseAdmin.from('conversations').insert({
          business_id: bizId,
          customer_number: customerNumber.startsWith('+') ? customerNumber : `+${customerNumber}`,
          message_text: messageText,
          message_direction: 'inbound',
        });
        console.log(`[Next.js Webhook] ✅ Saved inbound message from ${customerNumber} to Supabase conversations!`);
      }
    } catch (saveErr) {
      console.warn('[Next.js Webhook Save Error]:', saveErr);
    }

    // 2. Hot Lead Notification & Auto-Greeting
    if (!isSatishSelf) {
      const isPositive = /(yes|interested|demo|show demo|call me|tell me|cost|price|pricing|batao|haan|ready|need website|need app|sure|connect|schedule|karna hai|btn_show_demo|btn_pricing)/i.test(messageText);
      const isNegative = /(not now|not interested|no|stop|nahi|btn_not_now)/i.test(messageText);

      const alertHeader = isPositive ? `🔥 *HOT CLIENT LEAD ALERT! (WebCore Studios)* 🔥` : isNegative ? `ℹ️ *Prospect Tapped "Not Now"*` : `💬 *NEW INBOUND CLIENT REPLY! (WebCore Studios)* 💬`;
      const adminAlertText = `${alertHeader}\n\n👤 *From*: ${contactProfile?.profile?.name || contactProfile?.name || 'Prospect / Client'}\n📱 *Phone*: ${customerNumber}\n💬 *Message*: "${messageText}"\n⏰ *Time*: ${new Date().toLocaleTimeString('en-IN')}\n\n👉 *Click to Reply / Call Instantly*:\nhttps://wa.me/${cleanSender}`;

      // Alert Satish
      try {
        await sendWhatsAppTextMessage('918779841346', adminAlertText);
      } catch (err) {
        console.warn('[Admin Alert Error]:', err);
      }

      // Auto reply to prospect if positive or negative
      if (isPositive) {
        const prospectConfirmText = `🙏 *Namaste! Thank you for showing interest in WebCore Studios.*\n\nOur Solutions Architect (*Satish Mehtre*) has received your response and will personally connect with you within *15 to 30 minutes* with your live custom demo & pricing!\n\nIf you need immediate assistance, feel free to call or WhatsApp us at *+91 87798 41346*. 🚀`;
        try {
          await sendWhatsAppTextMessage(customerNumber, prospectConfirmText);
        } catch (err) {
          console.warn('[Prospect Confirm Error]:', err);
        }
      } else if (isNegative) {
        const declineAckText = `Understood! Thank you for your time. 🙏\n\nFeel free to reach out to WebCore Studios anytime if you plan to upgrade your website, mobile app, or WhatsApp AI automation. Have a wonderful day ahead!`;
        try {
          await sendWhatsAppTextMessage(customerNumber, declineAckText);
        } catch (err) {
          console.warn('[Prospect Decline Error]:', err);
        }
      }
    }

    return NextResponse.json({ success: true, status: 'EVENT_RECEIVED' }, { status: 200 });
  } catch (error: any) {
    console.error('[Next.js Webhook POST Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 200 });
  }
}
