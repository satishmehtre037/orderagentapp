import { NextResponse } from 'next/server';
import {
  runComplianceEngine,
  runDocumentChasingEngine,
  runLeadFollowupEngine,
  runInvoiceRecoveryEngine,
} from '@/services/caCronService';

export async function POST(
  req: Request,
  { params }: { params: { jobName: string } }
) {
  const rawJobName = (params?.jobName || '').toLowerCase();

  try {
    let result: any = {};

    if (
      rawJobName === 'compliance' ||
      rawJobName === 'deadline_reminders' ||
      rawJobName === 'compliance_countdown'
    ) {
      result = await runComplianceEngine();
    } else if (
      rawJobName === 'documents' ||
      rawJobName === 'document_reminders' ||
      rawJobName === 'document_chasing'
    ) {
      result = await runDocumentChasingEngine();
    } else if (
      rawJobName === 'leads' ||
      rawJobName === 'lead_nurture' ||
      rawJobName === 'lead_followup'
    ) {
      result = await runLeadFollowupEngine();
    } else if (
      rawJobName === 'invoices' ||
      rawJobName === 'invoice_recovery' ||
      rawJobName === 'fee_reminders'
    ) {
      result = await runInvoiceRecoveryEngine();
    } else {
      // Default fallback runs compliance engine safely
      result = await runComplianceEngine();
    }

    return NextResponse.json({ success: true, jobName: rawJobName, executionResult: result });
  } catch (err: any) {
    console.error(`[CA Cron Trigger Error - ${rawJobName}]:`, err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
