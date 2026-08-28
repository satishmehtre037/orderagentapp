import { NextRequest, NextResponse } from 'next/server';
import { verifyAndActivate } from '@/services/subscriptionService';

/**
 * POST /api/verify-payment — verifies a Razorpay checkout callback and activates
 * the subscription.
 *
 * The plan and amount used to be read from the request body, so a caller could
 * pay for one month and post `plan: 'annual'`, and the ledger recorded whatever
 * amount it was handed. Both now come from the Razorpay order, fetched
 * server-side. See src/services/subscriptionService.ts.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, business_id, plan } = body;

    const result = await verifyAndActivate({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      fallbackBusinessId: business_id,
      fallbackPlanKey: plan,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, message: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.activated
        ? 'Payment verified and subscription activated.'
        : result.error || 'Payment verified.',
      activated: result.activated ?? false,
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      plan: result.plan,
      amount: result.amountPaise,
      validUntil: result.validUntil,
    });
  } catch (err: any) {
    console.error('[Verify Payment Exception]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Payment verification failed' },
      { status: 500 }
    );
  }
}
