import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    { status: 'ok', service: 'Agento AI by WebCore Studio', timestamp: new Date().toISOString() },
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-API-Version': '2026-09-01',
      },
    }
  );
}
