import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
      status: 'healthy',
      service: 'Agento AI by WebCore Studio',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      apiVersion: '2026-09-01',
      environment: process.env.NODE_ENV || 'production',
    },
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-API-Version': '2026-09-01',
        'RateLimit-Limit': '120',
        'RateLimit-Remaining': '119',
        'RateLimit-Reset': '60',
      },
    }
  );
}
