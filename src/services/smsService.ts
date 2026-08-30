import { ENV } from '../config/env';

export interface SmsSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Sends a real-time transactional SMS OTP to any 10-digit Indian mobile number via Fast2SMS.
 */
export async function sendFast2SmsOtp(tenDigitPhone: string, otpCode: string): Promise<SmsSendResult> {
  const apiKey = process.env.FAST2SMS_API_KEY || (ENV as any).FAST2SMS_API_KEY || '';
  const cleanNumber = (tenDigitPhone || '').replace(/\D/g, '').slice(-10);

  if (!apiKey) {
    console.warn(`⚠️ [Fast2SMS Gateway] FAST2SMS_API_KEY is not set in .env.`);
    return {
      success: false,
      error: 'FAST2SMS_API_KEY is not configured.',
    };
  }

  // 1. Try OTP Route first
  try {
    const payload = {
      variables_values: otpCode,
      route: 'otp',
      numbers: cleanNumber,
    };

    const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        authorization: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as any;

    if (data?.return === true || data?.status_code === 200 || res.ok) {
      const msgId = data?.request_id || data?.message?.[0] || 'DELIVERED';
      console.log(`📲 [Fast2SMS Gateway] ✅ Real SMS OTP successfully dispatched to +91 ${cleanNumber} (Request ID: ${msgId})`);
      return { success: true, messageId: msgId };
    }

    // 2. If OTP route requires DLT/Website verification, fallback to Quick SMS Route
    if (data?.status_code === 996 || data?.status_code === 999) {
      const quickPayload = {
        route: 'q',
        message: `Your Agento AI staff verification code is ${otpCode}. Valid for 10 minutes.`,
        language: 'english',
        numbers: cleanNumber,
      };

      const quickRes = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quickPayload),
      });

      const quickData = (await quickRes.json()) as any;
      if (quickData?.return === true) {
        console.log(`📲 [Fast2SMS Gateway] ✅ Quick SMS OTP dispatched to +91 ${cleanNumber}`);
        return { success: true, messageId: quickData?.request_id };
      }

      console.warn(`📲 [Fast2SMS Gateway] Notice from Fast2SMS: ${quickData?.message || data?.message}`);
      return { success: false, error: quickData?.message || data?.message };
    }

    return { success: false, error: data?.message || 'Failed to dispatch SMS' };
  } catch (err: any) {
    console.error(`📲 [Fast2SMS Gateway] ❌ Network error while calling Fast2SMS:`, err);
    return { success: false, error: err?.message || 'Network error communicating with Fast2SMS' };
  }
}
