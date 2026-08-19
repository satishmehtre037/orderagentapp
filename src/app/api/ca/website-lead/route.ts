import { NextResponse } from 'next/server';
import { handleCALeadInquiry } from '@/services/caService';
import { sendPartnerAlert } from '@/services/partnerAlertService';

export async function POST(req: Request) {
  try {
    const { name, phone, email, message, source, business_id } = await req.json();

    const qualification = await handleCALeadInquiry(
      business_id || '00000000-0000-0000-0000-000000000000',
      phone || '919876543210',
      `Lead from ${source || 'Website'}: Name: ${name}, Email: ${email || 'N/A'}, Message: ${message}`,
      source || 'Website'
    );

    if (qualification.isHot) {
      await sendPartnerAlert({
        type: 'hot_lead',
        title: '🔥 Hot CA Lead Inbound (Website / Portal)',
        details: {
          'Client Name': name,
          'Phone': phone || 'N/A',
          'Requirement': qualification.lead.requirement || message,
          'Urgency': qualification.lead.urgency || 'High',
          'Estimated Entity': qualification.lead.business_type || 'Pvt Ltd / LLP',
          'Source': source || 'Website Contact Form',
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Inquiry received. A representative or our WhatsApp AI assistant will reach out shortly.',
      qualification,
    });
  } catch (err: any) {
    console.error('[CA Website Lead Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
