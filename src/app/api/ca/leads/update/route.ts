import { NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { id, status, notes } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ error: 'id and status required' }, { status: 400 });
    }

    const updates: any = { status };
    if (notes) updates.notes = notes;

    const { data, error } = await supabase
      .from('ca_leads')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, lead: data });
  } catch (err: any) {
    console.error('[CA Lead Update API Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
