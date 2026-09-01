import { NextResponse } from 'next/server';

/**
 * Catch-all route handler for undefined API endpoints.
 * Returns structured RFC 9457 Problem Details JSON (application/problem+json)
 * so AI agents and API crawlers never encounter HTML error pages.
 */
function handleNotFound(req: Request) {
  const url = new URL(req.url);
  const errorObj = {
    type: 'https://orderagentapp.webcorestudio.dev/errors/not-found',
    title: 'Resource Not Found',
    status: 404,
    detail: `The requested API endpoint '${url.pathname}' was not found on this server.`,
    instance: url.pathname,
    success: false,
    error: {
      code: 'API_ENDPOINT_NOT_FOUND',
      message: `The requested endpoint '${url.pathname}' does not exist on this server.`,
      hint: 'Refer to our OpenAPI 3.1 specification at https://orderagentapp.webcorestudio.dev/openapi.json or developer documentation at https://orderagentapp.webcorestudio.dev/api-docs.',
    },
  };

  return NextResponse.json(errorObj, {
    status: 404,
    headers: {
      'Content-Type': 'application/problem+json; charset=utf-8',
      'X-API-Version': '2026-09-01',
      'RateLimit-Limit': '120',
      'RateLimit-Remaining': '119',
      'RateLimit-Reset': '60',
      'RateLimit-Policy': '120;w=60',
    },
  });
}

export const GET = handleNotFound;
export const POST = handleNotFound;
export const PUT = handleNotFound;
export const DELETE = handleNotFound;
export const PATCH = handleNotFound;
export const HEAD = handleNotFound;
export const OPTIONS = handleNotFound;
