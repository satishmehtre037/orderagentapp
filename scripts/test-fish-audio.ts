import 'dotenv/config';
import { experimental_generateSpeech as generateSpeech } from 'ai';
import { writeFile } from 'node:fs/promises';

async function main() {
  const token = process.env.VERCEL_AI_GATEWAY_TOKEN;
  console.log('🎙️ Testing Fish Audio s2.1-pro-free via Vercel AI Gateway...');
  console.log('Using Token:', token?.slice(0, 10) + '...');

  try {
    process.env.AI_GATEWAY_API_KEY = token;
    const result = await generateSpeech({
      model: 'fish-audio/s2.1-pro-free' as any,
      text: 'Namaste Satish ji! Welcome to WebCore Studios. This is Fish Audio S2.1 Pro generating high-definition audio for your AI platform.',
    });

    console.log('✅ Speech generated successfully!');
    if (result?.audio?.uint8Array) {
      await writeFile('fish_audio_test.mp3', result.audio.uint8Array);
      console.log('📁 Saved to fish_audio_test.mp3');
    }
  } catch (err: any) {
    console.error('Generation Note:', err.message);
  }
}

main();
