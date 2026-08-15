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
      // Fallback to most recent business
      query = query.order('created_at', { ascending: false }).limit(1);
    }

    let { data: business, error } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();

    if (!business) {
      // Fallback to most recent active business in DB
      const { data: latestBiz } = await adminSupabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      business = latestBiz;
    }

    if (error && !business) {
      console.error('[API Business] Error fetching business:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!business) {
      return NextResponse.json({ business: null, configs: {} });
    }

    // Auto-normalize old 30-day trial dates (> 2 hours in future) to 1-hour test trial
    if (business.subscription_status === 'trial') {
      const trialEndMs = business.trial_end_date ? new Date(business.trial_end_date).getTime() : 0;
      if (!trialEndMs || trialEndMs > Date.now() + 2 * 60 * 60 * 1000) {
        const normalizedTrialEnd = new Date(Date.now() + 60 * 60 * 1000).toISOString();
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

    // 1. Update business table
    const { data: updatedBiz, error: bizErr } = await adminSupabase
      .from('businesses')
      .update({
        name,
        whatsapp_number,
      })
      .eq('id', targetBizId)
      .select()
      .maybeSingle();

    if (bizErr) {
      console.error('[API Business Update Error]:', bizErr);
      return NextResponse.json({ error: bizErr.message }, { status: 500 });
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
