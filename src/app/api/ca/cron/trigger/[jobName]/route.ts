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
  const { jobName } = params;

  try {
    let result: any = {};
    if (jobName === 'compliance') {
      result = await runComplianceEngine();
    } else if (jobName === 'documents') {
      result = await runDocumentChasingEngine();
    } else if (jobName === 'leads') {
      result = await runLeadFollowupEngine();
    } else if (jobName === 'invoices') {
      result = await runInvoiceRecoveryEngine();
    } else {
      return NextResponse.json({ error: 'Unknown job name' }, { status: 400 });
    }

    return NextResponse.json({ success: true, jobName, executionResult: result });
  } catch (err: any) {
    console.error(`[CA Cron Trigger Error - ${jobName}]:`, err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
