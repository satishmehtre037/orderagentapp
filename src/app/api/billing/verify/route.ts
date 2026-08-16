import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const adminSupabase = createClient(supabaseUrl, serviceKey);

export async function POST(req: NextRequest) {
  try {
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_secret) {
      console.error('[Verify Billing Error] RAZORPAY_KEY_SECRET missing in environment');
      return NextResponse.json(
        { error: 'Razorpay secret key not configured' },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, businessId, plan } = body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing verification parameters: order_id, payment_id, or signature',
        },
        { status: 400 }
      );
    }

    // Generate expected HMAC SHA-256 signature
    const hmac = crypto.createHmac('sha256', key_secret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest('hex');

    console.log(`[Verify Billing] Validating payment signature for Order ${razorpay_order_id}`);

    // Signature verification check using timingSafeEqual
    let isSignatureValid = false;
    try {
      isSignatureValid = crypto.timingSafeEqual(
        Buffer.from(generatedSignature, 'utf-8'),
        Buffer.from(razorpay_signature, 'utf-8')
      );
    } catch {
      isSignatureValid = generatedSignature === razorpay_signature;
    }

    if (!isSignatureValid) {
      console.warn('[Verify Billing] ❌ Signature mismatch for payment:', razorpay_payment_id);
      return NextResponse.json(
        { success: false, error: 'Invalid payment signature. Verification failed.' },
        { status: 400 }
      );
    }

    console.log(`[Verify Billing] ✅ Payment signature valid for payment ${razorpay_payment_id}`);

    // Determine plan duration
    const chosenPlan = plan || 'monthly_1';
    const isAnnual = chosenPlan.includes('annual');
    const nextEndDate = new Date(Date.now() + (isAnnual ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString();
    const amountPaise = isAnnual ? 1000 : 100;

    // Activate subscription in businesses table if businessId is valid UUID
    if (businessId && businessId !== 'demo-business-id') {
      const { error: updateError } = await adminSupabase
        .from('businesses')
        .update({
          subscription_status: 'active',
          plan: chosenPlan,
          trial_end_date: nextEndDate,
        })
        .eq('id', businessId);

      if (updateError) {
        console.error('[Verify Billing] Error updating business:', updateError);
      } else {
        console.log(`[Verify Billing] Business ${businessId} upgraded to ACTIVE until ${nextEndDate}`);
      }

      // Record event in payment_events table
      await adminSupabase.from('payment_events').insert({
        business_id: businessId,
        razorpay_payment_id,
        razorpay_order_id,
        amount: amountPaise,
        status: 'success',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and Pro Plan activated successfully!',
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      plan: chosenPlan,
      validUntil: nextEndDate,
    });
  } catch (err: any) {
    console.error('[Verify Billing Exception]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
