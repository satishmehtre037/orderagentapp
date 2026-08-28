import { Router, Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { supabase } from '../config/supabase';
import { ENV } from '../config/env';
import { PLANS, DEFAULT_PLAN_KEY, accessEndDate, resolvePlan } from '../config/plans';

const router = Router();

const MONTHLY = PLANS[DEFAULT_PLAN_KEY];

function razorpayClient(): Razorpay | null {
  if (!ENV.RAZORPAY_KEY_ID || !ENV.RAZORPAY_KEY_SECRET) return null;
  return new Razorpay({ key_id: ENV.RAZORPAY_KEY_ID, key_secret: ENV.RAZORPAY_KEY_SECRET });
}

/**
 * 1. POST /billing/create-subscription
 * Creates or reuses a Razorpay customer and subscription for the ₹999/mo plan.
 *
 * Every failure path here used to invent an id — `sub_mock_${Date.now()}`,
 * `cust_mock_...`, `sub_${random}` — and write it into the businesses row. The
 * dashboard then showed a subscription that Razorpay had never heard of, and the
 * fake id was what later webhook lookups matched against. Failures now return an
 * error instead of a fabricated identifier.
 */
router.post('/create-subscription', async (req: Request, res: Response) => {
  try {
    const { business_id } = req.body;

    if (!business_id) {
      return res.status(400).json({ error: 'business_id is required' });
    }

    const razorpay = razorpayClient();
    if (!razorpay || !ENV.RAZORPAY_PLAN_ID) {
      console.error('[Billing API] RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET / RAZORPAY_PLAN_ID are not configured.');
      return res.status(503).json({
        error: 'Subscriptions are not configured on this server.',
        hint: 'Set RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET and RAZORPAY_PLAN_ID.',
      });
    }

    console.log(`[Billing API] Creating subscription for business_id: ${business_id}`);

    const { data: business, error: busErr } = await supabase
      .from('businesses')
      .select('id, name, owner_email, whatsapp_number, razorpay_customer_id')
      .eq('id', business_id)
      .maybeSingle();

    if (busErr) {
      console.error('[Billing API] Business lookup failed:', busErr.message);
      return res.status(500).json({ error: busErr.message });
    }
    if (!business) {
      return res.status(404).json({ error: `No business found with id ${business_id}.` });
    }
    if (!business.owner_email) {
      return res.status(400).json({
        error: 'This business has no owner email on file, which Razorpay requires to create a customer.',
      });
    }

    let customerId = business.razorpay_customer_id;

    if (!customerId) {
      try {
        const customer = await razorpay.customers.create({
          name: business.name,
          email: business.owner_email,
          contact: business.whatsapp_number || undefined,
          notes: { business_id: business.id },
        });
        customerId = customer.id;
      } catch (custErr: any) {
        const detail = custErr?.error?.description || custErr?.message || 'unknown error';
        console.error('[Billing API] Razorpay customer creation failed:', detail);
        return res.status(502).json({ error: `Razorpay could not create the customer: ${detail}` });
      }
    }

    let subscriptionId: string;
    try {
      const subscription = await razorpay.subscriptions.create({
        plan_id: ENV.RAZORPAY_PLAN_ID,
        customer_notify: 1,
        total_count: 12,
        notes: { business_id: business.id, plan: MONTHLY.key },
      });
      subscriptionId = subscription.id;
    } catch (subErr: any) {
      const detail = subErr?.error?.description || subErr?.message || 'unknown error';
      console.error('[Billing API] Razorpay subscription creation failed:', detail);
      return res.status(502).json({ error: `Razorpay could not create the subscription: ${detail}` });
    }

    const { error: saveErr } = await supabase
      .from('businesses')
      .update({
        razorpay_customer_id: customerId,
        razorpay_subscription_id: subscriptionId,
      })
      .eq('id', business.id);

    if (saveErr) {
      console.error('[Billing API] Subscription created but could not be saved:', saveErr.message);
    }

    return res.json({
      subscription_id: subscriptionId,
      razorpay_key_id: ENV.RAZORPAY_KEY_ID,
      amount: MONTHLY.amountPaise,
      currency: MONTHLY.currency,
      plan: MONTHLY.key,
      plan_id: ENV.RAZORPAY_PLAN_ID,
    });
  } catch (err: any) {
    console.error('[Billing API Exception] create-subscription:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * 2. POST /billing/webhook
 *
 * The signature check used to log "Signature mismatch!" and then fall straight
 * through to the handler — anyone who knew the URL could POST a
 * subscription.activated payload naming any business_id and get a free Pro
 * account. A mismatch is now a 401, and a missing signature or unset secret is
 * refused rather than waved through.
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string | undefined;

    if (!ENV.RAZORPAY_WEBHOOK_SECRET) {
      console.error('[Billing Webhook] RAZORPAY_WEBHOOK_SECRET is not set — refusing unverifiable webhooks.');
      return res.status(503).json({ error: 'Webhook secret is not configured on this server.' });
    }
    if (!signature) {
      console.warn('[Billing Webhook] Request had no x-razorpay-signature header.');
      return res.status(401).json({ error: 'Missing x-razorpay-signature.' });
    }

    // Razorpay signs the exact bytes it sent, so re-serialising req.body would
    // break on any key-order difference. server.ts stores the raw body.
    const rawBody = (req as any).rawBody ?? JSON.stringify(req.body);
    const expected = crypto.createHmac('sha256', ENV.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest('hex');

    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(signature, 'utf8');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      console.warn('[Billing Webhook] ❌ Signature mismatch — rejecting.');
      return res.status(401).json({ error: 'Invalid webhook signature.' });
    }

    const payload = req.body;
    const eventType = payload.event;
    const eventData = payload.payload;

    console.log('[Billing Webhook] ✅ Verified event:', eventType);

    if (eventType === 'subscription.activated' || eventType === 'subscription.authenticated') {
      const subEntity = eventData?.subscription?.entity;
      if (!subEntity) {
        console.warn('[Billing Webhook] Subscription event carried no entity.');
        return res.status(200).json({ status: 'ignored' });
      }

      const businessId = subEntity.notes?.business_id;
      const subId = subEntity.id;
      const plan = resolvePlan(subEntity.notes?.plan) || MONTHLY;

      console.log(`[Billing Webhook] Subscription activated: ${subId} (business ${businessId || 'unknown'})`);

      const update = {
        subscription_status: 'active',
        plan: plan.key,
        trial_end_date: accessEndDate(plan),
      };

      if (businessId) {
        await supabase
          .from('businesses')
          .update({ ...update, razorpay_subscription_id: subId })
          .eq('id', businessId);
      } else if (subId) {
        await supabase.from('businesses').update(update).eq('razorpay_subscription_id', subId);
      }
    } else if (eventType === 'subscription.charged' || eventType === 'payment.captured') {
      const paymentEntity = eventData?.payment?.entity || eventData?.subscription?.entity;
      if (!paymentEntity?.id) {
        console.warn('[Billing Webhook] Charge event carried no payment entity.');
        return res.status(200).json({ status: 'ignored' });
      }

      const paymentId = paymentEntity.id;
      // The charged amount is whatever Razorpay reports. No default: a missing
      // amount means we do not know it, and inventing ₹999 would falsify the ledger.
      const amount = typeof paymentEntity.amount === 'number' ? paymentEntity.amount : null;
      const subId = paymentEntity.subscription_id || eventData?.subscription?.entity?.id;
      const plan = resolvePlan(paymentEntity.notes?.plan) || MONTHLY;

      console.log(`[Billing Webhook] Payment charged: ${paymentId}${amount !== null ? ` (₹${amount / 100})` : ''}`);

      let targetBusinessId = paymentEntity.notes?.business_id;
      if (!targetBusinessId && subId) {
        const { data: bus } = await supabase
          .from('businesses')
          .select('id')
          .eq('razorpay_subscription_id', subId)
          .maybeSingle();
        if (bus) targetBusinessId = bus.id;
      }

      if (!targetBusinessId) {
        console.error(
          `[Billing Webhook] Payment ${paymentId} could not be matched to a business — needs manual reconciliation.`
        );
        return res.status(200).json({ status: 'unmatched', payment_id: paymentId });
      }

      // The same payment can arrive on both the checkout handler and this webhook.
      const { data: existing } = await supabase
        .from('payment_events')
        .select('id')
        .eq('razorpay_payment_id', paymentId)
        .maybeSingle();

      if (!existing) {
        await supabase.from('payment_events').insert({
          business_id: targetBusinessId,
          razorpay_payment_id: paymentId,
          razorpay_order_id: paymentEntity.order_id || null,
          amount,
          status: 'success',
        });
      }

      await supabase
        .from('businesses')
        .update({
          subscription_status: 'active',
          plan: plan.key,
          trial_end_date: accessEndDate(plan),
        })
        .eq('id', targetBusinessId);
    } else if (eventType === 'subscription.cancelled' || eventType === 'subscription.halted') {
      const subId = eventData?.subscription?.entity?.id;
      if (subId) {
        console.log(`[Billing Webhook] Subscription cancelled/halted: ${subId}`);
        await supabase
          .from('businesses')
          .update({ subscription_status: 'expired' })
          .eq('razorpay_subscription_id', subId);
      }
    }

    return res.status(200).json({ status: 'ok' });
  } catch (err: any) {
    console.error('[Billing Webhook Error]:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 3. POST /billing/check-trials
 * Marks trials whose trial_end_date has passed as expired.
 */
router.post('/check-trials', async (_req: Request, res: Response) => {
  try {
    const nowIso = new Date().toISOString();

    const { data: expiredBusinesses, error } = await supabase
      .from('businesses')
      .select('id, name, trial_end_date')
      .eq('subscription_status', 'trial')
      .lt('trial_end_date', nowIso);

    if (error) {
      console.error('[Billing Trial Checker Error]:', error);
      return res.status(500).json({ error: error.message });
    }

    let updatedCount = 0;
    if (expiredBusinesses && expiredBusinesses.length > 0) {
      for (const bus of expiredBusinesses) {
        const { error: updateErr } = await supabase
          .from('businesses')
          .update({ subscription_status: 'expired' })
          .eq('id', bus.id);

        if (updateErr) {
          console.error(`[Trial Checker] Could not expire ${bus.name} (${bus.id}):`, updateErr.message);
          continue;
        }
        updatedCount++;
        console.log(`[Trial Checker] Expired trial for business: ${bus.name} (${bus.id})`);
      }
    }

    return res.json({
      status: 'ok',
      checked_at: nowIso,
      expired_count: updatedCount,
    });
  } catch (err: any) {
    console.error('[Trial Checker Exception]:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
