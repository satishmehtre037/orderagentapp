import { NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    let query = supabase
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
      console.warn('[CA Clients API] Fetch notice:', error.message);
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

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validBusinessId = business_id && uuidRegex.test(business_id) && business_id !== 'demo-business-id'
      ? business_id
      : null;

    const { data, error } = await supabase
      .from('ca_clients')
      .insert({
        business_id: validBusinessId,
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
