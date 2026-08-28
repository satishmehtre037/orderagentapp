import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '@/config/supabase';
import { DEFAULT_PLAN_KEY, PLANS, accessEndDate, resolvePlan } from '@/config/plans';

/**
 * POST /api/webhooks/razorpay — Razorpay server-to-server webhook.
 *
 * Three things were wrong here:
 *
 *  1. The secret defaulted to the literal 'bizbot_webhook_secret_999'. With
 *     RAZORPAY_WEBHOOK_SECRET unset, anyone who had seen this file could sign
 *     their own payment.captured payload and activate any business_id for free.
 *     A missing secret is now a refusal.
 *  2. The plan was inferred as `amountPaise >= 1000 ? 'annual' : 'monthly'`.
 *     Now that the monthly plan is ₹999 (99900 paise) that test marks every
 *     monthly payment as annual. The plan comes from the order notes instead.
 *  3. It set subscription_status without moving trial_end_date, which is the
 *     date the paywall actually reads — so a paid business could still be
 *     treated as expired.
 */
export async function POST(req: Request) {
  try {
    const webhookSecret = (process.env.RAZORPAY_WEBHOOK_SECRET || '').trim();
    const signature = req.headers.get('x-razorpay-signature');
    const rawBody = await req.text();

    if (!webhookSecret) {
      console.error('[Razorpay Webhook] RAZORPAY_WEBHOOK_SECRET is not set — refusing unverifiable webhooks.');
      return NextResponse.json({ error: 'Webhook secret is not configured on this server.' }, { status: 503 });
    }
    if (!signature) {
      return NextResponse.json({ error: 'Missing x-razorpay-signature header' }, { status: 401 });
    }

    const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');

    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(signature, 'utf8');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      console.warn('[Razorpay Webhook] ❌ Signature mismatch — rejecting.');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    console.log(`[Razorpay Webhook] 🔔 Verified event: ${event}`);

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload.payload?.payment?.entity;
      const paymentId = paymentEntity?.id;

      if (!paymentId) {
        console.warn('[Razorpay Webhook] Event carried no payment entity.');
        return NextResponse.json({ status: 'ignored' });
      }

      const notes = paymentEntity?.notes || {};
      const businessId = notes.business_id;
      // No default: an absent amount is unknown, not ₹1.
      const amountPaise = typeof paymentEntity?.amount === 'number' ? paymentEntity.amount : null;
      const plan = resolvePlan(notes.plan) || PLANS[DEFAULT_PLAN_KEY];

      if (!businessId) {
        console.error(
          `[Razorpay Webhook] Payment ${paymentId} has no business_id in its notes — needs manual reconciliation.`
        );
        return NextResponse.json({ status: 'unmatched', payment_id: paymentId });
      }

      console.log(`[Razorpay Webhook] Activating ${businessId} on ${plan.key} from payment ${paymentId}.`);

      const { error: updateError } = await supabase
        .from('businesses')
        .update({
          subscription_status: 'active',
          plan: plan.key,
          // trial_end_date is what the paywall checks; without this the business
          // stays "active" but reads as lapsed the moment its trial date passes.
          trial_end_date: accessEndDate(plan),
        })
        .eq('id', businessId);

      if (updateError) {
        console.error(`[Razorpay Webhook] Could not activate ${businessId}:`, updateError.message);
        // 500 so Razorpay retries the webhook.
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      // The checkout handler may already have recorded this payment.
      const { data: existing } = await supabase
        .from('payment_events')
        .select('id')
        .eq('razorpay_payment_id', paymentId)
        .maybeSingle();

      if (!existing) {
        const { error: ledgerError } = await supabase.from('payment_events').insert({
          business_id: businessId,
          razorpay_payment_id: paymentId,
          razorpay_order_id: paymentEntity?.order_id || null,
          // The column is `amount` — this route used to write `amount_paise`,
          // which the billing history table never reads.
          amount: amountPaise,
          status: 'success',
        });
        if (ledgerError) {
          console.error('[Razorpay Webhook] Could not write the payment_events row:', ledgerError.message);
        }
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (err: any) {
    console.error('[Razorpay Webhook Exception]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
