import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: WebSocket },
});

async function check() {
  console.log('Testing Supabase Connection...');
  const { data: docs, error: docErr } = await supabase.from('ca_documents_tracker').select('*');
  console.log('ca_documents_tracker rows count:', docs?.length, 'error:', docErr?.message);
  console.log('docs:', docs);

  const { data: clients, error: clientErr } = await supabase.from('ca_clients').select('*');
  console.log('ca_clients rows count:', clients?.length, 'error:', clientErr?.message);
  console.log('clients:', clients);

  const { data: compliances, error: compErr } = await supabase.from('ca_compliance_calendar').select('*');
  console.log('ca_compliance_calendar rows count:', compliances?.length, 'error:', compErr?.message);

  const { data: leads, error: leadErr } = await supabase.from('ca_leads').select('*');
  console.log('ca_leads rows count:', leads?.length, 'error:', leadErr?.message);
}

check().catch(console.error);
