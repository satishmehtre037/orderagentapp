import { NextResponse } from 'next/server';
import {
  runComplianceEngine,
  runDocumentChasingEngine,
  runLeadFollowupEngine,
  runInvoiceRecoveryEngine,
} from '@/services/caCronService';
import { requireCronAuth } from '@/lib/auth/requireBusiness';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ jobName: string }> }
) {
  // Enforce shared secret authorization
  const auth = requireCronAuth(req);
  if (!auth.authorized && auth.errorResponse) {
    return auth.errorResponse;
  }

  const { jobName } = await params;
  const rawJobName = (jobName || '').toLowerCase();

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
      result = await runComplianceEngine();
    }

    return NextResponse.json({ success: true, jobName: rawJobName, executionResult: result });
  } catch (err: any) {
    console.error(`[CA Cron Trigger Error - ${rawJobName}]:`, err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
