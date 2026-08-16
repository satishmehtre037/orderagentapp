import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Razorpay from 'razorpay';

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

// POST: Create Razorpay Order for Pro Subscription (₹1 or ₹10)
export async function POST(req: Request) {
  try {
    const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      console.error('[API Billing Error] RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET missing in environment');
      return NextResponse.json(
        { error: 'Razorpay API credentials not configured in environment variables' },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { businessId, plan } = body;
    const amount = Number(body.amount) || (plan?.includes('annual') ? 1000 : 100); // 100 paise = ₹1, 1000 paise = ₹10
    const currency = body.currency || 'INR';
    const receipt = `bizbot_${businessId ? businessId.slice(0, 8) : 'demo'}_${Date.now()}`;

    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    console.log(`[API Billing] Creating Razorpay order: ${amount} paise for business ${businessId} (${plan})`);

    const order = await razorpay.orders.create({
      amount: Math.round(amount),
      currency,
      receipt,
      notes: {
        businessId: businessId || 'demo',
        plan: plan || 'monthly_1',
        description: 'BizBot Pro Plan Subscription',
      },
    });

    console.log(`[API Billing] Razorpay order created successfully: ${order.id}`);

    return NextResponse.json({
      orderId: order.id,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: key_id,
      key_id,
      plan: plan || 'monthly_1',
    });
  } catch (err: any) {
    console.error('[API Billing Exception]:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
