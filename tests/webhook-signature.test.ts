import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';
import { verifyPayloadSignature } from '@/services/inboundPipeline';

describe('Meta WhatsApp Webhook HMAC-SHA256 Signature Verification', () => {
  const originalSecret = process.env.WHATSAPP_APP_SECRET;
  const originalEnv = process.env.NODE_ENV;
  const testSecret = 'test_app_secret_849204928420';

  beforeEach(() => {
    process.env.WHATSAPP_APP_SECRET = testSecret;
  });

  afterEach(() => {
    process.env.WHATSAPP_APP_SECRET = originalSecret;
    (process.env as any).NODE_ENV = originalEnv;
  });

  it('should accept valid signature generated with the correct secret', () => {
    const rawBody = JSON.stringify({
      object: 'whatsapp_business_account',
      entry: [{ id: '12345', changes: [] }],
    });

    const hash = crypto.createHmac('sha256', testSecret).update(rawBody).digest('hex');
    const signatureHeader = `sha256=${hash}`;

    const isValid = verifyPayloadSignature(rawBody, signatureHeader);
    expect(isValid).toBe(true);
  });

  it('should reject tampered payload or forged signature', () => {
    const rawBody = JSON.stringify({ object: 'whatsapp_business_account', entry: [] });
    const forgedHash = crypto.createHmac('sha256', 'wrong_attacker_secret').update(rawBody).digest('hex');
    const signatureHeader = `sha256=${forgedHash}`;

    const isValid = verifyPayloadSignature(rawBody, signatureHeader);
    expect(isValid).toBe(false);
  });

  it('should reject modified payload when signature was computed on original', () => {
    const originalBody = JSON.stringify({ message: 'Book appointment' });
    const tamperedBody = JSON.stringify({ message: 'Delete all records' });

    const hash = crypto.createHmac('sha256', testSecret).update(originalBody).digest('hex');
    const signatureHeader = `sha256=${hash}`;

    const isValid = verifyPayloadSignature(tamperedBody, signatureHeader);
    expect(isValid).toBe(false);
  });

  it('should reject missing signature header', () => {
    const rawBody = JSON.stringify({ message: 'test' });
    expect(verifyPayloadSignature(rawBody, null)).toBe(false);
    expect(verifyPayloadSignature(rawBody, undefined)).toBe(false);
  });

  it('should fail closed in production when WHATSAPP_APP_SECRET is not configured', () => {
    (process.env as any).NODE_ENV = 'production';
    delete process.env.WHATSAPP_APP_SECRET;

    const rawBody = JSON.stringify({ message: 'test' });
    const isValid = verifyPayloadSignature(rawBody, 'sha256=abcdef123456');
    expect(isValid).toBe(false);
  });
});
