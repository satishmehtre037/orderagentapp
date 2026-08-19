import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const adminSupabase = createClient(supabaseUrl, serviceKey);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    let query = adminSupabase
      .from('ca_clients')
      .select('*')
      .order('client_name', { ascending: true });

    if (businessId && businessId !== 'demo-business-id') {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(businessId)) {
        query = query.eq('business_id', businessId);
      }
    }

    const { data, error } = await query;
    if (error) {
      console.warn('[CA Clients API] Fetch notice (check table):', error.message);
      return NextResponse.json({ clients: [] });
    }

    return NextResponse.json({ clients: data || [] });
  } catch (err: any) {
    console.error('[CA Clients API Error]:', err);
    return NextResponse.json({ clients: [] });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { business_id, client_name, phone, email, entity_type, gstin, pan, partner_assigned } = body;

    const { data, error } = await adminSupabase
      .from('ca_clients')
      .insert({
        business_id: business_id || null,
        client_name,
        phone,
        email: email || null,
        entity_type: entity_type || 'Proprietorship',
        gstin: gstin || null,
        pan: pan || null,
        partner_assigned: partner_assigned || null,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, client: data });
  } catch (err: any) {
    console.error('[CA Client Create Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
