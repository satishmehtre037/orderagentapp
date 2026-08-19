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

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId') || searchParams.get('id');
    const phone = searchParams.get('phone');

    if (!clientId && !phone) {
      return NextResponse.json({ error: 'clientId or phone required' }, { status: 400 });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isValidUuid = clientId && uuidRegex.test(clientId);

    // 1. Delete from ca_compliance_calendar
    if (isValidUuid) {
      await supabase.from('ca_compliance_calendar').delete().eq('client_id', clientId);
    }
    if (phone) {
      const clean = phone.replace(/\D/g, '');
      await supabase.from('ca_compliance_calendar').delete().or(`phone.ilike.%${clean}%,phone.ilike.%${clean.slice(-10)}%`);
    }

    // 2. Delete from ca_documents_tracker
    if (isValidUuid) {
      await supabase.from('ca_documents_tracker').delete().eq('client_id', clientId);
    }
    if (phone) {
      const clean = phone.replace(/\D/g, '');
      await supabase.from('ca_documents_tracker').delete().or(`phone.ilike.%${clean}%,phone.ilike.%${clean.slice(-10)}%`);
    }

    // 3. Delete from ca_query_logs
    if (isValidUuid) {
      await supabase.from('ca_query_logs').delete().eq('client_id', clientId);
    }
    if (phone) {
      const clean = phone.replace(/\D/g, '');
      await supabase.from('ca_query_logs').delete().or(`phone.ilike.%${clean}%,phone.ilike.%${clean.slice(-10)}%`);
    }

    // 4. Delete from ca_leads
    if (phone) {
      const clean = phone.replace(/\D/g, '');
      await supabase.from('ca_leads').delete().or(`phone.ilike.%${clean}%,phone.ilike.%${clean.slice(-10)}%`);
    }

    // 5. Delete from ca_clients
    if (isValidUuid) {
      await supabase.from('ca_clients').delete().eq('id', clientId);
    }
    if (phone) {
      const clean = phone.replace(/\D/g, '');
      await supabase.from('ca_clients').delete().or(`phone.ilike.%${clean}%,phone.ilike.%${clean.slice(-10)}%`);
    }

    return NextResponse.json({
      success: true,
      message: 'Client and all associated compliance, documents, and query records deleted successfully.',
    });
  } catch (err: any) {
    console.error('[CA Client Delete Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
