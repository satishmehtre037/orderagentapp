import { NextRequest, NextResponse } from 'next/server';
import { verifyAndActivate } from '@/services/subscriptionService';

/**
 * POST /api/billing/verify — alias of /api/verify-payment.
 *
 * Both routes existed with independent copies of the signature check, the plan
 * duration, and the amount (this one hardcoded 1000/100 paise while the other
 * read the amount from the body). They now share one implementation, so they
 * cannot drift apart again. See src/services/subscriptionService.ts.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, businessId, business_id, plan } = body;

    const requested = businessId || business_id;

    const result = await verifyAndActivate({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      // 'demo-business-id' is a placeholder the old dashboard sent; it is not a UUID.
      fallbackBusinessId: requested && requested !== 'demo-business-id' ? requested : undefined,
      fallbackPlanKey: plan,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      message: result.activated
        ? 'Payment verified and Pro Plan activated.'
        : result.error || 'Payment verified.',
      activated: result.activated ?? false,
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      plan: result.plan,
      amount: result.amountPaise,
      validUntil: result.validUntil,
    });
  } catch (err: any) {
    console.error('[Verify Billing Exception]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
