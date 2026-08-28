import { NextResponse } from 'next/server';
import {
  verifySubscription,
  verifyPayloadSignature,
  processWebhookPayload,
} from '@/services/inboundPipeline';

export const dynamic = 'force-dynamic';

/**
 * Next.js WhatsApp webhook — a thin adapter over services/inboundPipeline.
 *
 * This route used to contain a second, independent implementation: it accepted
 * three hardcoded verify tokens *or none at all*, filed every message against a
 * hardcoded business UUID, alerted a hardcoded phone number, and answered with
 * canned regex replies instead of the AI. Whichever URL happened to be
 * configured in Meta decided which brain the product had. Both entry points now
 * run the same pipeline.
 *
 * app/webhook/route.ts and app/api/webhooks/whatsapp/route.ts, which re-exported
 * this handler under two more URLs, have been deleted. This is the only one.
 */

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const result = verifySubscription({
    mode: searchParams.get('hub.mode'),
    token: searchParams.get('hub.verify_token'),
    challenge: searchParams.get('hub.challenge'),
  });

  if (!result.ok) {
    console.warn(`[Webhook Verification] ❌ Rejected: ${result.reason}`);
    return new NextResponse('Forbidden', { status: 403 });
  }

  console.log('[Webhook Verification] ✅ Token matched. Echoing challenge.');
  return new NextResponse(result.challenge, {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
}

export async function POST(req: Request) {
  // Read the raw body first — the HMAC is computed over the exact bytes Meta
  // sent, so it must not be re-serialised from a parsed object.
  const rawBody = await req.text();

  if (!verifyPayloadSignature(rawBody, req.headers.get('x-hub-signature-256'))) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ status: 'ignored', reason: 'invalid JSON' }, { status: 200 });
  }

  try {
    await processWebhookPayload(body);
  } catch (err: any) {
    console.error('[Webhook Pipeline Exception]:', err?.message || err);
  }

  // Always 200 so Meta does not retry-storm on an application error.
  return NextResponse.json({ status: 'EVENT_RECEIVED' }, { status: 200 });
}
