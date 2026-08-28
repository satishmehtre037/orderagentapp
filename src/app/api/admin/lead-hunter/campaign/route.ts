import { NextResponse } from 'next/server';
import { getStatus, startCampaign } from '@/services/campaignService';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

const noStore = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

/**
 * GET /api/admin/lead-hunter/campaign — live campaign status.
 *
 * Reads from the `campaigns` table, so every server instance and every cold
 * start reports the same state. It used to read a module-level object that was
 * private to whichever Node process answered the request.
 */
export async function GET() {
  try {
    const campaign = await getStatus();
    return NextResponse.json({ success: true, campaign }, { headers: noStore });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: noStore });
  }
}

/** POST /api/admin/lead-hunter/campaign — queue a campaign for the worker. */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { leads, pitchType, customMessage, senderName, delaySeconds } = body;

    const result = await startCampaign({ leads, pitchType, customMessage, senderName, delaySeconds });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400, headers: noStore });
    }

    return NextResponse.json(
      {
        success: true,
        campaignId: result.campaignId,
        queued: result.queued,
        rejected: result.rejected,
        campaign: await getStatus(),
        notice:
          'Queued. The worker sends one pitch per pacing interval and only to leads with a recorded lawful basis — leads without consent are skipped, not sent.',
      },
      { headers: noStore }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: noStore });
  }
}
