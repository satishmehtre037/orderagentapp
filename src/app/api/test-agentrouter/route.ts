import { NextResponse } from 'next/server';
import { ENV } from '@/config/env';

export const dynamic = 'force-dynamic';

export async function GET() {
  const token = ENV.ANTHROPIC_AUTH_TOKEN || 'sk-YC1gMWBHv5joaFyRGVJ0TGedqQjmcYQ3F1IO1uQnssJSIi3s';
  const baseUrl = (ENV.ANTHROPIC_BASE_URL || 'https://agentrouter.org').replace(/\/+$/, '');
  const model = ENV.ANTHROPIC_MODEL || 'glm-5.3';

  const userAgents = [
    'OpenAI/NodeJS/4.28.0',
    'anthropic-typescript/0.26.0',
    'cursor/0.40.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    'python-requests/2.31.0',
    'curl/8.4.0',
    'claude-dev/1.0.0',
  ];

  const results: any[] = [];

  for (const ua of userAgents) {
    try {
      const startTime = Date.now();
      const res = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'User-Agent': ua,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Say OK' }],
          max_tokens: 5,
        }),
        signal: AbortSignal.timeout(10000),
      });

      const elapsedMs = Date.now() - startTime;
      const text = await res.text();
      const isJson = text.startsWith('{');
      const isCaptcha = text.includes('captcha') || text.includes('aliyun');

      results.push({
        userAgent: ua,
        status: res.status,
        elapsedMs,
        isJson,
        isCaptcha,
        preview: text.slice(0, 100),
      });
    } catch (e: any) {
      results.push({
        userAgent: ua,
        error: e?.message || String(e),
      });
    }
  }

  return NextResponse.json({
    tokenPrefix: token.slice(0, 10) + '...',
    baseUrl,
    model,
    results,
  });
}
