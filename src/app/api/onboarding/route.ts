import { NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';

// Admin client using service role key to safely bypass RLS
const adminSupabase = supabase;

/** Trial length. The businesses.trial_end_date default matches this. */
const TRIAL_DAYS = 30;

/**
 * Must stay in step with the businesses_category_check constraint
 * (supabase/migrations/20260828000000_correctness_fixes.sql) and the
 * BusinessCategory type.
 */
const ALLOWED_CATEGORIES = [
  'bakery',
  'cafe',
  'salon',
  'gym',
  'tuition',
  'clinic',
  'hospital',
  'retail',
  'real_estate',
  'ca_firm',
  'custom',
] as const;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const formData = body.formData || body.data || body;
    const resolvedEmail = String(
      body.ownerEmail || body.email || formData.ownerEmail || formData.email || ''
    ).trim();

    // No shared placeholder email. This used to default to 'owner@bizbotos.in',
    // and since the row is looked up by owner_email, every signup that arrived
    // without an email edited the same business record.
    if (!resolvedEmail || !resolvedEmail.includes('@')) {
      return NextResponse.json(
        { error: 'An owner email address is required to create or update a business.' },
        { status: 400 }
      );
    }

    const businessName = formData.business_name || formData.businessName || body.businessName || 'My Business';
    const category = formData.category || body.category || 'bakery';

    // Validated up front, with the real reason. The old code let the insert fail
    // on the CHECK constraint and then silently retried as category 'bakery' —
    // so a hospital signing up was configured as a bakery and told it worked.
    if (!(ALLOWED_CATEGORIES as readonly string[]).includes(String(category))) {
      return NextResponse.json(
        {
          error: `Unsupported category "${category}". Allowed categories: ${ALLOWED_CATEGORIES.join(', ')}.`,
        },
        { status: 400 }
      );
    }

    // Ensure clean phone number
    const rawNumber = formData.whatsapp_number || formData.whatsappNumber || body.whatsappNumber || '';
    const cleanDigits = String(rawNumber).replace(/\D/g, '').replace(/^91/, '');
    const whatsappNumber = cleanDigits ? `+91${cleanDigits}` : rawNumber;

    if (cleanDigits && !/^[6-9]\d{9}$/.test(cleanDigits)) {
      return NextResponse.json(
        { error: `"${rawNumber}" is not a valid 10-digit Indian mobile number.` },
        { status: 400 }
      );
    }

    console.log('[API Onboarding] Processing business for owner:', resolvedEmail, {
      businessName,
      category,
      whatsappNumber,
    });

    // 1. Check if this owner already has a business (lookup by email first, then by whatsapp_number)
    const { data: existingByEmail } = await adminSupabase
      .from('businesses')
      .select('id, whatsapp_number')
      .ilike('owner_email', resolvedEmail)
      .maybeSingle();

    const { data: existingByPhone } = whatsappNumber
      ? await adminSupabase
          .from('businesses')
          .select('id, owner_email')
          .eq('whatsapp_number', whatsappNumber)
          .maybeSingle()
      : { data: null };

    const targetBusinessId = existingByEmail?.id || existingByPhone?.id;
    let businessId: string;

    const trialEndDate = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();

    if (targetBusinessId) {
      // Existing business found by email or phone — UPDATE it
      console.log('[API Onboarding] Existing business found, updating:', targetBusinessId);
      const { data: updatedBiz, error: updateErr } = await adminSupabase
        .from('businesses')
        .update({
          name: businessName,
          category: category,
          whatsapp_number: whatsappNumber,
          owner_email: resolvedEmail,
          subscription_status: 'trial',
          trial_end_date: trialEndDate,
        })
        .eq('id', targetBusinessId)
        .select('id')
        .single();

      if (updateErr) {
        console.error('[API Onboarding Error] Update failed:', updateErr);
        return NextResponse.json({ error: updateErr.message }, { status: 400 });
      }
      businessId = updatedBiz!.id;
      console.log('[API Onboarding] Business updated successfully. ID:', businessId);
    } else {
      // New owner & new number — INSERT fresh business row
      console.log('[API Onboarding] No existing business found, inserting new...');
      const { data: newBiz, error: insertErr } = await adminSupabase
        .from('businesses')
        .insert([
          {
            name: businessName,
            category: category,
            whatsapp_number: whatsappNumber,
            owner_email: resolvedEmail,
            subscription_status: 'trial',
            trial_end_date: trialEndDate,
          },
        ])
        .select('id')
        .single();

      if (insertErr) {
        console.error('[API Onboarding Error] Insert failed:', insertErr);
        if (insertErr.code === '23505' && whatsappNumber) {
          // If unique constraint hit concurrently, update the conflicting row
          console.log('[API Onboarding] Unique number hit on insert, recovering by updating phone owner...');
          const { data: recoveredBiz } = await adminSupabase
            .from('businesses')
            .update({
              name: businessName,
              category: category,
              owner_email: resolvedEmail,
              subscription_status: 'trial',
              trial_end_date: trialEndDate,
            })
            .eq('whatsapp_number', whatsappNumber)
            .select('id')
            .single();

          if (recoveredBiz) {
            businessId = recoveredBiz.id;
          } else {
            return NextResponse.json({ error: insertErr.message }, { status: 400 });
          }
        } else {
          return NextResponse.json({ error: insertErr.message }, { status: 400 });
        }
      } else {
        businessId = newBiz!.id;
        console.log('[API Onboarding] Business inserted. ID:', businessId);
      }
    }

    // 2. Build category configs to insert into business_config
    const configRows: Array<{ business_id: string; config_key: string; config_value: any }> = [
      {
        business_id: businessId,
        config_key: 'category',
        config_value: category,
      },
      {
        business_id: businessId,
        config_key: 'bot_paused',
        config_value: false,
      },
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
    } else if (category === 'clinic' || category === 'hospital' || category === 'ca_firm' || category === 'real_estate' || category === 'custom') {
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
