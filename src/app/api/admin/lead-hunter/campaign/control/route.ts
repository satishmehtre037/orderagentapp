import { NextResponse } from 'next/server';
import { campaignService } from '@/services/campaignService';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

/**
 * POST /api/admin/lead-hunter/campaign/control
 * Control the server background campaign: pause | resume | cancel
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    let result = { success: false };
    if (action === 'pause') {
      result = campaignService.pauseCampaign();
    } else if (action === 'resume') {
      result = campaignService.resumeCampaign();
    } else if (action === 'cancel') {
      result = campaignService.cancelCampaign();
    } else {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({
      success: result.success,
      campaign: campaignService.getStatus(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
