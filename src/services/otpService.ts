import fs from 'fs';
import path from 'path';

interface StoredOtp {
  code: string;
  phoneNumber: string;
  email: string;
  expiresAt: number;
  attempts: number;
}

const CACHE_FILE = path.join(process.cwd(), '.otp_store.json');

function readStore(): Record<string, StoredOtp> {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const content = fs.readFileSync(CACHE_FILE, 'utf-8');
      return JSON.parse(content || '{}');
    }
  } catch (e) {
    // ignore
  }
  return {};
}

function writeStore(store: Record<string, StoredOtp>) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (e) {
    // ignore
  }
}

export function generateAndStoreOtp(tenDigit: string, email: string): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  const store = readStore();
  store[tenDigit] = {
    code,
    phoneNumber: tenDigit,
    email: email.trim().toLowerCase(),
    expiresAt,
    attempts: 0,
  };
  writeStore(store);

  console.log('\n===============================================================');
  console.log(`📲 [SMS OTP Gateway] 6-Digit SMS Code for +91 ${tenDigit}: >>> ${code} <<<`);
  console.log(`   (Valid for 10 minutes | Delivery: SMS Gateway)`);
  console.log('===============================================================\n');

  return code;
}

export function verifyStoredOtp(tenDigit: string, userCode: string): { valid: boolean; error?: string } {
  const cleanCode = (userCode || '').trim();
  const store = readStore();
  const stored = store[tenDigit];

  if (!stored) {
    return { valid: false, error: 'No active OTP found for this number. Please click "Resend OTP".' };
  }

  if (Date.now() > stored.expiresAt) {
    delete store[tenDigit];
    writeStore(store);
    return { valid: false, error: 'OTP has expired. Please request a new verification code.' };
  }

  stored.attempts += 1;
  if (stored.attempts > 5) {
    delete store[tenDigit];
    writeStore(store);
    return { valid: false, error: 'Too many incorrect attempts. Please request a new OTP.' };
  }

  if (stored.code !== cleanCode) {
    writeStore(store);
    return { valid: false, error: `Incorrect verification code. Please check the SMS sent to your phone and try again.` };
  }

  // Valid! Delete after successful verification
  delete store[tenDigit];
  writeStore(store);
  return { valid: true };
}
