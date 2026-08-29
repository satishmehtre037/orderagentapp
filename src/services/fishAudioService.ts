/**
 * Fish Audio AI Voice & Speech Service
 * High-definition, low-latency Text-to-Speech (TTS) and Speech-to-Text (STT) transcription
 * Via Vercel AI Gateway (100% Free promotional tier) & Fish Audio API
 */

export interface FishAudioSpeechOptions {
  text: string;
  model?: 'fish-audio/s2.1-pro-free' | 'fish-audio/s2-pro-free' | 'fish-audio/s1-free';
  voice?: string;
}

export interface FishAudioTranscriptionOptions {
  audioBuffer: Buffer;
  contentType?: string;
}

/**
 * Generate high-definition audio from text using Fish Audio TTS
 */
export async function generateFishAudioSpeech(
  options: FishAudioSpeechOptions
): Promise<{ success: boolean; audioBuffer?: Buffer; error?: string }> {
  try {
    const apiKey = process.env.FISH_AUDIO_API_KEY || process.env.VERCEL_AI_GATEWAY_TOKEN || '';
    const model = options.model || 'fish-audio/s2.1-pro-free';

    console.log(`[Fish Audio] 🎙️ Generating speech using model: ${model}...`);

    const response = await fetch('https://api.fish.audio/v1/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        text: options.text,
        model,
        format: 'mp3',
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[Fish Audio] TTS generation fallback/notice: ${errText}`);
      return { success: false, error: errText };
    }

    const arrayBuffer = await response.arrayBuffer();
    return {
      success: true,
      audioBuffer: Buffer.from(arrayBuffer),
    };
  } catch (err: any) {
    console.error('[Fish Audio] ❌ TTS error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Transcribe customer WhatsApp voice notes or audio recordings into text
 */
export async function transcribeFishAudio(
  options: FishAudioTranscriptionOptions
): Promise<{ success: boolean; text?: string; error?: string }> {
  try {
    const apiKey = process.env.FISH_AUDIO_API_KEY || process.env.VERCEL_AI_GATEWAY_TOKEN || '';

    console.log('[Fish Audio] 🎧 Transcribing audio recording...');

    const response = await fetch('https://api.fish.audio/v1/asr', {
      method: 'POST',
      headers: {
        'Content-Type': options.contentType || 'audio/ogg',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: new Uint8Array(options.audioBuffer),
    });

    if (!response.ok) {
      const errText = await response.text();
      return { success: false, error: errText };
    }

    const data = await response.json();
    return {
      success: true,
      text: data.text || data.transcription || '',
    };
  } catch (err: any) {
    console.error('[Fish Audio] ❌ Transcription error:', err);
    return { success: false, error: err.message };
  }
}
