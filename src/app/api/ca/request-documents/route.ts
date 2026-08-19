import { NextResponse } from 'next/server';
import { requestClientDocuments } from '@/services/caService';

export async function POST(req: Request) {
  try {
    const { business_id, client_id, client_name, phone, email, compliance_type, documents, firm_name } = await req.json();

    if ((!client_id && !client_name && !phone) || !documents || !Array.isArray(documents)) {
      return NextResponse.json({ error: 'Missing client info or documents array' }, { status: 400 });
    }

    const result = await requestClientDocuments({
      businessId: business_id,
      clientId: client_id,
      clientName: client_name,
      phone: phone,
      email: email,
      complianceType: compliance_type || 'GST-3B',
      documents,
      firmName: firm_name || 'Our CA Firm',
    });

    return NextResponse.json({ success: true, count: result.createdCount, message: result.message });
  } catch (err: any) {
    console.error('[CA Request Documents API Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
