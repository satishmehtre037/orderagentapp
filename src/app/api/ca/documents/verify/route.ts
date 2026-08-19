import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const adminSupabase = createClient(supabaseUrl, serviceKey);

export async function POST(req: Request) {
  try {
    const { doc_id, status } = await req.json();
    if (!doc_id || !status) {
      return NextResponse.json({ error: 'doc_id and status required' }, { status: 400 });
    }

    const { data, error } = await adminSupabase
      .from('ca_documents_tracker')
      .update({ status })
      .eq('id', doc_id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, document: data });
  } catch (err: any) {
    console.error('[CA Verify Doc API Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
