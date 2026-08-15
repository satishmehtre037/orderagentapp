import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const adminSupabase = createClient(supabaseUrl, serviceKey);

async function sendWhatsAppStatusNotification(
  customerNumber: string,
  status: string,
  businessName: string,
  details: any
) {
  const token = process.env.WHATSAPP_CLOUD_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId || !customerNumber) return;

  let text = '';
  if (status === 'confirmed') {
    text = `🎉 *Order Confirmed!*\n\nYour order with *${businessName || 'our store'}* has been accepted and is currently being prepared!`;
  } else if (status === 'completed') {
    text = `✅ *Order Completed!*\n\nYour order has been completed / out for delivery. Thank you for choosing *${businessName || 'us'}*!`;
  } else if (status === 'cancelled') {
    text = `❌ *Order Cancelled*\n\nYour order has been marked as cancelled. Please feel free to reach out if you need any further assistance!`;
  }

  if (!text) return;

  try {
    const cleanToNumber = customerNumber.replace(/\D/g, '');
    await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanToNumber,
        type: 'text',
        text: { preview_url: false, body: text },
      }),
    });
  } catch (err) {
    console.error('[WhatsApp Status Notification Error]:', err);
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId || businessId === 'demo-business-id') {
      return NextResponse.json({ orders: [] });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(businessId)) {
      return NextResponse.json({ orders: [] });
    }

    const { data, error } = await adminSupabase
      .from('orders_bookings_leads')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API Orders] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ orders: data || [] });
  } catch (err: any) {
    console.error('[API Orders Exception]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { businessId, type, customer_number, details, status } = body;

    if (!businessId || !customer_number) {
      return NextResponse.json({ error: 'Missing businessId or customer_number' }, { status: 400 });
    }

    const { data, error } = await adminSupabase
      .from('orders_bookings_leads')
      .insert([
        {
          business_id: businessId,
          type: type || 'order',
          customer_number,
          details: details || {},
          status: status || 'new',
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, order: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status, notifyCustomer, businessName } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
    }

    const { data, error } = await adminSupabase
      .from('orders_bookings_leads')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If requested, notify customer on WhatsApp
    if (notifyCustomer && data?.customer_number) {
      sendWhatsAppStatusNotification(data.customer_number, status, businessName, data.details);
    }

    return NextResponse.json({ order: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
