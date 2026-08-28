import { NextResponse } from 'next/server';
import { tickCampaign } from '@/services/campaignService';
import { ENV } from '@/config/env';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * Campaign worker entry point for serverless deployments.
 *
 * On a platform with no long-lived process there is nothing to run the pacing
 * loop, which is why the old in-memory campaign died the moment the request
 * that started it returned. Point a platform cron (Vercel Cron, GitHub Actions,
 * cron-job.org) at this route once a minute:
 *
 *   { "crons": [{ "path": "/api/admin/lead-hunter/campaign/tick", "schedule": "* * * * *" }] }
 *
 * Each call sends at most `maxSends` pitches, respecting the campaign's pacing —
 * a claim on `next_send_at` means concurrent invocations cannot double-send.
 * The self-hosted Express server runs the same tick on an interval; running
 * both at once is safe.
 */

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET || '';
  // No secret configured: allow, but say so. Set CRON_SECRET in production so a
  // stranger cannot drive your outbound queue.
  if (!secret) {
    console.warn('[Campaign Tick] CRON_SECRET is not set — this endpoint is unauthenticated.');
    return true;
  }

  const header = req.headers.get('authorization') || '';
  if (header === `Bearer ${secret}`) return true;

  const url = new URL(req.url);
  return url.searchParams.get('secret') === secret;
}

async function runTicks(maxSends: number) {
  const results: any[] = [];

  for (let i = 0; i < maxSends; i++) {
    const result = await tickCampaign();
    results.push(result);
    // Nothing due, or another worker holds the slot — stop rather than spin.
    if (!result.acted) break;
  }

  return results;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const max = Math.min(Number(new URL(req.url).searchParams.get('max')) || 1, 10);

  try {
    const results = await runTicks(max);
    return NextResponse.json({
      success: true,
      ticks: results.length,
      sent: results.filter((r) => r.result === 'sent').length,
      skipped: results.filter((r) => r.result === 'skipped').length,
      failed: results.filter((r) => r.result === 'failed').length,
      results,
      whatsappConfigured: Boolean(ENV.WHATSAPP_BUSINESS_NUMBER),
    });
  } catch (err: any) {
    console.error('[Campaign Tick] Failed:', err?.message || err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
