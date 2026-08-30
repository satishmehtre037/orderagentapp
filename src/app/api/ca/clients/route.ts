import { NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';
import { requireBusiness } from '@/lib/auth/requireBusiness';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const auth = await requireBusiness(req);
    if (auth.errorResponse) {
      return auth.errorResponse;
    }
    const { businessId } = auth;

    // 1. Fetch registered clients from ca_clients scoped to business
    const { data: clientsData } = await supabase
      .from('ca_clients')
      .select('*')
      .eq('business_id', businessId)
      .order('client_name', { ascending: true });

    // 2. Fetch leads from ca_leads scoped to business
    const { data: leadsData } = await supabase
      .from('ca_leads')
      .select('*')
      .eq('business_id', businessId)
      .order('name', { ascending: true });

    // 3. Merge & Deduplicate by normalized 10-digit phone
    const clientMap = new Map<string, any>();

    for (const c of (clientsData || [])) {
      const cleanPhone = (c.phone || '').replace(/\D/g, '').slice(-10);
      if (cleanPhone) {
        let cleanName = (c.client_name || '').trim();
        if (cleanName.includes('Lead from Automation')) cleanName = 'Test Client';
        if (cleanName.length > 30) cleanName = cleanName.slice(0, 30);

        const matchingLead = (leadsData || []).find((l: any) => {
          const lPhone = (l.phone || '').replace(/\D/g, '').slice(-10);
          return lPhone === cleanPhone;
        });

        clientMap.set(cleanPhone, {
          id: c.id,
          client_name: cleanName || 'Valued Client',
          phone: c.phone,
          email: c.email,
          entity_type: c.entity_type || matchingLead?.business_type || 'Proprietorship',
          status: c.status || 'Active',
          requirement: matchingLead?.requirement || c.notes || matchingLead?.notes || '',
        });
      }
    }

    for (const l of (leadsData || [])) {
      const cleanPhone = (l.phone || '').replace(/\D/g, '').slice(-10);
      if (cleanPhone && !clientMap.has(cleanPhone)) {
        let cleanName = (l.name || '').trim();
        if (cleanName.includes('Lead from Automation') || cleanName.includes('Diagnostic Test')) {
          continue;
        }
        if (cleanName.length > 30) cleanName = cleanName.slice(0, 30);

        clientMap.set(cleanPhone, {
          id: l.id,
          client_name: cleanName || 'Prospect Client',
          phone: l.phone,
          email: l.email,
          entity_type: l.business_type || 'Proprietorship',
          status: l.status === 'Converted' ? 'Active' : (l.status || 'Active'),
          requirement: l.requirement || l.notes || '',
        });
      }
    }

    const mergedList = Array.from(clientMap.values());
    return NextResponse.json({ success: true, clients: mergedList });
  } catch (err: any) {
    console.error('[CA Clients GET Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireBusiness(req);
    if (auth.errorResponse) {
      return auth.errorResponse;
    }
    const { businessId } = auth;

    const body = await req.json();
    const {
      client_name,
      phone,
      email,
      entity_type,
      gstin,
      pan,
      notes,
    } = body;

    if (!client_name || !phone) {
      return NextResponse.json({ error: 'Client name and phone are required.' }, { status: 400 });
    }

    const cleanPhone = (phone || '').replace(/\D/g, '');

    // Scoped upsert / create
    const { data: existingClient } = await supabase
      .from('ca_clients')
      .select('id')
      .eq('business_id', businessId)
      .eq('phone', phone)
      .maybeSingle();

    let clientRecord: any = null;

    if (existingClient) {
      const { data, error } = await supabase
        .from('ca_clients')
        .update({
          client_name,
          email,
          entity_type,
          gstin,
          pan,
          notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingClient.id)
        .eq('business_id', businessId)
        .select()
        .single();

      if (error) throw error;
      clientRecord = data;
    } else {
      const { data, error } = await supabase
        .from('ca_clients')
        .insert([{
          business_id: businessId,
          client_name,
          phone,
          email,
          entity_type: entity_type || 'Proprietorship',
          gstin,
          pan,
          status: 'Active',
          notes,
        }])
        .select()
        .single();

      if (error) throw error;
      clientRecord = data;
    }

    if (cleanPhone) {
      const last10 = cleanPhone.slice(-10);
      await supabase
        .from('ca_leads')
        .update({
          status: 'Converted',
          updated_at: new Date().toISOString(),
        })
        .eq('business_id', businessId)
        .ilike('phone', `%${last10}%`);
    }

    return NextResponse.json({ success: true, client: clientRecord });
  } catch (err: any) {
    console.error('[CA Client Create Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requireBusiness(req);
    if (auth.errorResponse) {
      return auth.errorResponse;
    }
    const { businessId } = auth;

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId') || searchParams.get('id');
    const phone = searchParams.get('phone');

    if (!clientId && !phone) {
      return NextResponse.json({ error: 'clientId or phone required' }, { status: 400 });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isValidUuid = clientId && uuidRegex.test(clientId);

    if (isValidUuid) {
      await supabase.from('ca_compliance_calendar').delete().eq('business_id', businessId).eq('client_id', clientId);
      await supabase.from('ca_documents_tracker').delete().eq('business_id', businessId).eq('client_id', clientId);
      await supabase.from('ca_query_logs').delete().eq('business_id', businessId).eq('client_id', clientId);
      await supabase.from('ca_clients').delete().eq('business_id', businessId).eq('id', clientId);
    }

    if (phone) {
      const clean = phone.replace(/\D/g, '');
      const last10 = clean.slice(-10);
      if (last10) {
        await supabase.from('ca_compliance_calendar').delete().eq('business_id', businessId).ilike('phone', `%${last10}%`);
        await supabase.from('ca_documents_tracker').delete().eq('business_id', businessId).ilike('phone', `%${last10}%`);
        await supabase.from('ca_query_logs').delete().eq('business_id', businessId).ilike('phone', `%${last10}%`);
        await supabase.from('ca_leads').delete().eq('business_id', businessId).ilike('phone', `%${last10}%`);
        await supabase.from('ca_clients').delete().eq('business_id', businessId).ilike('phone', `%${last10}%`);
      }
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
