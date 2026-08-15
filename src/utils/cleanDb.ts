import { supabase } from '../config/supabase.js';

async function clean() {
  console.log('Cleaning up database...');
  const { error: e1 } = await supabase.from('conversations').delete().gte('created_at', '2000-01-01');
  const { error: e2 } = await supabase.from('orders_bookings_leads').delete().gte('created_at', '2000-01-01');
  const { error: e3 } = await supabase.from('payment_events').delete().gte('created_at', '2000-01-01');
  const { error: e4 } = await supabase.from('business_config').delete().neq('config_key', '__dummy__');
  const { error: e5 } = await supabase.from('businesses').delete().gte('created_at', '2000-01-01');

  if (e1 || e2 || e3 || e4 || e5) {
    console.error('Errors encountered:', { e1, e2, e3, e4, e5 });
  } else {
    console.log('✅ ALL business accounts, chat logs, orders, and configs have been successfully deleted!');
  }
  process.exit(0);
}

clean();
