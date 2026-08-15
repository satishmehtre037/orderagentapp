import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Razorpay redirects here after payment with POST body containing:
// razorpay_payment_id, razorpay_order_id, razorpay_signature
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const razorpay_payment_id = formData.get('razorpay_payment_id') as string;
    const razorpay_order_id = formData.get('razorpay_order_id') as string;
    const razorpay_signature = formData.get('razorpay_signature') as string;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      // Payment was cancelled or failed — redirect back to dashboard
      const baseUrl = req.nextUrl.origin;
      return NextResponse.redirect(`${baseUrl}/dashboard?payment=cancelled`, { status: 303 });
    }

    // Verify HMAC SHA256 signature
    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      console.error('[Razorpay Callback] Signature verification FAILED');
      const baseUrl = req.nextUrl.origin;
      return NextResponse.redirect(`${baseUrl}/dashboard?payment=failed&reason=signature`, { status: 303 });
    }

    console.log('[Razorpay Callback] ✅ Signature verified for payment:', razorpay_payment_id);

    // Find the business from order notes (fetch from Razorpay API)
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const authHeader = Buffer.from(`${razorpayKeyId}:${secret}`).toString('base64');

    const orderRes = await fetch(`https://api.razorpay.com/v1/orders/${razorpay_order_id}`, {
      headers: { Authorization: `Basic ${authHeader}` },
    });

    let businessId = '';
    let planCycle = 'monthly_1';

    if (orderRes.ok) {
      const orderData = await orderRes.json();
      businessId = orderData.notes?.business_id || '';
      planCycle = orderData.notes?.plan_cycle === 'annual' ? 'annual_10' : 'monthly_1';
    }

    if (businessId) {
      // Record payment event
      await supabase.from('payment_events').insert({
        business_id: businessId,
        event_type: 'payment.captured',
        razorpay_payment_id,
        razorpay_order_id,
        amount: 0, // Will be filled from order
        currency: 'INR',
        status: 'captured',
      });

      // Update business subscription
      const now = new Date();
      const endDate = planCycle === 'annual_10'
        ? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
        : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      await supabase
        .from('businesses')
        .update({
          subscription_status: 'active',
          plan: planCycle,
          trial_end_date: endDate.toISOString(),
        })
        .eq('id', businessId);

      console.log('[Razorpay Callback] ✅ Business subscription activated:', businessId);
    }

    const baseUrl = req.nextUrl.origin;
    return NextResponse.redirect(`${baseUrl}/dashboard?payment=success&payment_id=${razorpay_payment_id}`, { status: 303 });
  } catch (error: any) {
    console.error('[Razorpay Callback] Error:', error);
    const baseUrl = req.nextUrl.origin;
    return NextResponse.redirect(`${baseUrl}/dashboard?payment=error`, { status: 303 });
  }
}

// Also handle GET in case of cancellation redirect
export async function GET(req: NextRequest) {
  const baseUrl = req.nextUrl.origin;
  return NextResponse.redirect(`${baseUrl}/dashboard?payment=cancelled`, { status: 303 });
}
