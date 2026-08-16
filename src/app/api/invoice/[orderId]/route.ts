import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateInvoicePdfBuffer, InvoiceData } from '../../../../services/invoiceService.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const adminSupabase = createClient(supabaseUrl, serviceKey);

export async function GET(
  _req: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // 1. Fetch order record
    const { data: order, error: orderErr } = await adminSupabase
      .from('orders_bookings_leads')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 2. Fetch business information & configs
    const { data: business } = await adminSupabase
      .from('businesses')
      .select('*')
      .eq('id', order.business_id)
      .single();

    const { data: configsData } = await adminSupabase
      .from('business_config')
      .select('config_key, config_value')
      .eq('business_id', order.business_id);

    const configMap: Record<string, any> = {};
    (configsData || []).forEach((c) => {
      configMap[c.config_key] = c.config_value;
    });

    const details = order.details || {};
    const items = details.items || (details.service ? [{ name: details.service, quantity: 1, price: details.price }] : []);
    const totalAmount = details.total || details.price || 0;

    const invoicePayload: InvoiceData = {
      orderId: order.id,
      businessName: business?.name || 'Store',
      businessCategory: business?.category || 'General Store',
      businessPhone: business?.whatsapp_number || '',
      gstNumber: configMap.gst_number || configMap.tax_id || '',
      storeAddress: configMap.address || configMap.store_address || '',
      upiId: configMap.upi_id || '',
      customerNumber: order.customer_number,
      createdAt: order.created_at,
      type: order.type,
      status: order.status,
      paymentStatus: details.payment_status || (order.status === 'completed' ? 'paid' : 'pending'),
      paidAt: details.paid_at,
      items,
      totalAmount,
      fulfillment: details.fulfillment || (details.delivery_address ? 'Delivery' : 'Store Pickup'),
      deliveryAddress: details.delivery_address || details.address || '',
      notes: details.notes || '',
    };

    const pdfBuffer = await generateInvoicePdfBuffer(invoicePayload);

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Invoice-${orderId.slice(0, 8)}.pdf"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err: any) {
    console.error('[Invoice API Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
