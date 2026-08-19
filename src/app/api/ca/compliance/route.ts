import { NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    let query = supabase
      .from('ca_compliance_calendar')
      .select('*')
      .order('due_date', { ascending: true });

    if (businessId && businessId !== 'demo-business-id') {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(businessId)) {
        query = query.eq('business_id', businessId);
      }
    }

    const { data, error } = await query;
    if (error) {
      console.warn('[CA Compliance API] Fetch notice:', error.message);
      return NextResponse.json({ compliances: [] });
    }

    return NextResponse.json({ compliances: data || [] });
  } catch (err: any) {
    console.error('[CA Compliance API Error]:', err);
    return NextResponse.json({ compliances: [] });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, status, acknowledgement_number, business_id, client_name, phone, email, compliance_type, due_date } = body;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validBusinessId = business_id && uuidRegex.test(business_id) && business_id !== 'demo-business-id'
      ? business_id
      : null;

    if (id) {
      const updates: any = { status };
      if (acknowledgement_number) updates.acknowledgement_number = acknowledgement_number;

      const { data, error } = await supabase
        .from('ca_compliance_calendar')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, compliance: data });
    } else {
      const { data, error } = await supabase
        .from('ca_compliance_calendar')
        .insert({
          business_id: validBusinessId,
          client_name,
          phone,
          email: email || null,
          compliance_type,
          due_date,
          status: status || 'Pending',
          reminder_count: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, compliance: data });
    }
  } catch (err: any) {
    console.error('[CA Compliance Save Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('ca_compliance_calendar')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Compliance record deleted' });
  } catch (err: any) {
    console.error('[CA Compliance Delete Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
