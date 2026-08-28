import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSubscriptionOrder } from '@/services/subscriptionService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const adminSupabase = createClient(supabaseUrl, serviceKey);

// GET: Fetch payment ledger for the business
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json({ error: 'Missing businessId' }, { status: 400 });
    }

    const { data, error } = await adminSupabase
      .from('payment_events')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ payments: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST: create a Razorpay order for a subscription plan.
 *
 * The amount used to come from the request body, defaulting to 100 paise (₹1)
 * monthly / 1000 paise (₹10) annually — while routes/billing.ts quoted ₹999 for
 * the same product. The price now comes from src/config/plans.ts and a client
 * supplied `amount` is ignored entirely.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { businessId } = body;

    const result = await createSubscriptionOrder({
      businessId,
      planKey: body.plan || body.planKey,
    });

    if (!result.success) {
      const status = result.error?.startsWith('Unknown plan') ? 400 : 500;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({
      orderId: result.orderId,
      order_id: result.orderId,
      amount: result.amountPaise,
      currency: result.currency,
      keyId: result.keyId,
      key_id: result.keyId,
      plan: result.plan,
      planLabel: result.planLabel,
    });
  } catch (err: any) {
    console.error('[API Billing Exception]:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
