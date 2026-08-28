import { NextRequest, NextResponse } from 'next/server';
import { createSubscriptionOrder } from '@/services/subscriptionService';

/**
 * POST /api/create-order — Razorpay order for a subscription plan.
 *
 * The amount used to be taken from the request body (`Number(body.amount) || 99900`),
 * so the browser decided the price and the dashboard was sending 100 paise. The
 * caller now names a plan and the server prices it from src/config/plans.ts.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const result = await createSubscriptionOrder({
      businessId: body.businessId || body.business_id || body.notes?.business_id,
      planKey: body.plan || body.planKey || body.notes?.plan,
    });

    if (!result.success) {
      const status = result.error?.startsWith('Unknown plan') ? 400 : 500;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({
      order_id: result.orderId,
      orderId: result.orderId,
      amount: result.amountPaise,
      currency: result.currency,
      key_id: result.keyId,
      keyId: result.keyId,
      plan: result.plan,
      planLabel: result.planLabel,
    });
  } catch (err: any) {
    console.error('[Create Order Exception]:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create Razorpay order' },
      { status: 500 }
    );
  }
}
