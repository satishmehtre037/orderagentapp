import { NextResponse } from 'next/server';
import { recordInvoicePayment } from '@/services/caService';

export async function POST(req: Request) {
  try {
    const { invoice_id, amount, firm_name } = await req.json();

    if (!invoice_id) {
      return NextResponse.json({ error: 'invoice_id required' }, { status: 400 });
    }

    const result = await recordInvoicePayment({
      invoiceId: invoice_id,
      amountPaid: amount ? Number(amount) : undefined,
      firmName: firm_name || 'Our CA Firm',
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[CA Payment Confirmed Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
