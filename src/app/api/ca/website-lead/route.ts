import { NextResponse } from 'next/server';
import { handleCALeadInquiry } from '@/services/caService';
import { sendPartnerAlert } from '@/services/partnerAlertService';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { name, phone, email, message, source, business_id } = await req.json();

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validBusinessId = business_id && uuidRegex.test(business_id) && business_id !== 'demo-business-id'
      ? business_id
      : undefined;

    const qualification = await handleCALeadInquiry(
      phone || '919876543210',
      message || `Inquiry from ${name || 'Prospect'}: Need urgent CA / Tax Advisory Services`,
      name || 'Website Visitor',
      source || 'Website',
      validBusinessId
    );

    if (qualification.isHot) {
      await sendPartnerAlert({
        type: 'hot_lead',
        title: '🔥 Hot CA Lead Inbound (Website / Portal)',
        details: {
          'Client Name': name || 'Prospective Client',
          'Phone': phone || 'N/A',
          'Requirement': qualification.lead?.requirement || message || 'CA Advisory',
          'Urgency': qualification.lead?.urgency || 'High',
          'Estimated Entity': qualification.lead?.business_type || 'Pvt Ltd / LLP',
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
