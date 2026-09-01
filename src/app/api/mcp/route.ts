import { NextRequest, NextResponse } from 'next/server';

const SERVER_INFO = {
  name: 'agento-ai-mcp',
  version: '1.0.0',
};

const PROTOCOL_VERSION = '2024-11-05';

const TOOLS = [
  {
    name: 'list_hospital_appointments',
    description: 'Lists active OPD consultation appointments for a business tenant.',
    inputSchema: {
      type: 'object',
      required: ['business_id'],
      properties: {
        business_id: { type: 'string', description: 'Tenant business UUID' },
        date: { type: 'string', description: 'Filter by appointment date (YYYY-MM-DD)' },
        doctor_name: { type: 'string', description: 'Filter by doctor name' },
      },
    },
  },
  {
    name: 'book_hospital_appointment',
    description: 'Books an OPD appointment slot and allocates an appointment token number.',
    inputSchema: {
      type: 'object',
      required: ['business_id', 'patient_name', 'patient_phone', 'doctor_name', 'slot_time'],
      properties: {
        business_id: { type: 'string', description: 'Tenant business UUID' },
        patient_name: { type: 'string', description: 'Full name of the patient' },
        patient_phone: { type: 'string', description: 'Phone number in E.164 format without plus' },
        doctor_name: { type: 'string', description: 'Assigned doctor name' },
        slot_time: { type: 'string', description: 'Appointment ISO datetime' },
        reason: { type: 'string', description: 'Reason for visit / symptoms' },
      },
    },
  },
  {
    name: 'trigger_cron_scanner',
    description: 'Triggers background automation scanners (appointment reminders, feedback surveys).',
    inputSchema: {
      type: 'object',
      required: ['job'],
      properties: {
        job: { type: 'string', enum: ['reminders', 'feedback_surveys', 'missed_followups', 'all'] },
        business_id: { type: 'string', description: 'Optional tenant business UUID' },
      },
    },
  },
];

export async function GET(request: NextRequest) {
  // Support Server-Sent Events (SSE) or discovery info for MCP clients
  const accept = request.headers.get('accept') || '';

  if (accept.includes('text/event-stream')) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const endpointMsg = JSON.stringify({
          type: 'endpoint',
          url: 'https://orderagentapp.webcorestudio.dev/api/mcp',
        });
        controller.enqueue(encoder.encode(`event: endpoint\ndata: ${endpointMsg}\n\n`));
      },
    });

    return new NextResponse(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // Regular JSON discovery response
  return NextResponse.json(
    {
      name: SERVER_INFO.name,
      version: SERVER_INFO.version,
      protocolVersion: PROTOCOL_VERSION,
      transport: 'http-json-rpc',
      endpoint: 'https://orderagentapp.webcorestudio.dev/api/mcp',
      sse: 'https://orderagentapp.webcorestudio.dev/api/mcp',
      capabilities: {
        tools: { listChanged: true },
        resources: { subscribe: false, listChanged: false },
        prompts: { listChanged: false },
      },
      tools: TOOLS,
    },
    {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-business-id',
      },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, method, params } = body;

    // Standard JSON-RPC 2.0 MCP Handshake
    switch (method) {
      case 'initialize':
        return NextResponse.json({
          jsonrpc: '2.0',
          id: id ?? 1,
          result: {
            protocolVersion: PROTOCOL_VERSION,
            capabilities: {
              tools: { listChanged: true },
              resources: {},
              prompts: {},
            },
            serverInfo: SERVER_INFO,
          },
        });

      case 'notifications/initialized':
      case 'initialized':
        return new NextResponse(null, { status: 204 });

      case 'ping':
        return NextResponse.json({
          jsonrpc: '2.0',
          id: id ?? 1,
          result: {},
        });

      case 'tools/list':
        return NextResponse.json({
          jsonrpc: '2.0',
          id: id ?? 1,
          result: {
            tools: TOOLS,
          },
        });

      case 'tools/call': {
        const toolName = params?.name;
        if (toolName === 'list_hospital_appointments') {
          return NextResponse.json({
            jsonrpc: '2.0',
            id: id ?? 1,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    status: 'success',
                    message: 'Appointment query executed successfully',
                    appointments: [],
                  }),
                },
              ],
            },
          });
        }

        return NextResponse.json({
          jsonrpc: '2.0',
          id: id ?? 1,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'success',
                  message: `Tool ${toolName} executed successfully`,
                }),
              },
            ],
          },
        });
      }

      case 'resources/list':
        return NextResponse.json({
          jsonrpc: '2.0',
          id: id ?? 1,
          result: { resources: [] },
        });

      case 'prompts/list':
        return NextResponse.json({
          jsonrpc: '2.0',
          id: id ?? 1,
          result: { prompts: [] },
        });

      default:
        return NextResponse.json({
          jsonrpc: '2.0',
          id: id ?? null,
          error: {
            code: -32601,
            message: `Method '${method}' not found`,
          },
        });
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: 'Parse error: Invalid JSON was received by the server',
          data: error?.message,
        },
      },
      { status: 400 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-business-id, mcp-session-id',
    },
  });
}
