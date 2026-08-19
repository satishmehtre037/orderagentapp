import { NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';
import { sendWhatsAppMessage } from '@/services/whatsappService';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { lead_id, phone, client_name, quotation_text, fee_amount, service, firm_name } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
    }

    const firm = firm_name || 'Apex Tax & Financial Advisors';
    const amountStr = fee_amount ? `₹${Number(fee_amount).toLocaleString('en-IN')}` : 'As discussed';

    const defaultQuote = quotation_text || 
`📋 *Official Engagement Roadmap & Fee Quotation*
From: *${firm}*

Dear *${client_name || 'Valued Prospect'}*,
Thank you for discussing your requirements with our firm for *${service || 'Corporate Compliance & Tax Services'}*.

💼 *Scope of Work & Deliverables:*
• End-to-End Filing & Statutory Verification
• Reconciliation of Financials & Portal Uploads
• Dedicated Partner Review & Audit Representation

💰 *Agreed Professional Fee:* *${amountStr}*

To confirm engagement and initiate onboarding, please reply *"CONFIRM"* or *"PROCEED"* to this chat.

Best regards,
*Senior Partner | ${firm}*`;

    // 1. Send via WhatsApp
    await sendWhatsAppMessage(phone, defaultQuote);

    // 2. Update lead status in CRM
    if (lead_id) {
      await supabase
        .from('ca_leads')
        .update({
          status: 'In-Progress',
          notes: `Quotation of ${amountStr} dispatched on ${new Date().toLocaleDateString('en-IN')}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead_id);
    }

    return NextResponse.json({ success: true, message: 'Quotation dispatched via WhatsApp' });
  } catch (err: any) {
    console.error('[CA Quotation API Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
