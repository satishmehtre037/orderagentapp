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

    const { data, error } = await supabase
      .from('ca_documents_tracker')
      .select('*')
      .eq('business_id', businessId)
      .order('requested_date', { ascending: false });

    if (error) {
      console.warn('[CA Documents API] Fetch notice:', error.message);
      return NextResponse.json({ documents: [] });
    }

    return NextResponse.json({ documents: data || [] });
  } catch (err: any) {
    console.error('[CA Documents API Error]:', err);
    return NextResponse.json({ documents: [] });
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('ca_documents_tracker')
      .delete()
      .eq('business_id', businessId)
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Document tracker record deleted' });
  } catch (err: any) {
    console.error('[CA Document Delete Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
