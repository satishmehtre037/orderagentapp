import { supabase } from '../src/config/supabase.js';

async function test() {
  const { data, error } = await supabase.from('ca_documents_tracker').select('*');
  console.log('Using src/config/supabase:', data?.length, 'docs, error:', error);
}

test().catch(console.error);
