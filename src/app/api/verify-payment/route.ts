import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_secret) {
      console.error('[Verify Payment Error] RAZORPAY_KEY_SECRET missing in environment');
      return NextResponse.json(
        { error: 'Razorpay secret key not configured' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.warn('[Verify Payment Warning] Missing required verification parameters');
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: razorpay_order_id, razorpay_payment_id, or razorpay_signature',
        },
        { status: 400 }
      );
    }

    // Generate expected HMAC SHA-256 signature
    const hmac = crypto.createHmac('sha256', key_secret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest('hex');

    console.log(`[Verify Payment] Verifying signature for Order: ${razorpay_order_id}, Payment: ${razorpay_payment_id}`);

    // Signature verification check using timingSafeEqual to prevent timing attacks
    const isSignatureValid = crypto.timingSafeEqual(
      Buffer.from(generatedSignature, 'utf-8'),
      Buffer.from(razorpay_signature, 'utf-8')
    );

    if (isSignatureValid) {
      console.log(`[Verify Payment] ✅ Signature match! Payment verified for ID: ${razorpay_payment_id}`);
      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully',
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
      });
    } else {
      console.warn(`[Verify Payment] ❌ Signature mismatch! Payment verification failed.`);
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid payment signature. Payment cannot be verified.',
        },
        { status: 400 }
      );
    }
  } catch (err: any) {
    console.error('[Verify Payment Exception]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Payment verification failed' },
      { status: 500 }
    );
  }
}
