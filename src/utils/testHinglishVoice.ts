import { buildSystemPrompt } from '../services/promptBuilder.js';
import { getResponse } from '../services/groqService.js';
import dotenv from 'dotenv';
dotenv.config();

async function testHinglishVoiceNote() {
  const bizId = '5d7fc163-9cc7-4cc4-ab8c-8f33be9b9e70'; // CafeDay
  const prompt = await buildSystemPrompt(bizId);

  console.log('================================================================');
  console.log('🧪 MESSAGE 1 (First Greeting): "Hi"');
  console.log('================================================================');
  const reply1 = await getResponse(prompt, [], 'Hi');
  console.log('\n🤖 BOT REPLY 1:\n' + reply1);

  console.log('\n================================================================');
  console.log('🧪 MESSAGE 2 (Follow-up Order in ongoing chat):');
  console.log('Customer says: "1 paneer tikka sandwich deliver to Lokmanya Nagar Thane West"');
  console.log('================================================================');
  
  const history = [
    { sender: 'customer', message: 'Hi' },
    { sender: 'assistant', message: reply1 }
  ] as any;

  const reply2 = await getResponse(
    prompt,
    history,
    '1 paneer tikka sandwich deliver to Lokmanya Nagar Thane West'
  );
  console.log('\n🤖 BOT REPLY 2:\n' + reply2);
}

testHinglishVoiceNote();
