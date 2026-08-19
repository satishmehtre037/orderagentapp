import { NextResponse } from 'next/server';
import { campaignService } from '@/services/campaignService';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

/**
 * GET /api/admin/lead-hunter/campaign
 * Returns the live status of the server background campaign
 */
export async function GET() {
  try {
    const status = campaignService.getStatus();
    return NextResponse.json(
      { success: true, campaign: status },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/lead-hunter/campaign
 * Starts a 24/7 background campaign on the server
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { leads, pitchType, customMessage, senderName, delaySeconds } = body;

    const result = campaignService.startCampaign({
      leads,
      pitchType,
      customMessage,
      senderName,
      delaySeconds,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      campaignId: result.campaignId,
      campaign: campaignService.getStatus(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
