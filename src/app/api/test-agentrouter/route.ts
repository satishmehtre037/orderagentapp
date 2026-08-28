import { NextResponse } from 'next/server';
import { ENV } from '@/config/env';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const token = ENV.ANTHROPIC_AUTH_TOKEN || 'sk-YC1gMWBHv5joaFyRGVJ0TGedqQjmcYQ3F1IO1uQnssJSIi3s';
    const baseUrl = (ENV.ANTHROPIC_BASE_URL || 'https://agentrouter.org').replace(/\/+$/, '');
    const model = ENV.ANTHROPIC_MODEL || 'glm-5.3';

    const testPayload = {
      model,
      messages: [
        { role: 'system', content: 'You are a test assistant.' },
        { role: 'user', content: 'Say "AgentRouter GLM-5.3 is connected and working!"' },
      ],
      temperature: 0.1,
      max_tokens: 50,
    };

    const startTime = Date.now();
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'cline/1.0.0',
      },
      body: JSON.stringify(testPayload),
      signal: AbortSignal.timeout(15000),
    });

    const elapsedMs = Date.now() - startTime;
    const status = response.status;
    const headers = Object.fromEntries(response.headers.entries());
    const rawText = await response.text();

    let jsonBody: any = null;
    try {
      jsonBody = JSON.parse(rawText);
    } catch {
      jsonBody = rawText;
    }

    return NextResponse.json({
      success: response.ok,
      status,
      elapsedMs,
      tokenPrefix: token.slice(0, 10) + '...',
      baseUrl,
      model,
      headers: {
        'cf-ray': headers['cf-ray'],
        'content-type': headers['content-type'],
        'x-request-id': headers['x-request-id'] || headers['request-id'],
      },
      body: jsonBody,
    }, { status: response.ok ? 200 : 502 });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err?.message || String(err),
      stack: err?.stack,
    }, { status: 500 });
  }
}
