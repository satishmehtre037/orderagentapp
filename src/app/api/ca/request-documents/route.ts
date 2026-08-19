import { NextResponse } from 'next/server';
import { requestClientDocuments } from '@/services/caService';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      business_id,
      businessId,
      client_id,
      clientId,
      client_name,
      clientName,
      phone,
      email,
      compliance_type,
      complianceType,
      documents,
      documentsList,
      firm_name,
      firmName,
    } = body;

    const finalClientName = client_name || clientName;
    const finalClientId = client_id || clientId;
    const finalComplianceType = compliance_type || complianceType || 'GST-3B';
    const finalDocuments = documents || documentsList || [];
    const finalFirmName = firm_name || firmName || 'Apex Tax & Financial Advisors';
    const finalBusinessId = business_id || businessId;

    if ((!finalClientId && !finalClientName && !phone) || !Array.isArray(finalDocuments) || finalDocuments.length === 0) {
      return NextResponse.json({ error: 'Missing client info or documents array' }, { status: 400 });
    }

    const result = await requestClientDocuments({
      businessId: finalBusinessId,
      clientId: finalClientId,
      clientName: finalClientName,
      phone: phone,
      email: email,
      complianceType: finalComplianceType,
      documents: finalDocuments,
      firmName: finalFirmName,
    });

    return NextResponse.json({ success: true, count: result.createdCount, message: result.message });
  } catch (err: any) {
    console.error('[CA Request Documents API Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
