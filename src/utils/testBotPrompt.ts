import { buildSystemPrompt } from '../services/promptBuilder';
import { getResponse } from '../services/groqService';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  const bizId = '5d7fc163-9cc7-4cc4-ab8c-8f33be9b9e70';
  const prompt = await buildSystemPrompt(bizId);
  console.log('\n=== TESTING 3 QUANTITY QUERY ===');
  const reply = await getResponse(prompt, [], 'deliver 3 paneer tikka sandwiches to Hiranandani Estate');
  console.log(reply);
}

test();
