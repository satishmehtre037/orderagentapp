import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendWhatsAppMessage } from '@/services/whatsappService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const adminSupabase = createClient(supabaseUrl, serviceKey);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId') || searchParams.get('business_id');

    let query = adminSupabase
      .from('orders_bookings_leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (businessId && businessId !== 'demo-business-id') {
      query = query.eq('business_id', businessId);
    }

    const { data: rawOrders, error } = await query;
    if (error) {
      console.error('[API CA Invoices GET Error]:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const invoices = (rawOrders || []).map((ord) => {
      const details = ord.details || {};
      const amount = Number(details.total_amount || details.amount || 0);
      const isPaid = ord.status === 'completed' || details.status === 'Paid';
      const dueDate = details.due_date || ord.created_at?.slice(0, 10);
      
      let overdueDays = 0;
      if (dueDate && !isPaid) {
        const diff = Date.now() - new Date(dueDate).getTime();
        overdueDays = diff > 0 ? Math.floor(diff / (1000 * 60 * 60 * 24)) : 0;
      }

      let status = isPaid ? 'Paid' : overdueDays > 15 ? 'Overdue' : overdueDays > 0 ? 'Due Soon' : 'Due Soon';
      if (details.reminder_sent && !isPaid) status = 'Reminder Sent';

      return {
        id: ord.id,
        clientName: details.client_name || details.customer_name || 'Client',
        phone: ord.customer_number || details.phone || '',
        invoiceNo: details.invoice_no || `INV-${ord.id.slice(0, 8).toUpperCase()}`,
        service: details.service_name || details.service || 'CA Statutory Compliance',
        amount: amount,
        dueDate: dueDate,
        overdueDays: overdueDays,
        status: status,
        created_at: ord.created_at,
      };
    });

    // Calculate live totals
    const totalBilled = invoices.reduce((acc, inv) => acc + inv.amount, 0);
    const totalCollected = invoices.filter((i) => i.status === 'Paid').reduce((acc, inv) => acc + inv.amount, 0);
    const totalOutstanding = totalBilled - totalCollected;

    return NextResponse.json({
      invoices,
      totalBilled,
      totalCollected,
      totalOutstanding,
    });
  } catch (err: any) {
    console.error('[API CA Invoices GET Exception]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      businessId,
      business_id,
      clientName,
      client_name,
      phone,
      service,
      amount,
      dueDate,
      due_date,
      firmName,
    } = body;

    const targetBizId = businessId || business_id || '00000000-0000-0000-0000-000000000000';
    const cName = clientName || client_name || 'Valued Client';
    const cPhone = (phone || '').replace(/[^0-9]/g, '');
    const numAmount = Number(amount || 0);
    const invNo = `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const dDate = dueDate || due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const { data: newRecord, error: insertErr } = await adminSupabase
      .from('orders_bookings_leads')
      .insert({
        business_id: targetBizId,
        customer_number: cPhone,
        type: 'order',
        status: 'confirmed',
        details: {
          client_name: cName,
          customer_name: cName,
          phone: cPhone,
          service_name: service || 'CA Compliance & Advisory',
          total_amount: numAmount,
          amount: numAmount,
          invoice_no: invNo,
          due_date: dDate,
          status: 'Due Soon',
        },
      })
      .select()
      .maybeSingle();

    if (insertErr) {
      console.error('[API CA Invoices POST Error]:', insertErr);
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    // Send WhatsApp Invoice Notice to client
    if (cPhone) {
      const waMsg = `🧾 *New Fee Invoice Issued*\n\nDear ${cName},\nAn invoice has been generated for your professional services:\n\n📌 *Invoice No:* ${invNo}\n💼 *Service:* ${service}\n💰 *Amount Due:* ₹${numAmount.toLocaleString('en-IN')}\n📅 *Due Date:* ${dDate}\n\nKindly process the payment to ensure uninterrupted compliance filings.\n\n— Team ${firmName || 'Sharma & Associates'}`;
      try {
        await sendWhatsAppMessage(cPhone, waMsg);
      } catch (waErr) {
        console.error('[API CA Invoices WA Error]:', waErr);
      }
    }

    return NextResponse.json({ success: true, invoice: newRecord });
  } catch (err: any) {
    console.error('[API CA Invoices POST Exception]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, status, clientName, phone, invoiceNo, amount, firmName } = body;

    if (!id) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    const { data: existing } = await adminSupabase
      .from('orders_bookings_leads')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const updatedDetails = {
      ...(existing.details || {}),
      status: status || 'Paid',
      paid_at: new Date().toISOString(),
    };

    const { error: updateErr } = await adminSupabase
      .from('orders_bookings_leads')
      .update({
        status: 'completed',
        details: updatedDetails,
      })
      .eq('id', id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Send WhatsApp Payment Receipt
    const cPhone = phone || existing.customer_number;
    if (cPhone) {
      const numAmount = amount || updatedDetails.total_amount || 0;
      const waReceipt = `✅ *Payment Received Successfully!*\n\nDear ${clientName || updatedDetails.client_name || 'Client'},\nWe have successfully received your payment of *₹${Number(numAmount).toLocaleString('en-IN')}* for Invoice *${invoiceNo || updatedDetails.invoice_no}*.\n\n🎉 Thank you for your partnership!\n— Team ${firmName || 'Sharma & Associates'}`;
      try {
        await sendWhatsAppMessage(cPhone, waReceipt);
      } catch (waErr) {
        console.error('[API CA Invoices Receipt WA Error]:', waErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[API CA Invoices PUT Exception]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
