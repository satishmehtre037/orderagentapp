import { NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';
import { TRIAL_DAYS } from '@/config/plans';

const adminSupabase = supabase;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const id = searchParams.get('id') || searchParams.get('businessId');

    let query = adminSupabase.from('businesses').select('*');

    if (id) {
      if (!UUID_RE.test(id)) {
        return NextResponse.json({ error: 'id must be a UUID.' }, { status: 400 });
      }
      query = query.eq('id', id);
    } else if (email) {
      query = query.ilike('owner_email', email.trim());
    } else {
      // Require either email or id to prevent leaking other accounts
      return NextResponse.json({ business: null, configs: {} });
    }

    const { data: business, error } = await query
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[API Business] Error fetching business:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // No match means no match. This used to fall back to "the most recent
    // business in the system" and return it with every business_config row —
    // so any unrecognised email was answered with another tenant's UPI id, GST
    // number, store address and price list.
    if (!business) {
      return NextResponse.json({ business: null, configs: {} });
    }

    // Backfill a missing trial end date. Was 24 hours; the trial is 30 days and
    // the businesses.trial_end_date column default says so too.
    if (business.subscription_status === 'trial') {
      const trialEndMs = business.trial_end_date ? new Date(business.trial_end_date).getTime() : 0;
      if (!trialEndMs) {
        const normalizedTrialEnd = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();
        business.trial_end_date = normalizedTrialEnd;
        await adminSupabase.from('businesses').update({ trial_end_date: normalizedTrialEnd }).eq('id', business.id);
      }
    }

    // Fetch all business_config rows for this business
    const { data: configsData } = await adminSupabase
      .from('business_config')
      .select('config_key, config_value')
      .eq('business_id', business.id);

    const configMap: Record<string, any> = {};
    (configsData || []).forEach((item) => {
      configMap[item.config_key] = item.config_value;
    });

    if (configMap.category) {
      business.category = configMap.category;
    }

    return NextResponse.json({ business, configs: configMap });
  } catch (err: any) {
    console.error('[API Business Exception]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * PUT — update a business and its config rows.
 *
 * An unusable businessId used to be replaced with "the most recent business in
 * the system", so a request carrying a stale or placeholder id rewrote another
 * tenant's name, WhatsApp number, category and settings. The id is now required
 * to identify a real row.
 */
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { businessId, name, whatsapp_number, category, configs } = body;

    if (!businessId || !UUID_RE.test(String(businessId))) {
      return NextResponse.json(
        { error: 'A valid businessId (UUID) is required to update a business.' },
        { status: 400 }
      );
    }

    const { data: target, error: lookupErr } = await adminSupabase
      .from('businesses')
      .select('id')
      .eq('id', businessId)
      .maybeSingle();

    if (lookupErr) {
      console.error('[API Business PUT] Lookup failed:', lookupErr);
      return NextResponse.json({ error: lookupErr.message }, { status: 500 });
    }
    if (!target) {
      return NextResponse.json({ error: `No business found with id ${businessId}.` }, { status: 404 });
    }

    const targetBizId = target.id;
    console.log(`[API Business PUT] Updating business ID: ${targetBizId}`);

    // 1. Update business table only if there are fields to update
    const updatePayload: Record<string, any> = {};
    if (name) updatePayload.name = name;
    if (category) updatePayload.category = category;
    if (body.subscription_status) updatePayload.subscription_status = body.subscription_status;
    if (typeof body.is_bot_paused === 'boolean') updatePayload.is_bot_paused = body.is_bot_paused;

    if (whatsapp_number) {
      // Normalize number
      const clean = String(whatsapp_number).replace(/\D/g, '').slice(-10);
      const formattedNumber = clean.length === 10 ? `+91${clean}` : whatsapp_number;
      updatePayload.whatsapp_number = formattedNumber;

      // Anti-Collision Check: verify no OTHER business is currently using this number
      const { data: duplicateBiz } = await adminSupabase
        .from('businesses')
        .select('id, name, owner_email')
        .eq('whatsapp_number', formattedNumber)
        .neq('id', targetBizId)
        .maybeSingle();

      if (duplicateBiz) {
        console.warn(
          `[API Business PUT Conflict] WhatsApp number ${formattedNumber} is already in use by business ${duplicateBiz.id} (${duplicateBiz.name})`
        );
        return NextResponse.json(
          {
            error: `The WhatsApp number ${formattedNumber} is already registered and in use by another business account. Each business must connect a unique WhatsApp Business number.`,
          },
          { status: 409 }
        );
      }
    }

    let updatedBiz: any = null;

    if (Object.keys(updatePayload).length > 0) {
      const { data, error: bizErr } = await adminSupabase
        .from('businesses')
        .update(updatePayload)
        .eq('id', targetBizId)
        .select()
        .maybeSingle();

      if (bizErr) {
        console.error('[API Business Update Error]:', bizErr);
        if (bizErr.code === '23505' && whatsapp_number) {
          return NextResponse.json(
            {
              error: `The WhatsApp number is already in use by another business account.`,
            },
            { status: 409 }
          );
        }
        return NextResponse.json({ error: bizErr.message }, { status: 500 });
      }
      updatedBiz = data;
    }

    // 2. Save config entries
    if (configs && Array.isArray(configs)) {
      const rows = configs
        .filter((item: any) => item && item.config_key)
        .map((item: any) => ({
          business_id: targetBizId,
          config_key: item.config_key,
          config_value: item.config_value,
          updated_at: new Date().toISOString(),
        }));

      if (rows.length > 0) {
        // One upsert instead of a select-then-update/insert per key.
        const { error: configErr } = await adminSupabase
          .from('business_config')
          .upsert(rows, { onConflict: 'business_id,config_key' });

        if (configErr) {
          console.error('[API Business PUT] Config upsert failed:', configErr);
          return NextResponse.json(
            { error: `Business saved, but settings could not be stored: ${configErr.message}` },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({ success: true, business: updatedBiz });
  } catch (err: any) {
    console.error('[API Business PUT Exception]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/** Child tables cleared before the business row itself. */
const OWNED_TABLES = [
  'hospital_escalations',
  'hospital_feedback',
  'hospital_voice_calls',
  'hospital_reports',
  'hospital_appointments',
  'hospital_doctors',
  'hospital_patients',
  'ca_compliance_calendar',
  'ca_documents_tracker',
  'ca_leads',
  'ca_clients',
  'ca_query_logs',
  'campaign_targets',
  'campaigns',
  'lead_hunter_leads',
  'conversations',
  'orders_bookings_leads',
  'invoices',
  'payment_events',
  'business_config',
] as const;

/**
 * DELETE — permanently remove one business and everything belonging to it.
 *
 * This route used to treat a missing businessId — or the literal values 'all'
 * and 'demo-business-id' — as an instruction to "clean everything from
 * database": an unauthenticated DELETE with no query string ran
 * `.delete().neq('id', '000...')` against all 16 tables and wiped every
 * tenant's data. There is no longer an all-tenants branch: the id is required
 * and must name one real business.
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId') || searchParams.get('id');

    if (!businessId || !UUID_RE.test(businessId)) {
      return NextResponse.json(
        { error: 'A valid businessId (UUID) is required. This endpoint deletes exactly one business.' },
        { status: 400 }
      );
    }

    const { data: target, error: lookupErr } = await adminSupabase
      .from('businesses')
      .select('id, name')
      .eq('id', businessId)
      .maybeSingle();

    if (lookupErr) {
      console.error('[API Business DELETE] Lookup failed:', lookupErr);
      return NextResponse.json({ error: lookupErr.message }, { status: 500 });
    }
    if (!target) {
      return NextResponse.json({ error: `No business found with id ${businessId}.` }, { status: 404 });
    }

    console.log(`[API Business DELETE] Deleting "${target.name}" (${businessId}) and all associated records.`);

    const failures: string[] = [];

    for (const table of OWNED_TABLES) {
      const { error } = await adminSupabase.from(table).delete().eq('business_id', businessId);
      if (error) {
        // A table or column that does not exist in this deployment is not a failure.
        const isMissingTableOrCol =
          error.code === '42P01' ||
          error.code === '42703' ||
          error.code === 'PGRST205' ||
          error.code === 'PGRST204' ||
          error.code === 'PGRST116' ||
          error.message?.toLowerCase().includes('could not find the table') ||
          error.message?.toLowerCase().includes('does not exist') ||
          error.message?.toLowerCase().includes('column');

        if (isMissingTableOrCol) continue;

        console.error(`[API Business DELETE] Could not clear ${table}:`, error.message);
        failures.push(`${table}: ${error.message}`);
      }
    }

    if (failures.length > 0) {
      // Stop before deleting the parent row so nothing is left orphaned.
      return NextResponse.json(
        {
          error: 'Some associated records could not be deleted, so the business was kept.',
          details: failures,
        },
        { status: 500 }
      );
    }

    const { error: deleteErr } = await adminSupabase.from('businesses').delete().eq('id', businessId);

    if (deleteErr) {
      console.error('[API Business DELETE] Could not delete the business row:', deleteErr.message);
      return NextResponse.json({ error: deleteErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      businessId,
      message: `"${target.name}" and all of its associated data were permanently deleted.`,
    });
  } catch (err: any) {
    console.error('[API Business DELETE Exception]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
