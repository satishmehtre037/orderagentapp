import { NextRequest, NextResponse } from 'next/server';
import { verifyAndActivate } from '@/services/subscriptionService';

/**
 * Razorpay's post-payment redirect. Razorpay POSTs a form body containing
 * razorpay_payment_id, razorpay_order_id and razorpay_signature.
 *
 * This route used to keep its own third copy of the verification logic, with
 * `amount: 0` written into the ledger ("Will be filled from order" — it never
 * was) and a plain `===` signature comparison. It now shares one implementation
 * with /api/verify-payment and /api/billing/verify, which reads the real amount
 * and plan back from the order.
 */
export async function POST(req: NextRequest) {
  const baseUrl = req.nextUrl.origin;

  try {
    const formData = await req.formData();
    const razorpay_payment_id = formData.get('razorpay_payment_id') as string;
    const razorpay_order_id = formData.get('razorpay_order_id') as string;
    const razorpay_signature = formData.get('razorpay_signature') as string;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      // Payment was cancelled or failed — send them back to the dashboard.
      return NextResponse.redirect(`${baseUrl}/dashboard?payment=cancelled`, { status: 303 });
    }

    const result = await verifyAndActivate({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!result.success) {
      console.error('[Razorpay Callback] Verification failed:', result.error);
      const reason = result.status === 400 ? 'signature' : 'activation';
      return NextResponse.redirect(`${baseUrl}/dashboard?payment=failed&reason=${reason}`, { status: 303 });
    }

    if (!result.activated) {
      // The money was taken but we could not tell which business it belongs to.
      console.error(
        `[Razorpay Callback] Payment ${razorpay_payment_id} verified but not linked to a business — needs manual reconciliation.`
      );
      return NextResponse.redirect(
        `${baseUrl}/dashboard?payment=unlinked&payment_id=${razorpay_payment_id}`,
        { status: 303 }
      );
    }

    console.log(`[Razorpay Callback] ✅ Subscription activated for ${result.businessId} (${result.plan}).`);
    return NextResponse.redirect(
      `${baseUrl}/dashboard?payment=success&payment_id=${razorpay_payment_id}`,
      { status: 303 }
    );
  } catch (error: any) {
    console.error('[Razorpay Callback] Error:', error);
    return NextResponse.redirect(`${baseUrl}/dashboard?payment=error`, { status: 303 });
  }
}

// Razorpay uses GET for the cancellation redirect.
export async function GET(req: NextRequest) {
  const baseUrl = req.nextUrl.origin;
  return NextResponse.redirect(`${baseUrl}/dashboard?payment=cancelled`, { status: 303 });
}
