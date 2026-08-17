import { Groq } from 'groq-sdk';
import { ENV } from './env';

export function getGroqClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY || ENV.GROQ_API_KEY;
  if (!apiKey || apiKey === 'placeholder-api-key') {
    return null;
  }
  return new Groq({ apiKey });
}

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || ENV.GROQ_API_KEY || 'placeholder-api-key',
});
