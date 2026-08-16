import { Groq } from 'groq-sdk';
import { ENV } from './env';

if (!ENV.GROQ_API_KEY) {
  console.warn('⚠️ [Groq] GROQ_API_KEY missing in .env');
}

export const groq = new Groq({
  apiKey: ENV.GROQ_API_KEY || 'placeholder-api-key',
});
