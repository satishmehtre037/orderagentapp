import { Router, Request, Response } from 'express';
import {
  verifySubscription,
  verifyPayloadSignature,
  processWebhookPayload,
} from '../services/inboundPipeline';

const router = Router();

/**
 * Express WhatsApp webhook — a thin adapter over services/inboundPipeline.
 *
 * All message handling lives in the pipeline so this route and the Next route
 * at app/api/webhook cannot drift apart again.
 */

/** 1. Meta webhook verification (GET /webhook or GET /api/webhook) */
router.get(['/webhook', '/api/webhook'], (req: Request, res: Response) => {
  const result = verifySubscription({
    mode: req.query['hub.mode'] as string,
    token: req.query['hub.verify_token'] as string,
    challenge: req.query['hub.challenge'] as string,
  });

  if (!result.ok) {
    console.warn(`[Webhook Verification] ❌ Rejected: ${result.reason}`);
    return res.sendStatus(403);
  }

  console.log('[Webhook Verification] ✅ Token matched. Echoing challenge.');
  res.setHeader('Content-Type', 'text/plain');
  return res.status(200).send(result.challenge);
});

/** 2. Inbound messages (POST /webhook or POST /api/webhook) */
router.post(['/webhook', '/api/webhook'], async (req: Request, res: Response) => {
  // Verify before acknowledging, so a forged payload gets 403 rather than 200.
  const rawBody = (req as any).rawBody ?? JSON.stringify(req.body ?? {});
  if (!verifyPayloadSignature(rawBody, req.header('x-hub-signature-256'))) {
    return res.sendStatus(403);
  }

  // Acknowledge immediately — Meta retries aggressively on slow responses.
  res.status(200).send('EVENT_RECEIVED');

  try {
    await processWebhookPayload(req.body);
  } catch (err: any) {
    console.error('[Webhook Pipeline Exception]:', err?.message || err);
  }
});

export default router;
