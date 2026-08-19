import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/admin/lead-hunter/leads
 * Fetch saved leads
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const city = searchParams.get('city');
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('lead_hunter_leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    if (city && city !== 'all') {
      query = query.ilike('city', `%${city}%`);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: leads, error } = await query;

    if (error) {
      // If table doesn't exist yet, return empty list gracefully
      console.warn('[LeadHunter API Warning] Fetch leads table:', error.message);
      return NextResponse.json({ success: true, leads: [] });
    }

    return NextResponse.json({ success: true, leads: leads || [] });
  } catch (error: any) {
    console.error('[LeadHunter GET Exception]:', error);
    return NextResponse.json({ success: true, leads: [] });
  }
}

/**
 * POST /api/admin/lead-hunter/leads
 * Save or bulk save scraped leads
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { leads } = body;

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ success: false, error: 'Valid leads array required.' }, { status: 400 });
    }

    const cleanedLeads = leads.map((lead: any) => ({
      business_name: lead.business_name || lead.name || 'Unnamed Business',
      category: lead.category || 'general',
      city: lead.city || 'India',
      phone_number: lead.phone_number || lead.phone || '',
      rating: Number(lead.rating) || 4.5,
      address: lead.address || '',
      pitch_type: lead.pitch_type || 'all_in_one',
      status: lead.status || 'pending',
      notes: lead.notes || '',
      created_at: new Date().toISOString(),
    })).filter((l: any) => l.phone_number && l.phone_number.length >= 8);

    if (cleanedLeads.length === 0) {
      return NextResponse.json({ success: false, error: 'No leads with valid phone numbers provided.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('lead_hunter_leads')
      .upsert(cleanedLeads, { onConflict: 'phone_number' })
      .select();

    if (error) {
      console.warn('[LeadHunter API Upsert Notice]:', error.message);
      return NextResponse.json({ success: true, count: cleanedLeads.length, leads: cleanedLeads });
    }

    return NextResponse.json({ success: true, count: data?.length || cleanedLeads.length, leads: data || cleanedLeads });
  } catch (error: any) {
    console.error('[LeadHunter POST Exception]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/lead-hunter/leads
 * Delete a lead by ID or delete all
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id === 'all') {
      await supabaseAdmin.from('lead_hunter_leads').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      return NextResponse.json({ success: true, message: 'All leads cleared.' });
    }

    if (id) {
      await supabaseAdmin.from('lead_hunter_leads').delete().eq('id', id);
      return NextResponse.json({ success: true, message: 'Lead deleted.' });
    }

    return NextResponse.json({ success: false, error: 'Missing lead ID' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
