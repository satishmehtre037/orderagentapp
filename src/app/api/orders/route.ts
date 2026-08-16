import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMessage } from '../../../services/whatsappService.js';
import { saveConversationMessage } from '../../../services/businessService.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const adminSupabase = createClient(supabaseUrl, serviceKey);

async function sendWhatsAppStatusNotification(
  customerNumber: string,
  status: string,
  businessName: string,
  details: any,
  businessId?: string,
  orderId?: string
) {
  if (!customerNumber) return;

  let text = '';
  const totalAmount = details?.total ? ` of *₹${details.total}*` : '';
  const invoiceLink = orderId ? `\n\n📄 *Official Bill & Receipt PDF:*\n👉 https://orderagentapp.onrender.com/api/invoice/${orderId}` : '';

  if (status === 'confirmed') {
    text = `🎉 *Order Confirmed!*\n\nYour order with *${businessName || 'our store'}* has been accepted and is currently being prepared!${invoiceLink}`;
  } else if (status === 'completed') {
    text = `✅ *Order Completed!*\n\nYour order has been completed / out for delivery.${invoiceLink}\n\nThank you for choosing *${businessName || 'us'}*!`;
  } else if (status === 'cancelled') {
    text = `❌ *Order Cancelled*\n\nYour order has been marked as cancelled. Please feel free to reach out if you need any further assistance!`;
  } else if (status === 'paid') {
    text = `💳 *Payment Verified & Received!* 🎉\n\nYour UPI payment${totalAmount} for your order with *${businessName || 'our store'}* has been successfully received and verified!${invoiceLink}\n\nThank you for choosing us!`;
  }

  if (!text) return;

  try {
    console.log(`[API Orders] 📲 Dispatching WhatsApp status notification (${status}) to ${customerNumber}...`);
    await sendMessage(customerNumber, '', text);
    if (businessId) {
      await saveConversationMessage(businessId, customerNumber, 'outbound', text);
    }
  } catch (err) {
    console.error('[API Orders WhatsApp Notification Error]:', err);
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
    const { id, status, payment_status, notifyCustomer, businessName } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing order id' }, { status: 400 });
    }

    // Fetch existing order to merge details
    const { data: existingOrder } = await adminSupabase
      .from('orders_bookings_leads')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    const updatePayload: Record<string, any> = {};
    if (status) updatePayload.status = status;

    if (payment_status && existingOrder) {
      const mergedDetails = {
        ...(existingOrder.details || {}),
        payment_status: payment_status,
        paid_at: payment_status === 'paid' ? new Date().toISOString() : undefined,
      };
      updatePayload.details = mergedDetails;
    }

    const { data, error } = await adminSupabase
      .from('orders_bookings_leads')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If requested, notify customer on WhatsApp
    if (notifyCustomer && data?.customer_number) {
      const notifyType = payment_status === 'paid' ? 'paid' : status;
      await sendWhatsAppStatusNotification(
        data.customer_number,
        notifyType,
        businessName,
        data.details,
        data.business_id,
        data.id
      );
    }

    return NextResponse.json({ order: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
