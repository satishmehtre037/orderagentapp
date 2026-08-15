import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(req: NextRequest) {
  try {
    const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      console.error('[Create Order Error] Missing Razorpay Key ID or Secret in environment');
      return NextResponse.json(
        { error: 'Razorpay API credentials not configured' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const amount = Number(body.amount) || 99900; // Default ₹999 in paise
    const currency = body.currency || 'INR';
    const receipt = body.receipt || `rcpt_${Date.now()}`;

    // Validate minimum amount requirement (minimum 100 paise = ₹1.00)
    if (isNaN(amount) || amount < 100) {
      return NextResponse.json(
        { error: 'Invalid amount. Minimum amount is 100 paise (₹1.00)' },
        { status: 400 }
      );
    }

    // Initialize Razorpay SDK instance
    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    console.log(`[Create Order] Creating Razorpay order for ${amount} ${currency}...`);

    const order = await razorpay.orders.create({
      amount: Math.round(amount),
      currency,
      receipt,
      notes: body.notes || { source: 'BizBot OS Standard Checkout' },
    });

    console.log(`[Create Order] Order created successfully: ${order.id}`);

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id,
    });
  } catch (err: any) {
    console.error('[Create Order Exception]:', err);
    const statusCode = err.statusCode || err.status || 500;
    return NextResponse.json(
      { error: err.message || 'Failed to create Razorpay order' },
      { status: statusCode }
    );
  }
}
