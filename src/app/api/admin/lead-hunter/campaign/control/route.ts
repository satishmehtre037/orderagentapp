import { NextResponse } from 'next/server';
import { getStatus, pauseCampaign, resumeCampaign, cancelCampaign } from '@/services/campaignService';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

/**
 * POST /api/admin/lead-hunter/campaign/control — pause | resume | cancel.
 *
 * These now write to the `campaigns` row rather than flipping a boolean in one
 * process's memory, so a pause takes effect no matter which instance receives
 * the request and survives a restart.
 */
export async function POST(req: Request) {
  try {
    const { action } = await req.json();

    let result: { success: boolean; error?: string };
    if (action === 'pause') {
      result = await pauseCampaign();
    } else if (action === 'resume') {
      result = await resumeCampaign();
    } else if (action === 'cancel') {
      result = await cancelCampaign();
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Expected pause, resume, or cancel.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: result.success, error: result.error, campaign: await getStatus() },
      {
        status: result.success ? 200 : 409,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
