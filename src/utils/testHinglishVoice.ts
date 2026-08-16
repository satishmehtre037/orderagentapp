import { buildSystemPrompt } from '../services/promptBuilder.js';
import { getResponse } from '../services/groqService.js';
import dotenv from 'dotenv';
dotenv.config();

async function testHinglishVoiceNote() {
  const bizId = '5d7fc163-9cc7-4cc4-ab8c-8f33be9b9e70'; // CafeDay
  const prompt = await buildSystemPrompt(bizId);

  console.log('================================================================');
  console.log('🧪 TEST 1: Transcribed Voice Note (Hinglish Order with Delivery):');
  console.log('Customer Spoke: "Bhaiya 2 paneer tikka sandwich ready rakhna, delivery Lokmanya Nagar Thane West me chahiye kal sham 5 baje"');
  console.log('================================================================');
  
  const reply1 = await getResponse(
    prompt,
    [],
    'Bhaiya 2 paneer tikka sandwich ready rakhna, delivery Lokmanya Nagar Thane West me chahiye kal sham 5 baje'
  );
  console.log('\n🤖 BOT REPLY:\n' + reply1);

  console.log('\n================================================================');
  console.log('🧪 TEST 2: Casual Hinglish Inquiry:');
  console.log('Customer Asked: "Bhaiya sandwich ka kitna time lagega aur rate kya hai?"');
  console.log('================================================================');
  
  const reply2 = await getResponse(
    prompt,
    [],
    'Bhaiya sandwich ka kitna time lagega aur rate kya hai?'
  );
  console.log('\n🤖 BOT REPLY:\n' + reply2);
}

testHinglishVoiceNote();
