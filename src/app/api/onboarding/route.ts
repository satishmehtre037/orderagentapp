import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Admin client using service role key to safely bypass RLS
const adminSupabase = createClient(supabaseUrl, serviceKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { data, ownerEmail } = body;

    console.log('[API Onboarding] Processing business for owner:', ownerEmail);

    const resolvedEmail = ownerEmail || 'owner@bizbotos.in';

    // 1. Check if this owner already has a business (lookup by email)
    const { data: existingBusiness } = await adminSupabase
      .from('businesses')
      .select('id, whatsapp_number')
      .eq('owner_email', resolvedEmail)
      .maybeSingle();

    let businessId: string;

    // 1-day (24-hour) free trial window
    const oneDayFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    if (existingBusiness) {
      // Owner already has a business — UPDATE it
      console.log('[API Onboarding] Existing business found, updating:', existingBusiness.id);
      const { data: updatedBiz, error: updateErr } = await adminSupabase
        .from('businesses')
        .update({
          name: data.business_name,
          category: data.category,
          whatsapp_number: data.whatsapp_number,
          subscription_status: 'trial',
          trial_end_date: oneDayFromNow,
        })
        .eq('id', existingBusiness.id)
        .select('id')
        .single();

      if (updateErr) {
        console.error('[API Onboarding Error] Business update error:', updateErr);
        return NextResponse.json({ error: updateErr.message }, { status: 400 });
      }
      businessId = updatedBiz.id;
      console.log('[API Onboarding] Business updated successfully. ID:', businessId);
    } else {
      // New owner — INSERT fresh business row
      console.log('[API Onboarding] No existing business found, inserting new...');
      const { data: newBiz, error: insertErr } = await adminSupabase
        .from('businesses')
        .insert([{
          name: data.business_name,
          category: data.category,
          whatsapp_number: data.whatsapp_number,
          owner_email: resolvedEmail,
          subscription_status: 'trial',
          trial_end_date: oneDayFromNow,
        }])
        .select('id')
        .single();

      if (insertErr) {
        console.error('[API Onboarding Error] Business insert error:', insertErr);
        return NextResponse.json({ error: insertErr.message }, { status: 400 });
      }
      businessId = newBiz.id;
      console.log('[API Onboarding] Business inserted. ID:', businessId);
    }

    // 2. Build category configs to insert into business_config
    const configRows: Array<{ business_id: string; config_key: string; config_value: any }> = [
      {
        business_id: businessId,
        config_key: 'hours',
        config_value: data.hours || '9:00 AM - 9:00 PM',
      },
      {
        business_id: businessId,
        config_key: 'faqs',
        config_value: data.faqs || [],
      },
    ];

    if (data.category === 'bakery') {
      configRows.push({
        business_id: businessId,
        config_key: 'menu_items',
        config_value: data.menu_items || [],
      });
    } else if (data.category === 'salon') {
      configRows.push({
        business_id: businessId,
        config_key: 'services',
        config_value: data.services || [],
      });
      configRows.push({
        business_id: businessId,
        config_key: 'staff',
        config_value: data.staff || [],
      });
    } else if (data.category === 'tuition') {
      configRows.push({
        business_id: businessId,
        config_key: 'course_list',
        config_value: data.courses || [],
      });
      configRows.push({
        business_id: businessId,
        config_key: 'admission_process',
        config_value: data.admission_process || '',
      });
    } else if (data.category === 'gym') {
      configRows.push({
        business_id: businessId,
        config_key: 'gym_plans',
        config_value: data.gym_plans || [],
      });
      configRows.push({
        business_id: businessId,
        config_key: 'staff',
        config_value: data.staff || [],
      });
    } else if (data.category === 'cafe') {
      configRows.push({
        business_id: businessId,
        config_key: 'cafe_menu',
        config_value: data.cafe_menu || [],
      });
    }

    // 3. Upsert config rows using admin client (update if config_key already exists for this business)
    const { error: configErr } = await adminSupabase
      .from('business_config')
      .upsert(configRows, { onConflict: 'business_id,config_key' });

    if (configErr) {
      console.error('[API Onboarding Error] Config insert error:', configErr);
      return NextResponse.json({ error: configErr.message }, { status: 400 });
    }

    console.log('[API Onboarding] Successfully saved all config rows!');
    return NextResponse.json({ success: true, businessId });
  } catch (err: any) {
    console.error('[API Onboarding Exception]:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
