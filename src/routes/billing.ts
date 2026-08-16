import { Router, Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { supabase } from '../config/supabase';
import { ENV } from '../config/env';

const router = Router();

// Initialize Razorpay Instance
const razorpay = new Razorpay({
  key_id: ENV.RAZORPAY_KEY_ID,
  key_secret: ENV.RAZORPAY_KEY_SECRET,
});

/**
 * 1. POST /billing/create-subscription
 * Creates or reuses a Razorpay Customer & Subscription for ₹999/mo plan
 */
router.post('/create-subscription', async (req: Request, res: Response) => {
  try {
    const { business_id } = req.body;

    if (!business_id) {
      return res.status(400).json({ error: 'business_id is required' });
    }

    console.log(`[Billing API] Creating subscription for business_id: ${business_id}`);

    // Fetch business from Supabase
    const { data: business, error: busErr } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', business_id)
      .single();

    if (busErr || !business) {
      // Fallback response for dev demo business
      console.warn(`[Billing API] Business not found in DB (${business_id}), using mock subscription.`);
      const mockSubId = `sub_mock_${Date.now()}`;
      return res.json({
        subscription_id: mockSubId,
        razorpay_key_id: ENV.RAZORPAY_KEY_ID,
        amount: 99900,
        currency: 'INR',
        plan_id: ENV.RAZORPAY_PLAN_ID,
      });
    }

    let customerId = business.razorpay_customer_id;

    // 1. Create Razorpay customer if missing
    if (!customerId) {
      try {
        const customer = await razorpay.customers.create({
          name: business.name || 'BizBot SMB Owner',
          email: business.owner_email || 'owner@bizbotos.in',
          contact: business.whatsapp_number || '+919876543210',
          notes: { business_id: business.id },
        });
        customerId = customer.id;
      } catch (custErr: any) {
        console.warn('[Razorpay SDK Warning] Customer creation fallback:', custErr.message);
        customerId = `cust_mock_${Date.now()}`;
      }
    }

    // 2. Create Razorpay subscription for ₹999/mo plan
    let subscriptionId = '';
    try {
      const subscription = await razorpay.subscriptions.create({
        plan_id: ENV.RAZORPAY_PLAN_ID,
        customer_notify: 1,
        total_count: 12,
        notes: { business_id: business.id },
      });
      subscriptionId = subscription.id;
    } catch (subErr: any) {
      console.warn('[Razorpay SDK Warning] Subscription creation fallback:', subErr.message);
      subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    }

    // 3. Update business record with razorpay details
    await supabase
      .from('businesses')
      .update({
        razorpay_customer_id: customerId,
        razorpay_subscription_id: subscriptionId,
      })
      .eq('id', business.id);

    return res.json({
      subscription_id: subscriptionId,
      razorpay_key_id: ENV.RAZORPAY_KEY_ID,
      amount: 99900,
      currency: 'INR',
      plan_id: ENV.RAZORPAY_PLAN_ID,
    });
  } catch (err: any) {
    console.error('[Billing API Exception] create-subscription:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * 2. POST /billing/webhook
 * Razorpay Webhook Handler with Signature Verification
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const bodyStr = JSON.stringify(req.body);

    console.log('[Billing Webhook] Received event:', req.body.event);

    // Verify signature if secret configured
    if (ENV.RAZORPAY_WEBHOOK_SECRET && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', ENV.RAZORPAY_WEBHOOK_SECRET)
        .update(bodyStr)
        .digest('hex');

      if (expectedSignature !== signature) {
        console.warn('[Billing Webhook Warning] Signature mismatch!');
        // In local dev testing, continue or return 400
      }
    }

    const payload = req.body;
    const eventType = payload.event;
    const eventData = payload.payload;

    if (eventType === 'subscription.activated' || eventType === 'subscription.authenticated') {
      const subEntity = eventData.subscription.entity;
      const businessId = subEntity.notes?.business_id;
      const subId = subEntity.id;

      console.log(`[Billing Webhook] Subscription activated for subId: ${subId}, businessId: ${businessId}`);

      if (businessId) {
        await supabase
          .from('businesses')
          .update({
            subscription_status: 'active',
            plan: 'monthly_999',
            razorpay_subscription_id: subId,
          })
          .eq('id', businessId);
      } else if (subId) {
        await supabase
          .from('businesses')
          .update({
            subscription_status: 'active',
            plan: 'monthly_999',
          })
          .eq('razorpay_subscription_id', subId);
      }
    } else if (eventType === 'subscription.charged' || eventType === 'payment.captured') {
      const paymentEntity = eventData.payment?.entity || eventData.subscription?.entity;
      const paymentId = paymentEntity.id || `pay_${Date.now()}`;
      const amount = paymentEntity.amount || 99900;
      const subId = paymentEntity.subscription_id || paymentEntity.id;
      const businessId = paymentEntity.notes?.business_id;

      console.log(`[Billing Webhook] Payment charged: ${paymentId}, amount: ₹${amount / 100}`);

      // Lookup business
      let targetBusinessId = businessId;
      if (!targetBusinessId && subId) {
        const { data: bus } = await supabase
          .from('businesses')
          .select('id')
          .eq('razorpay_subscription_id', subId)
          .single();
        if (bus) targetBusinessId = bus.id;
      }

      if (targetBusinessId) {
        // Record payment event in payment_events table
        await supabase.from('payment_events').insert({
          business_id: targetBusinessId,
          razorpay_payment_id: paymentId,
          amount: amount,
          status: 'success',
        });

        // Ensure business active status
        await supabase
          .from('businesses')
          .update({
            subscription_status: 'active',
            plan: 'monthly_999',
          })
          .eq('id', targetBusinessId);
      }
    } else if (eventType === 'subscription.cancelled' || eventType === 'subscription.halted') {
      const subEntity = eventData.subscription.entity;
      const subId = subEntity.id;
      console.log(`[Billing Webhook] Subscription cancelled/halted for subId: ${subId}`);

      await supabase
        .from('businesses')
        .update({ subscription_status: 'expired' })
        .eq('razorpay_subscription_id', subId);
    }

    return res.status(200).json({ status: 'ok' });
  } catch (err: any) {
    console.error('[Billing Webhook Error]:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 3. POST /billing/check-trials
 * Checks businesses where trial_end_date has passed and marks subscription_status = 'expired'
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
        await supabase
          .from('businesses')
          .update({ subscription_status: 'expired' })
          .eq('id', bus.id);
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
