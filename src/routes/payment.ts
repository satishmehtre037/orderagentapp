import { Router, Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { ENV } from '../config/env.js';

const router = Router();

/**
 * 1. POST /api/create-order
 * Creates a Razorpay Order (Minimum amount: 100 paise)
 */
router.post('/api/create-order', async (req: Request, res: Response) => {
  try {
    const key_id = process.env.RAZORPAY_KEY_ID || ENV.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET || ENV.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return res.status(401).json({ error: 'Razorpay API credentials not configured' });
    }

    const { amount: rawAmount, currency = 'INR', receipt = `rcpt_${Date.now()}` } = req.body;
    const amount = Number(rawAmount) || 99900;

    if (isNaN(amount) || amount < 100) {
      return res.status(400).json({ error: 'Invalid amount. Minimum amount is 100 paise (₹1.00)' });
    }

    const razorpay = new Razorpay({ key_id, key_secret });

    console.log(`[Express API] Creating Razorpay order: ${amount} ${currency}`);

    const order = await razorpay.orders.create({
      amount: Math.round(amount),
      currency,
      receipt,
      notes: req.body.notes || { source: 'Express Standard Checkout' },
    });

    console.log(`[Express API] Order created successfully: ${order.id}`);

    return res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err: any) {
    console.error('[Express Create Order Error]:', err);
    return res.status(err.statusCode || 500).json({ error: err.message || 'Failed to create order' });
  }
});

/**
 * 2. POST /api/verify-payment
 * Verifies Razorpay payment HMAC-SHA256 signature
 */
router.post('/api/verify-payment', (req: Request, res: Response) => {
  try {
    const key_secret = process.env.RAZORPAY_KEY_SECRET || ENV.RAZORPAY_KEY_SECRET;

    if (!key_secret) {
      return res.status(401).json({ error: 'Razorpay secret key not configured' });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: razorpay_order_id, razorpay_payment_id, or razorpay_signature',
      });
    }

    const hmac = crypto.createHmac('sha256', key_secret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest('hex');

    const isSignatureValid = crypto.timingSafeEqual(
      Buffer.from(generatedSignature, 'utf-8'),
      Buffer.from(razorpay_signature, 'utf-8')
    );

    if (isSignatureValid) {
      console.log(`[Express API] ✅ Signature match! Payment verified for ID: ${razorpay_payment_id}`);
      return res.json({
        success: true,
        message: 'Payment verified successfully',
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
      });
    } else {
      console.warn(`[Express API] ❌ Signature mismatch!`);
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature. Payment cannot be verified.',
      });
    }
  } catch (err: any) {
    console.error('[Express Verify Payment Exception]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
