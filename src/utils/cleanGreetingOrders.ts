import { supabase } from '../config/supabase';

async function clean() {
  const { data: rows, error } = await supabase.from('orders_bookings_leads').select('*');
  if (error) {
    console.error('Error fetching rows:', error);
    return;
  }

  console.log(`Found ${rows.length} total order/booking records.`);

  for (const r of rows) {
    const detailsStr = JSON.stringify(r.details || {}).toLowerCase();
    if (
      detailsStr.includes('customer greeting') ||
      detailsStr.includes('greeting') ||
      detailsStr.includes('hello') ||
      detailsStr.includes('hi')
    ) {
      console.log(`Deleting invalid record ID: ${r.id} -> ${detailsStr}`);
      await supabase.from('orders_bookings_leads').delete().eq('id', r.id);
    }
  }

  console.log('✅ Cleaned up invalid greeting entries from orders/bookings ledger!');
}

clean();
