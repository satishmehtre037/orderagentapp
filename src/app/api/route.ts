import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export async function GET() {
  return NextResponse.json(
    {
      name: 'Agento AI REST API',
      organization: 'WebCore Studio',
      brand: 'Agento AI by WebCore Studio',
      version: '1.0.0',
      apiVersion: '2026-09-01',
      status: 'operational',
      documentation: 'https://orderagentapp.webcorestudio.dev/api-docs',
      openapi: 'https://orderagentapp.webcorestudio.dev/openapi.json',
      llms: 'https://orderagentapp.webcorestudio.dev/llms.txt',
      agent_spec: 'https://orderagentapp.webcorestudio.dev/.well-known/agent.json',
      endpoints: {
        webhook: '/api/webhook',
        hospital_appointments: '/api/hospital/appointments',
        hospital_doctors: '/api/hospital/doctors',
        hospital_reports: '/api/hospital/reports',
        hospital_voice_calls: '/api/hospital/voice-calls',
        hospital_feedback: '/api/hospital/feedback',
        cron_trigger: '/api/hospital/cron/trigger/{jobName}',
        health: '/api/health',
      },
    },
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'X-API-Version': '2026-09-01',
        'RateLimit-Limit': '120',
        'RateLimit-Remaining': '119',
        'RateLimit-Reset': '60',
      },
    }
  );
}
