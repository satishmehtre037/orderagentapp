import { groq } from '../config/groq.js';
import { ENV } from '../config/env.js';

/**
 * Downloads media binary buffer from Meta WhatsApp Cloud API
 */
export async function downloadWhatsAppMedia(mediaId: string): Promise<{ buffer: Buffer; mimeType: string }> {
  const token = process.env.WHATSAPP_CLOUD_API_TOKEN;
  if (!token) {
    throw new Error('[Whisper Service Error] WHATSAPP_CLOUD_API_TOKEN is not configured.');
  }

  console.log(`[Whisper Service] 📥 Fetching media URL for Media ID: ${mediaId}...`);
  const metaRes = await fetch(`https://graph.facebook.com/v20.0/${mediaId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!metaRes.ok) {
    const errText = await metaRes.text();
    throw new Error(`[Whisper Service Error] Failed to get media URL (${metaRes.status}): ${errText}`);
  }

  const metaData = (await metaRes.json()) as { url?: string; mime_type?: string };
  if (!metaData.url) {
    throw new Error(`[Whisper Service Error] No download URL returned for Media ID: ${mediaId}`);
  }

  console.log(`[Whisper Service] 📥 Downloading audio stream from Meta CDN...`);
  const mediaRes = await fetch(metaData.url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!mediaRes.ok) {
    throw new Error(`[Whisper Service Error] Failed to download audio binary (${mediaRes.status})`);
  }

  const arrayBuffer = await mediaRes.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    mimeType: metaData.mime_type || 'audio/ogg',
  };
}

/**
 * Transcribes audio buffer using Groq Whisper (whisper-large-v3-turbo / whisper-large-v3)
 * Specially tuned for Indian accents, Hinglish, and vernacular WhatsApp voice notes
 */
export async function transcribeAudioWithGroq(
  audioBuffer: Buffer,
  filename: string = 'voicenote.ogg'
): Promise<string> {
  if (!ENV.GROQ_API_KEY) {
    throw new Error('[Whisper Service Error] GROQ_API_KEY is not configured in environment.');
  }

  console.log(`[Whisper Service] 🎙️ Processing audio buffer (${audioBuffer.byteLength} bytes) with Groq Whisper...`);

  // Create a File-like Blob for Groq SDK
  const uint8Array = new Uint8Array(audioBuffer);
  const blob = new Blob([uint8Array], { type: 'audio/ogg' });
  const file = new File([blob], filename, { type: 'audio/ogg' });

  const whisperModels = ['whisper-large-v3-turbo', 'whisper-large-v3'];

  for (const model of whisperModels) {
    try {
      console.log(`[Whisper Service] Sending audio to Groq model: ${model}...`);
      const transcription: any = await groq.audio.transcriptions.create({
        file,
        model,
        prompt:
          'Hinglish, Hindi, Indian English, Marathi, Tamil, Telugu, WhatsApp voice note ordering food, salon booking, cake, gym membership, bhaiya, parcel, delivery',
        response_format: 'text',
        temperature: 0.0,
      });

      const resultText: string =
        typeof transcription === 'string'
          ? transcription.trim()
          : typeof transcription?.text === 'string'
          ? transcription.text.trim()
          : '';

      if (resultText) {
        console.log(`[Whisper Service] ✅ Transcription successful (${model}): "${resultText}"`);
        return resultText;
      }
    } catch (err: any) {
      console.warn(`[Whisper Service Warning] Model "${model}" failed:`, err?.message || err);
    }
  }

  throw new Error('[Whisper Service Error] All Groq Whisper models failed to transcribe audio.');
}
