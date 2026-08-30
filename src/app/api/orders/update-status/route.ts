import { NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';
import { sendMessage } from '@/services/whatsappService';
import { saveConversationMessage } from '@/services/businessService';

const adminSupabase = supabase;

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
    console.log(`[API Orders update-status] 📲 Dispatching WhatsApp status notification (${status}) to ${customerNumber}...`);
    await sendMessage(customerNumber, '', text);
    if (businessId) {
      await saveConversationMessage(businessId, customerNumber, 'outbound', text);
    }
  } catch (err) {
    console.error('[API Orders WhatsApp Notification Error]:', err);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, status, details, notifyCustomer, businessName } = body;

    const id = orderId || body.id;
    if (!id) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    // Fetch existing order to merge details
    const { data: existingOrder } = await adminSupabase
      .from('orders_bookings_leads')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    const updatePayload: Record<string, any> = {};
    if (status) updatePayload.status = status;

    if (details) {
      updatePayload.details = {
        ...(existingOrder?.details || {}),
        ...details,
      };
    }

    const { data, error } = await adminSupabase
      .from('orders_bookings_leads')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[API Orders update-status] Update failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (notifyCustomer && data?.customer_number) {
      const isPaid = data.details?.payment_status === 'paid';
      const notifyType = isPaid ? 'paid' : (status || data.status);
      await sendWhatsAppStatusNotification(
        data.customer_number,
        notifyType,
        businessName || '',
        data.details,
        data.business_id,
        data.id
      );
    }

    return NextResponse.json({ success: true, order: data });
  } catch (err: any) {
    console.error('[API Orders update-status Exception]:', err);
    return NextResponse.json({ error: err.message || 'Failed to update order status' }, { status: 500 });
  }
}
