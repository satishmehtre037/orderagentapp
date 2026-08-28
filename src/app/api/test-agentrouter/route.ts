import { NextResponse } from 'next/server';
import { ENV } from '@/config/env';

export const dynamic = 'force-dynamic';

export async function GET() {
  const token =
    ENV.ANTHROPIC_AUTH_TOKEN ||
    process.env.ANTHROPIC_AUTH_TOKEN ||
    'sk-YC1gMWBHv5joaFyRGVJ0TGedqQjmcYQ3F1IO1uQnssJSIi3s';
  const baseUrl = (ENV.ANTHROPIC_BASE_URL || 'https://agentrouter.org').replace(/\/+$/, '');
  const model = ENV.ANTHROPIC_MODEL || 'glm-5.3';

  try {
    const startTime = Date.now();
    const res = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': token,
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'cline/1.0.0',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Say "GLM-5.3 is fully active on AgentRouter!"' }],
        max_tokens: 100,
      }),
      signal: AbortSignal.timeout(15000),
    });

    const elapsedMs = Date.now() - startTime;
    const data = await res.json();
    const text = data?.content
      ?.filter((c: any) => c.type === 'text')
      ?.map((c: any) => c.text)
      ?.join('\n')
      ?.trim();

    return NextResponse.json({
      success: res.ok,
      status: res.status,
      elapsedMs,
      model,
      tokenPrefix: token.slice(0, 10) + '...',
      response: text,
      fullData: data,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err?.message || String(err),
      stack: err?.stack,
    }, { status: 500 });
  }
}
