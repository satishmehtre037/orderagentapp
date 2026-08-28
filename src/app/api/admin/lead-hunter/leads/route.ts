import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { normalizeIndianPhone, OUTREACH_ALLOWED_CONSENT } from '@/services/optOutService';

export const dynamic = 'force-dynamic';

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
      // Reported rather than swallowed: returning `success: true, leads: []` on a
      // real database error made a broken table look like "no leads yet".
      console.error('[LeadHunter API Error] Fetch leads:', error.message);
      return NextResponse.json({ success: false, leads: [], error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, leads: leads || [] });
  } catch (error: any) {
    console.error('[LeadHunter GET Exception]:', error);
    return NextResponse.json({ success: false, leads: [], error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/lead-hunter/leads
 * Save or bulk save leads.
 *
 * Ratings are stored as null when unknown. This used to default to `4.5`, so a
 * lead with no rating data was displayed to the operator as a 4.5-star business.
 * New rows land with consent_status 'none' — sending requires a lawful basis to
 * be recorded first (see optOutService.checkOutreachAllowed).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { leads } = body;

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ success: false, error: 'Valid leads array required.' }, { status: 400 });
    }

    const cleanedLeads: any[] = [];
    let rejected = 0;

    for (const lead of leads) {
      const phone = normalizeIndianPhone(lead.phone_number || lead.phone || '');
      if (!phone) {
        rejected++;
        continue;
      }

      const rating = Number(lead.rating);
      const reviews = Number(lead.reviews_count ?? lead.user_ratings_total);

      cleanedLeads.push({
        business_name: lead.business_name || lead.name || 'Unnamed Business',
        category: lead.category || 'general',
        city: lead.city || 'India',
        phone_number: phone,
        rating: Number.isFinite(rating) && rating > 0 ? rating : null,
        reviews_count: Number.isFinite(reviews) && reviews >= 0 ? reviews : null,
        address: lead.address || '',
        pitch_type: lead.pitch_type || null,
        status: 'pending',
        source: lead.source || 'manual',
        source_ref: lead.source_ref || null,
        consent_status: 'none',
        notes: lead.notes || '',
      });
    }

    if (cleanedLeads.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No leads with a valid 10-digit Indian mobile number provided.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('lead_hunter_leads')
      .upsert(cleanedLeads, { onConflict: 'phone_number' })
      .select();

    if (error) {
      console.error('[LeadHunter API Upsert Error]:', error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      rejected,
      leads: data || [],
      notice:
        'Stored with consent_status="none". Record an opt-in or a documented B2B basis before contacting these numbers.',
    });
  } catch (error: any) {
    console.error('[LeadHunter POST Exception]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/lead-hunter/leads
 * Record a lawful basis for contacting leads that were sourced with
 * consent_status 'none'.
 *
 * Sourcing a public listing is not consent, so every lead from Google Places
 * lands at 'none' and the campaign worker skips it. This is the only way to move
 * a lead past that gate, and it deliberately requires the operator to type a
 * reason: the note is what makes the decision inspectable later, and the same
 * note is what a TRAI/DLT complaint asks for.
 *
 * Body: { ids: string[], consentStatus: 'opt_in' | 'legitimate_b2b', consentNote: string }
 */
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const ids: string[] = Array.isArray(body.ids) ? body.ids.filter(Boolean) : [];
    const consentStatus = body.consentStatus;
    const consentNote = String(body.consentNote || '').trim();

    if (ids.length === 0) {
      return NextResponse.json({ success: false, error: 'ids[] is required.' }, { status: 400 });
    }

    if (!(OUTREACH_ALLOWED_CONSENT as readonly string[]).includes(consentStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `consentStatus must be one of: ${OUTREACH_ALLOWED_CONSENT.join(', ')}. ` +
            'Use the opt-out flow to suppress a number instead.',
        },
        { status: 400 }
      );
    }

    if (consentNote.length < 10) {
      return NextResponse.json(
        {
          success: false,
          error:
            'A consent note of at least 10 characters is required — record where the opt-in came from, ' +
            'or what the existing business relationship is.',
        },
        { status: 400 }
      );
    }

    // Anyone already on the suppression list stays suppressed. An operator
    // marking a batch as "legitimate_b2b" must not be able to undo a STOP.
    const { data: rows, error: readErr } = await supabaseAdmin
      .from('lead_hunter_leads')
      .select('id, phone_number, consent_status')
      .in('id', ids);

    if (readErr) {
      console.error('[LeadHunter PATCH] Lookup failed:', readErr.message);
      return NextResponse.json({ success: false, error: readErr.message }, { status: 500 });
    }

    const optedOut = (rows || []).filter((r: any) => r.consent_status === 'opted_out');
    const updatable = (rows || []).filter((r: any) => r.consent_status !== 'opted_out').map((r: any) => r.id);
    const notFound = ids.filter((id) => !(rows || []).some((r: any) => r.id === id));

    if (updatable.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'None of those leads can be updated (already opted out, or no longer present).',
          skippedOptedOut: optedOut.length,
          notFound: notFound.length,
        },
        { status: 409 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('lead_hunter_leads')
      .update({
        consent_status: consentStatus,
        consent_note: consentNote,
        consent_recorded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .in('id', updatable)
      .select('id, business_name, phone_number, consent_status, consent_note, consent_recorded_at');

    if (error) {
      console.error('[LeadHunter PATCH] Update failed:', error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    console.log(
      `[LeadHunter] Consent "${consentStatus}" recorded for ${data?.length || 0} lead(s): ${consentNote.slice(0, 80)}`
    );

    return NextResponse.json({
      success: true,
      updated: data?.length || 0,
      skippedOptedOut: optedOut.length,
      notFound: notFound.length,
      leads: data || [],
    });
  } catch (error: any) {
    console.error('[LeadHunter PATCH Exception]:', error);
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
