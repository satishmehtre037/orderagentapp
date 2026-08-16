import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { generateInvoicePdfBuffer, InvoiceData } from '../services/invoiceService';

const router = Router();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const adminSupabase = createClient(supabaseUrl, serviceKey);

router.get('/api/invoice/:orderId', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    console.log(`[Express Invoice] Generating PDF for Order ID: ${orderId}`);

    // 1. Fetch order record
    const { data: order, error: orderErr } = await adminSupabase
      .from('orders_bookings_leads')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      console.warn(`[Express Invoice] Order not found for ID: ${orderId}`);
      return res.status(404).json({ error: 'Order not found' });
    }

    // 2. Fetch business profile and configs
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
    const isPaid = details.payment_status === 'paid' || order.status === 'completed';

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
      paymentStatus: isPaid ? 'paid' : 'pending',
      paidAt: details.paid_at,
      items,
      totalAmount,
      fulfillment: details.fulfillment || (details.delivery_address ? 'Delivery' : 'Store Pickup'),
      deliveryAddress: details.delivery_address || details.address || '',
      notes: details.notes || '',
    };

    const pdfBuffer = await generateInvoicePdfBuffer(invoicePayload);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Invoice-${orderId.slice(0, 8)}.pdf"`);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    return res.send(Buffer.from(pdfBuffer));
  } catch (err: any) {
    console.error('[Express Invoice Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate invoice PDF' });
  }
});

export default router;
