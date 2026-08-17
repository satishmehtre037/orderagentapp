import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMessage } from '@/services/whatsappService';
import { saveConversationMessage } from '@/services/businessService';
import { getCategoryReminderMessage } from '@/lib/constants/categoryPresets';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const adminSupabase = createClient(supabaseUrl, serviceKey);

/**
 * GET /api/reminders?businessId=...
 * Scans past orders to identify customers eligible for re-engagement or renewal
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    }

    const { data: business } = await adminSupabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single();

    const { data: configsData } = await adminSupabase
      .from('business_config')
      .select('config_key, config_value')
      .eq('business_id', businessId);

    const configMap: Record<string, any> = {};
    (configsData || []).forEach((c) => {
      configMap[c.config_key] = c.config_value;
    });

    const category = configMap.category || business?.category || 'bakery';
    const businessName = business?.name || 'Our Business';

    const defaultDays =
      category === 'salon'
        ? 25
        : category === 'gym'
        ? 27
        : category === 'tuition'
        ? 30
        : category === 'real_estate'
        ? 14
        : 7;

    const reminderDays = configMap.reminder_days ? Number(configMap.reminder_days) : defaultDays;

    // Fetch past orders/bookings
    const { data: orders } = await adminSupabase
      .from('orders_bookings_leads')
      .select('*')
      .eq('business_id', businessId)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false });

    // Group by unique customer number and find their most recent order
    const customerMap: Record<string, any> = {};
    (orders || []).forEach((o) => {
      if (!customerMap[o.customer_number]) {
        const orderDate = new Date(o.created_at);
        const daysAgo = Math.floor((Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
        const lastItem = o.details?.items?.[0]?.name || o.details?.service || o.details?.notes || '';

        const suggestedMessage = getCategoryReminderMessage(
          category,
          businessName,
          lastItem,
          configMap.reminder_template
        );

        customerMap[o.customer_number] = {
          customerNumber: o.customer_number,
          lastOrderId: o.id,
          lastOrderDate: o.created_at,
          daysAgo,
          type: o.type,
          lastItem: lastItem || 'Store Item',
          suggestedMessage,
          isDue: daysAgo >= reminderDays,
        };
      }
    });

    const reminderList = Object.values(customerMap);

    return NextResponse.json({
      reminderDays,
      isEnabled: configMap.enable_reminders !== false,
      customers: reminderList,
    });
  } catch (err: any) {
    console.error('[Reminders API Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/reminders
 * Dispatches a personalized WhatsApp re-engagement message to the customer
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { businessId, customerNumber, message, lastItem } = body;

    if (!businessId || !customerNumber) {
      return NextResponse.json({ error: 'Missing required parameters (businessId, customerNumber)' }, { status: 400 });
    }

    let finalMessage = message;

    if (!finalMessage) {
      const { data: business } = await adminSupabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .maybeSingle();

      const { data: configsData } = await adminSupabase
        .from('business_config')
        .select('config_key, config_value')
        .eq('business_id', businessId);

      const configMap: Record<string, any> = {};
      (configsData || []).forEach((c) => {
        configMap[c.config_key] = c.config_value;
      });

      const category = configMap.category || business?.category || 'bakery';
      const businessName = business?.name || 'Our Business';

      finalMessage = getCategoryReminderMessage(
        category,
        businessName,
        lastItem,
        configMap.reminder_template
      );
    }

    console.log(`[API Reminders] 🔄 Sending tailored WhatsApp reminder to ${customerNumber} for business ${businessId}...`);
    await sendMessage(customerNumber, '', finalMessage);
    await saveConversationMessage(businessId, customerNumber, 'outbound', finalMessage);

    return NextResponse.json({ success: true, deliveredTo: customerNumber, message: finalMessage });
  } catch (err: any) {
    console.error('[API Reminders Dispatch Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
