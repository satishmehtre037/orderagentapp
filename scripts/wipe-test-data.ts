import { supabase } from '../src/config/supabase';

async function main() {
  console.log('🧹 Purging all existing business & test records from Supabase...');

  try {
    await supabase.from('conversations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('appointments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('business_configs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('businesses').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const { data } = await supabase.from('businesses').select('id, name, whatsapp_number');
    console.log(`✅ Cleared! Remaining businesses in DB: ${data?.length || 0}`);
  } catch (err: any) {
    console.error('Error during wipe:', err.message);
  }
}

main();
