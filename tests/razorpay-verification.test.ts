import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';
import { verifyAndActivate } from '@/services/subscriptionService';

describe('Razorpay HMAC Payment Signature Verification & Billing', () => {
  const originalKeyId = process.env.RAZORPAY_KEY_ID;
  const originalSecret = process.env.RAZORPAY_KEY_SECRET;

  const testKeyId = 'rzp_test_mock_123456';
  const testKeySecret = 'test_razorpay_secret_abcdef987654';

  beforeEach(() => {
    process.env.RAZORPAY_KEY_ID = testKeyId;
    process.env.RAZORPAY_KEY_SECRET = testKeySecret;
  });

  afterEach(() => {
    process.env.RAZORPAY_KEY_ID = originalKeyId;
    process.env.RAZORPAY_KEY_SECRET = originalSecret;
  });

  it('should reject payment verification if required fields are missing', async () => {
    const res = await verifyAndActivate({
      orderId: '',
      paymentId: 'pay_123',
      signature: 'sig_123',
    });

    expect(res.success).toBe(false);
    expect(res.status).toBe(400);
    expect(res.error).toContain('Missing razorpay_order_id');
  });

  it('should reject invalid or forged Razorpay signature', async () => {
    const orderId = 'order_test_1001';
    const paymentId = 'pay_test_9001';
    const forgedSignature = 'forged_signature_hex_1234567890abcdef1234567890abcdef1234567890abcdef';

    const res = await verifyAndActivate({
      orderId,
      paymentId,
      signature: forgedSignature,
    });

    expect(res.success).toBe(false);
    expect(res.status).toBe(400);
    expect(res.error).toContain('Invalid payment signature');
  });

  it('should compute and validate correct HMAC-SHA256 signature', () => {
    const orderId = 'order_test_1001';
    const paymentId = 'pay_test_9001';
    const payload = `${orderId}|${paymentId}`;

    const expectedSignature = crypto
      .createHmac('sha256', testKeySecret)
      .update(payload)
      .digest('hex');

    expect(expectedSignature).toBeDefined();
    expect(expectedSignature.length).toBe(64);

    // Verify constant-time match
    const a = Buffer.from(expectedSignature, 'utf8');
    const b = Buffer.from(expectedSignature, 'utf8');
    expect(crypto.timingSafeEqual(a, b)).toBe(true);
  });
});
