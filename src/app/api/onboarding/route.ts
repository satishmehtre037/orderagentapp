import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Admin client using service role key to safely bypass RLS
const adminSupabase = createClient(supabaseUrl, serviceKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const formData = body.formData || body.data || body;
    const resolvedEmail = (body.ownerEmail || body.email || formData.ownerEmail || formData.email || 'owner@bizbotos.in').trim();

    const businessName = formData.business_name || formData.businessName || body.businessName || 'My Business';
    const category = formData.category || body.category || 'bakery';
    
    // Ensure clean phone number
    const rawNumber = formData.whatsapp_number || formData.whatsappNumber || body.whatsappNumber || '';
    const cleanDigits = rawNumber.replace(/\D/g, '').replace(/^91/, '');
    const whatsappNumber = cleanDigits ? `+91${cleanDigits}` : rawNumber;

    console.log('[API Onboarding] Processing business for owner:', resolvedEmail, {
      businessName,
      category,
      whatsappNumber,
    });

    // 1. Check if this owner already has a business (lookup by email)
    const { data: existingBusiness } = await adminSupabase
      .from('businesses')
      .select('id, whatsapp_number')
      .ilike('owner_email', resolvedEmail)
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
          name: businessName,
          category: category,
          whatsapp_number: whatsappNumber,
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
          name: businessName,
          category: category,
          whatsapp_number: whatsappNumber,
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
        config_value: formData.hours || 'Mon - Sun, 9:00 AM - 9:00 PM',
      },
      {
        business_id: businessId,
        config_key: 'faqs',
        config_value: formData.faqs || [],
      },
      {
        business_id: businessId,
        config_key: 'upi_id',
        config_value: formData.upi_id || '',
      },
      {
        business_id: businessId,
        config_key: 'auto_send_payment_link',
        config_value: formData.auto_send_payment_link !== false,
      },
      {
        business_id: businessId,
        config_key: 'payment_note',
        config_value: formData.payment_note || '',
      },
      {
        business_id: businessId,
        config_key: 'gst_number',
        config_value: formData.gst_number || '',
      },
      {
        business_id: businessId,
        config_key: 'store_address',
        config_value: formData.store_address || '',
      },
      {
        business_id: businessId,
        config_key: 'enable_reminders',
        config_value: formData.enable_reminders !== false,
      },
      {
        business_id: businessId,
        config_key: 'reminder_days',
        config_value: formData.reminder_days || (category === 'salon' ? 25 : category === 'gym' ? 27 : 7),
      },
      {
        business_id: businessId,
        config_key: 'reminder_template',
        config_value: formData.reminder_template || '',
      },
    ];

    if (category === 'bakery') {
      configRows.push({
        business_id: businessId,
        config_key: 'menu_items',
        config_value: formData.menu_items || [],
      });
    } else if (category === 'salon') {
      configRows.push({
        business_id: businessId,
        config_key: 'services',
        config_value: formData.services || [],
      });
      configRows.push({
        business_id: businessId,
        config_key: 'staff',
        config_value: formData.staff || [],
      });
    } else if (category === 'tuition') {
      configRows.push({
        business_id: businessId,
        config_key: 'course_list',
        config_value: formData.courses || formData.course_list || [],
      });
      configRows.push({
        business_id: businessId,
        config_key: 'admission_process',
        config_value: formData.admission_process || '',
      });
    } else if (category === 'gym') {
      configRows.push({
        business_id: businessId,
        config_key: 'gym_plans',
        config_value: formData.gym_plans || [],
      });
      configRows.push({
        business_id: businessId,
        config_key: 'staff',
        config_value: formData.staff || [],
      });
    } else if (category === 'cafe') {
      configRows.push({
        business_id: businessId,
        config_key: 'cafe_menu',
        config_value: formData.cafe_menu || [],
      });
    } else if (category === 'clinic' || category === 'real_estate' || category === 'custom') {
      configRows.push({
        business_id: businessId,
        config_key: 'services',
        config_value: formData.services || [],
      });
      configRows.push({
        business_id: businessId,
        config_key: 'staff',
        config_value: formData.staff || [],
      });
    } else if (category === 'retail') {
      configRows.push({
        business_id: businessId,
        config_key: 'menu_items',
        config_value: formData.menu_items || [],
      });
    }

    // 3. Upsert config rows using admin client
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
