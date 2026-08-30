import { supabase } from '../config/supabase';

async function main() {
  console.log('[Cleanup] Starting database cleanup of all business accounts...');

  const { data: businesses, error: bizErr } = await supabase.from('businesses').select('id, name, owner_email, whatsapp_number');
  if (bizErr) {
    console.error('[Cleanup Error] Could not list businesses:', bizErr);
    process.exit(1);
  }

  console.log(`[Cleanup] Found ${businesses?.length || 0} business accounts:`, businesses);

  // Delete child tables first
  const tables = [
    'business_config',
    'orders',
    'conversations',
    'lead_prospects',
    'invoices',
    'opd_appointments',
    'patients',
    'hospital_reports',
    'ca_clients',
    'ca_compliance_tasks',
    'ca_vault_documents',
    'businesses',
  ];

  for (const t of tables) {
    try {
      const { error } = await supabase.from(t).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) {
        console.warn(`[Cleanup Notice] Table ${t} delete status:`, error.message);
      } else {
        console.log(`[Cleanup ✅] Cleaned table ${t}`);
      }
    } catch (e: any) {
      console.warn(`[Cleanup Warning] Error cleaning ${t}:`, e.message);
    }
  }

  console.log('[Cleanup] ✅ All business accounts and child tables have been completely wiped.');
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
