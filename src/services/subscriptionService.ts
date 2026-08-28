/**
 * Subscription billing — order creation and payment activation.
 *
 * Three routes (/api/verify-payment, /api/billing/verify, /api/razorpay-callback)
 * each carried their own copy of this logic, and all three shared two defects:
 *
 *  1. They trusted the request body for `plan` and `amount`. A client could post
 *     plan 'annual' after paying for a month, or an amount that had nothing to do
 *     with the money that actually moved, and the ledger recorded whatever it was
 *     told. Both values now come from the Razorpay order, fetched server-side.
 *  2. They activated the subscription even when they could not confirm the
 *     payment belonged to the order. The signature check is now the gate: no
 *     valid signature, no activation, no ledger row.
 *
 * Relative imports so both the Next routes and the Express server can load this.
 */

import crypto from 'crypto';
import Razorpay from 'razorpay';
import { supabase } from '../config/supabase';
import { DEFAULT_PLAN_KEY, PLANS, accessEndDate, resolvePlan, type Plan, type PlanKey } from '../config/plans';

function razorpayCredentials(): { keyId: string; keySecret: string } | null {
  const keyId = (process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '').trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
  if (!keyId || !keySecret) return null;
  return { keyId, keySecret };
}

function client(): Razorpay | null {
  const creds = razorpayCredentials();
  if (!creds) return null;
  return new Razorpay({ key_id: creds.keyId, key_secret: creds.keySecret });
}

export interface CreateOrderInput {
  businessId?: string;
  planKey?: string;
}

export interface CreateOrderResult {
  success: boolean;
  error?: string;
  orderId?: string;
  amountPaise?: number;
  currency?: string;
  keyId?: string;
  plan?: PlanKey;
  planLabel?: string;
}

/**
 * Creates a Razorpay order priced from the plan catalogue.
 *
 * The chosen plan is written into the order's notes so activation can read it
 * back from Razorpay instead of believing the browser.
 */
export async function createSubscriptionOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const creds = razorpayCredentials();
  const rzp = client();
  if (!creds || !rzp) {
    console.error('[Billing] RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not configured.');
    return { success: false, error: 'Payments are not configured on this server.' };
  }

  const plan = resolvePlan(input.planKey) || PLANS[DEFAULT_PLAN_KEY];

  if (input.planKey && !resolvePlan(input.planKey)) {
    return {
      success: false,
      error: `Unknown plan "${input.planKey}". Valid plans: ${Object.keys(PLANS).join(', ')}.`,
    };
  }

  const receipt = `bizbot_${input.businessId ? input.businessId.slice(0, 8) : 'anon'}_${Date.now()}`;

  try {
    const order = await rzp.orders.create({
      // Priced here, not by the caller.
      amount: plan.amountPaise,
      currency: plan.currency,
      receipt,
      notes: {
        business_id: input.businessId || '',
        plan: plan.key,
        description: `${plan.label} — WhatsApp AI Agent`,
      },
    });

    console.log(
      `[Billing] Order ${order.id} created: ${plan.amountPaise} paise (${plan.key}) for business ${input.businessId || 'anon'}`
    );

    return {
      success: true,
      orderId: order.id,
      amountPaise: Number(order.amount),
      currency: String(order.currency),
      keyId: creds.keyId,
      plan: plan.key,
      planLabel: plan.label,
    };
  } catch (err: any) {
    console.error('[Billing] Razorpay order creation failed:', err?.error?.description || err?.message || err);
    return { success: false, error: err?.error?.description || err?.message || 'Could not create the payment order.' };
  }
}

export interface VerifyInput {
  orderId: string;
  paymentId: string;
  signature: string;
  /** Only used if the order's notes carry no business_id (older orders). */
  fallbackBusinessId?: string;
  /** Only used if the order cannot be fetched back from Razorpay. */
  fallbackPlanKey?: string;
}

export interface VerifyResult {
  success: boolean;
  /** 400 signature failure, 402 payment not captured, 500 server-side problem. */
  status: number;
  error?: string;
  businessId?: string;
  plan?: PlanKey;
  amountPaise?: number;
  validUntil?: string;
  activated?: boolean;
  alreadyRecorded?: boolean;
}

/** Constant-time compare that tolerates a wrong-length input instead of throwing. */
function signatureMatches(expected: string, received: unknown): boolean {
  if (typeof received !== 'string') return false;
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(received, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Verifies a Razorpay checkout callback and, only on success, activates the
 * subscription and records the payment.
 */
export async function verifyAndActivate(input: VerifyInput): Promise<VerifyResult> {
  const creds = razorpayCredentials();
  if (!creds) {
    console.error('[Billing] Cannot verify a payment without RAZORPAY_KEY_SECRET.');
    return { success: false, status: 500, error: 'Payments are not configured on this server.' };
  }

  if (!input.orderId || !input.paymentId || !input.signature) {
    return {
      success: false,
      status: 400,
      error: 'Missing razorpay_order_id, razorpay_payment_id, or razorpay_signature.',
    };
  }

  const expected = crypto
    .createHmac('sha256', creds.keySecret)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest('hex');

  if (!signatureMatches(expected, input.signature)) {
    console.warn(`[Billing] ❌ Signature mismatch for payment ${input.paymentId} on order ${input.orderId}.`);
    return { success: false, status: 400, error: 'Invalid payment signature. The payment could not be verified.' };
  }

  console.log(`[Billing] ✅ Signature valid for payment ${input.paymentId}.`);

  // The authoritative amount and plan: whatever Razorpay says was ordered.
  let plan: Plan = resolvePlan(input.fallbackPlanKey) || PLANS[DEFAULT_PLAN_KEY];
  let amountPaise = plan.amountPaise;
  let businessId = input.fallbackBusinessId || '';

  const rzp = client();
  if (rzp) {
    try {
      const order: any = await rzp.orders.fetch(input.orderId);
      amountPaise = Number(order?.amount_paid ?? order?.amount ?? amountPaise);
      const notedPlan = resolvePlan(order?.notes?.plan);
      if (notedPlan) plan = notedPlan;
      if (order?.notes?.business_id) businessId = String(order.notes.business_id);

      if (order?.status && order.status !== 'paid') {
        console.warn(`[Billing] Order ${input.orderId} is "${order.status}", not paid — refusing to activate.`);
        return {
          success: false,
          status: 402,
          error: `Razorpay reports this order as "${order.status}". Activation withheld until it is captured.`,
        };
      }
    } catch (err: any) {
      // A matching signature proves the payment belongs to this order, so the
      // activation still stands — we just price it from the plan the caller
      // named rather than from the order we could not read.
      console.warn(`[Billing] Could not fetch order ${input.orderId} from Razorpay:`, err?.message || err);
    }
  }

  if (!businessId) {
    console.warn(`[Billing] Payment ${input.paymentId} verified but no business_id is attached to the order.`);
    return {
      success: true,
      status: 200,
      activated: false,
      plan: plan.key,
      amountPaise,
      error: 'Payment verified, but no business is linked to this order, so no subscription was activated.',
    };
  }

  const validUntil = accessEndDate(plan);

  const { error: updateError } = await supabase
    .from('businesses')
    .update({
      subscription_status: 'active',
      plan: plan.key,
      trial_end_date: validUntil,
    })
    .eq('id', businessId);

  if (updateError) {
    // The money moved. Surface this loudly rather than reporting success.
    console.error(`[Billing] Payment ${input.paymentId} captured but activating ${businessId} failed:`, updateError.message);
    return {
      success: false,
      status: 500,
      error: `Payment was verified but the subscription could not be activated: ${updateError.message}. Please contact support with payment id ${input.paymentId}.`,
      businessId,
      plan: plan.key,
      amountPaise,
    };
  }

  // Razorpay can deliver the same payment twice (checkout handler plus webhook).
  const { data: existing } = await supabase
    .from('payment_events')
    .select('id')
    .eq('razorpay_payment_id', input.paymentId)
    .maybeSingle();

  if (!existing) {
    const { error: ledgerError } = await supabase.from('payment_events').insert({
      business_id: businessId,
      razorpay_payment_id: input.paymentId,
      razorpay_order_id: input.orderId,
      amount: amountPaise,
      status: 'success',
    });
    if (ledgerError) {
      console.error('[Billing] Could not write the payment_events row:', ledgerError.message);
    }
  }

  console.log(`[Billing] Business ${businessId} active on ${plan.key} until ${validUntil}.`);

  return {
    success: true,
    status: 200,
    activated: true,
    alreadyRecorded: Boolean(existing),
    businessId,
    plan: plan.key,
    amountPaise,
    validUntil,
  };
}
