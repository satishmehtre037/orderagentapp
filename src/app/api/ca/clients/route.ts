import { NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    // 1. Fetch registered clients from ca_clients
    const { data: clientsData } = await supabase
      .from('ca_clients')
      .select('*')
      .order('client_name', { ascending: true });

    // 2. Fetch leads from ca_leads (e.g. prospects and converted leads)
    const { data: leadsData } = await supabase
      .from('ca_leads')
      .select('*')
      .order('name', { ascending: true });

    // 3. Merge & Deduplicate by normalized 10-digit phone
    const clientMap = new Map<string, any>();

    for (const c of (clientsData || [])) {
      const cleanPhone = (c.phone || '').replace(/\D/g, '').slice(-10);
      if (cleanPhone) {
        let cleanName = (c.client_name || '').trim();
        if (cleanName.includes('Lead from Automation')) cleanName = 'Test Client';
        if (cleanName.length > 30) cleanName = cleanName.slice(0, 30);

        clientMap.set(cleanPhone, {
          id: c.id,
          client_name: cleanName || 'Valued Client',
          phone: c.phone,
          email: c.email,
          entity_type: c.entity_type || 'Proprietorship',
          status: c.status || 'Active',
        });
      }
    }

    for (const l of (leadsData || [])) {
      const cleanPhone = (l.phone || '').replace(/\D/g, '').slice(-10);
      if (cleanPhone && !clientMap.has(cleanPhone)) {
        let cleanName = (l.name || '').trim();
        if (cleanName.includes('Lead from Automation') || cleanName.includes('Diagnostic Test')) {
          continue; // Skip internal diagnostic test leads
        }
        if (cleanName.length > 30) cleanName = cleanName.slice(0, 30);

        clientMap.set(cleanPhone, {
          id: l.id,
          client_name: cleanName || 'Valued Client',
          phone: l.phone,
          email: l.email,
          entity_type: l.business_type || 'Proprietorship',
          status: l.status === 'Converted' ? 'Active' : 'Lead',
        });
      }
    }

    const mergedClients = Array.from(clientMap.values()).sort((a, b) =>
      a.client_name.localeCompare(b.client_name)
    );

    return NextResponse.json({ clients: mergedClients });
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
