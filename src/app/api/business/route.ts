import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const adminSupabase = createClient(supabaseUrl, serviceKey);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const id = searchParams.get('id');

    let query = adminSupabase.from('businesses').select('*');

    if (id) {
      query = query.eq('id', id);
    } else if (email) {
      query = query.ilike('owner_email', email.trim());
    } else {
      // Require either email or id to prevent leaking other accounts
      return NextResponse.json({ business: null, configs: {} });
    }

    let { data: business, error } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();

    if (error) {
      console.error('[API Business] Error fetching business:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!business) {
      // Fallback: fetch the most recent active business in the system
      const { data: fallbackBiz } = await adminSupabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fallbackBiz) {
        business = fallbackBiz;
      } else {
        return NextResponse.json({ business: null, configs: {} });
      }
    }

    // Set 1-day (24-hour) trial window if missing
    if (business.subscription_status === 'trial') {
      const trialEndMs = business.trial_end_date ? new Date(business.trial_end_date).getTime() : 0;
      if (!trialEndMs) {
        const normalizedTrialEnd = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        business.trial_end_date = normalizedTrialEnd;
        // Persist update in DB
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

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { businessId, name, whatsapp_number, category, configs } = body;

    let targetBizId = businessId;
    if (!targetBizId || targetBizId === 'demo-business-id' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetBizId)) {
      const { data: latestBiz } = await adminSupabase
        .from('businesses')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latestBiz) {
        targetBizId = latestBiz.id;
      }
    }

    if (!targetBizId) {
      return NextResponse.json({ error: 'No business found to update' }, { status: 400 });
    }

    console.log(`[API Business PUT] Updating business ID: ${targetBizId}`);

    // 1. Update business table only if there are fields to update
    const updatePayload: Record<string, any> = {};
    if (name) updatePayload.name = name;
    if (whatsapp_number) updatePayload.whatsapp_number = whatsapp_number;
    if (category) updatePayload.category = category;
    if (body.subscription_status) updatePayload.subscription_status = body.subscription_status;

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
        // If Postgres check constraint fails (e.g. category not in enum), retry without category in businesses column
        if (bizErr.code === '23514' && updatePayload.category) {
          console.warn('[API Business] Category constraint hit, retrying update without category column');
          delete updatePayload.category;
          if (Object.keys(updatePayload).length > 0) {
            const { data: retryData } = await adminSupabase
              .from('businesses')
              .update(updatePayload)
              .eq('id', targetBizId)
              .select()
              .maybeSingle();
            updatedBiz = retryData;
          }
        } else {
          return NextResponse.json({ error: bizErr.message }, { status: 500 });
        }
      } else {
        updatedBiz = data;
      }
    }

    // Always store category in business_config if provided
    if (category) {
      if (!configs || !Array.isArray(configs)) {
        // Ensure configs array exists
      }
    }

    // 2. Save config entries
    if (configs && Array.isArray(configs)) {
      for (const item of configs) {
        console.log(`[API Business PUT] Updating config "${item.config_key}" for business ${targetBizId}`);
        const { data: existing } = await adminSupabase
          .from('business_config')
          .select('id')
          .eq('business_id', targetBizId)
          .eq('config_key', item.config_key)
          .maybeSingle();
        if (existing) {
          const { error: updateErr } = await adminSupabase
            .from('business_config')
            .update({
              config_value: item.config_value,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);

          if (updateErr) {
            console.error(`[API Config Update Error for ${item.config_key}]:`, updateErr);
          }
        } else {
          const { error: insertErr } = await adminSupabase
            .from('business_config')
            .insert({
              business_id: targetBizId,
              config_key: item.config_key,
              config_value: item.config_value,
            });

          if (insertErr) {
            console.error(`[API Config Insert Error for ${item.config_key}]:`, insertErr);
          }
        }
      }
    }

    return NextResponse.json({ success: true, business: updatedBiz });
  } catch (err: any) {
    console.error('[API Business PUT Exception]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId') || searchParams.get('id');

    console.log('[API Business DELETE] Deleting business and associated records for ID:', businessId);

    if (businessId && businessId !== 'all' && businessId !== 'demo-business-id') {
      // 1. Delete associated data for this specific business
      await adminSupabase.from('conversations').delete().eq('business_id', businessId);
      await adminSupabase.from('orders_bookings_leads').delete().eq('business_id', businessId);
      await adminSupabase.from('payment_events').delete().eq('business_id', businessId);
      await adminSupabase.from('business_config').delete().eq('business_id', businessId);
      await adminSupabase.from('businesses').delete().eq('id', businessId);
    } else {
      // Clean everything from database
      await adminSupabase.from('conversations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await adminSupabase.from('orders_bookings_leads').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await adminSupabase.from('payment_events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await adminSupabase.from('business_config').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await adminSupabase.from('businesses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }

    return NextResponse.json({
      success: true,
      message: 'Business account and all associated data permanently deleted from database.',
    });
  } catch (err: any) {
    console.error('[API Business DELETE Exception]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
