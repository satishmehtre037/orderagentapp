import { NextResponse } from 'next/server';
import {
  runHospitalAppointmentReminderScanner,
  runHospitalFeedbackScanner,
  runHospitalMissedFollowupScanner,
} from '@/services/hospitalCronService';
import { requireCronAuth } from '@/lib/auth/requireBusiness';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ jobName: string }> }
) {
  try {
    // Enforce shared secret authorization
    const auth = requireCronAuth(req);
    if (!auth.authorized && auth.errorResponse) {
      return auth.errorResponse;
    }

    const { jobName } = await params;
    const body = await req.json().catch(() => ({}));
    const businessId = body.business_id;

    let result;

    switch (jobName?.toLowerCase()) {
      case 'appointment_reminders':
      case 'appointments':
      case 'reminders':
      case 'deadline_reminders':
        result = await runHospitalAppointmentReminderScanner(businessId);
        break;

      case 'feedback_scanner':
      case 'feedback':
        result = await runHospitalFeedbackScanner(businessId);
        break;

      case 'missed_followup':
      case 'missed':
      case 'voice_calls':
      case 'lead_nurture':
        result = await runHospitalMissedFollowupScanner(businessId);
        break;

      case 'all': {
        const [appts, feed, miss] = await Promise.all([
          runHospitalAppointmentReminderScanner(businessId),
          runHospitalFeedbackScanner(businessId),
          runHospitalMissedFollowupScanner(businessId),
        ]);
        result = {
          job: 'all_hospital_crons',
          success: appts.success && feed.success && miss.success,
          processed: appts.processed + feed.processed + miss.processed,
          timestamp: new Date().toISOString(),
          details: { appts, feed, miss },
        };
        break;
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown hospital cron job '${jobName}'. Available jobs: appointment_reminders, feedback_scanner, missed_followup, all`,
          },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Error triggering hospital cron job:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
