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
      console.warn('[CA Compliance API] Fetch notice (check table):', error.message);
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

    if (id) {
      const updates: any = { status };
      if (acknowledgement_number) updates.acknowledgement_number = acknowledgement_number;

      const { data, error } = await adminSupabase
        .from('ca_compliance_calendar')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, compliance: data });
    } else {
      const { data, error } = await adminSupabase
        .from('ca_compliance_calendar')
        .insert({
          business_id: business_id || null,
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
