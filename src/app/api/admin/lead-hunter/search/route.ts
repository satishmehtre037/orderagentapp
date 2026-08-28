import { NextResponse } from 'next/server';
import {
  searchRealLeads,
  persistLeads,
  registerManualLeads,
  LeadSourceUnavailableError,
  ScrapedLead,
} from '@/services/leadSourceService';
import { resolveOperatorBusinessId } from '@/services/businessService';

export type { ScrapedLead };
export const dynamic = 'force-dynamic';

/**
 * Lead sourcing.
 *
 * The previous implementation of this route did not search anything. It walked a
 * hardcoded list of suburbs and specialty templates, glued them into plausible
 * business names, and derived phone numbers arithmetically:
 *
 *     const random8Digits = 10000000 + ((leadCounter * 3847291) % 89999999);
 *     const phoneNumber = `+9198${random8Digits}`;
 *
 * Every "lead" was fictional and every number reached a real, uninvolved person.
 * It now queries Google Places and returns only what Places actually returns.
 * With no API key configured it returns 503 — it never falls back to inventing.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // --- Manual entry path: operator supplies numbers and vouches for them ---
    if (body.mode === 'manual') {
      const entries = Array.isArray(body.entries) ? body.entries : [];
      if (entries.length === 0) {
        return NextResponse.json({ success: false, error: 'No numbers supplied.' }, { status: 400 });
      }

      const consentStatus = body.consentStatus === 'opt_in' ? 'opt_in' : 'legitimate_b2b';
      const businessId = await resolveOperatorBusinessId();

      const { saved, rejected } = await registerManualLeads({
        entries,
        businessId,
        consentStatus,
        consentNote: body.consentNote || '',
      });

      return NextResponse.json({
        success: true,
        source: 'manual',
        count: saved.length,
        leads: saved,
        rejected,
      });
    }

    // --- Google Places path ---
    const { category = 'clinic', city = 'Thane', customQuery, count = 25, noWebsiteOnly = false } = body;

    const result = await searchRealLeads({ category, city, customQuery, count, noWebsiteOnly });

    console.log(
      `[Lead Hunter] Places query "${result.query}" → scanned ${result.scanned}, kept ${result.leads.length} ` +
        `(skipped: ${result.skipped.noPhone} no phone, ${result.skipped.invalidPhone} not mobile, ` +
        `${result.skipped.closed} closed, ${result.skipped.hasWebsite} filtered by website)`
    );

    const businessId = await resolveOperatorBusinessId();
    const leads = await persistLeads(result.leads, businessId);

    return NextResponse.json({
      success: true,
      source: 'google_places',
      query: result.query,
      count: leads.length,
      scanned: result.scanned,
      skipped: result.skipped,
      leads,
      // Sourcing is not consent — the UI must surface this before any dispatch.
      notice:
        leads.length > 0
          ? 'These are real listings with consent_status="none". Record a lawful basis (opt-in or a documented B2B relationship) before contacting them.'
          : 'No results matched. Try a broader query or a different city.',
    });
  } catch (error: any) {
    if (error instanceof LeadSourceUnavailableError) {
      console.error('[Lead Hunter] Source unavailable:', error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 503 });
    }
    console.error('[Lead Hunter Search Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/** Returns previously sourced leads so consent state survives a page refresh. */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limit = Math.min(Number(searchParams.get('limit')) || 200, 500);

    const { supabase } = await import('@/config/supabase');
    let query = supabase
      .from('lead_hunter_leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, count: data?.length || 0, leads: data || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
