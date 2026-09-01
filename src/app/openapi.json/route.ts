import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-static';

export async function GET() {
  try {
    const openApiPath = path.join(process.cwd(), 'public', 'openapi.json');
    const content = fs.readFileSync(openApiPath, 'utf-8');
    const json = JSON.parse(content);

    return NextResponse.json(json, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
        'X-API-Version': '2026-09-01',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SCHEMA_NOT_FOUND',
          message: 'OpenAPI specification could not be loaded.',
          hint: 'Contact support@webcorestudios.in.',
        },
      },
      { status: 500 }
    );
  }
}
