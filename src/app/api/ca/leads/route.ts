import { NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    let query = supabase
      .from('ca_leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (businessId && businessId !== 'demo-business-id') {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(businessId)) {
        query = query.eq('business_id', businessId);
      }
    }

    const { data, error } = await query;
    if (error) {
      console.warn('[CA Leads API] Fetch notice:', error.message);
      return NextResponse.json({ leads: [] });
    }

    return NextResponse.json({ leads: data || [] });
  } catch (err: any) {
    console.error('[CA Leads API Error]:', err);
    return NextResponse.json({ leads: [] });
  }
}
