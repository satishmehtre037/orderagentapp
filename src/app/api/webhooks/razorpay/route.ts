import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const adminSupabase = createClient(supabaseUrl, serviceKey);

export async function POST(req: Request) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'bizbot_webhook_secret_999';
    const signature = req.headers.get('x-razorpay-signature');
    const rawBody = await req.text();

    if (!signature) {
      return NextResponse.json({ error: 'Missing x-razorpay-signature header' }, { status: 400 });
    }

    // Verify webhook HMAC-SHA256 signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.warn('[Razorpay Webhook] ❌ Signature mismatch');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    console.log(`[Razorpay Webhook] 🔔 Received event: ${event}`);

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload.payload?.payment?.entity;
      const notes = paymentEntity?.notes || {};
      const businessId = notes.business_id;
      const paymentId = paymentEntity?.id;
      const amountPaise = paymentEntity?.amount || 100;

      console.log(`[Razorpay Webhook] Processing successful payment ${paymentId} for business ${businessId}`);

      if (businessId) {
        // 1. Activate Business Subscription
        await adminSupabase
          .from('businesses')
          .update({
            subscription_status: 'active',
            plan: amountPaise >= 1000 ? 'annual' : 'monthly',
          })
          .eq('id', businessId);

        // 2. Log in payment_events
        await adminSupabase.from('payment_events').insert({
          business_id: businessId,
          event_type: 'subscription_payment',
          amount_paise: amountPaise,
          currency: paymentEntity?.currency || 'INR',
          status: 'success',
          razorpay_payment_id: paymentId,
          razorpay_order_id: paymentEntity?.order_id,
          payload: paymentEntity,
        });
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (err: any) {
    console.error('[Razorpay Webhook Exception]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
