import { Router, Request, Response } from 'express';

const router = Router();

/**
 * Health check endpoint
 */
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/health/config', (_req: Request, res: Response) => {
  const groqKey = process.env.GROQ_API_KEY || '';
  res.json({
    status: 'ok',
    hasGroqKey: Boolean(groqKey && groqKey !== 'placeholder-api-key'),
    groqKeyPrefix: groqKey ? `${groqKey.slice(0, 6)}...` : 'MISSING',
    hasSupabaseKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    hasWhatsappToken: Boolean(process.env.WHATSAPP_CLOUD_API_TOKEN),
    nodeEnv: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString(),
  });
});

router.get('/test-groq', async (_req: Request, res: Response) => {
  try {
    const { getGroqClient } = await import('../config/groq');
    const groqClient = getGroqClient();
    if (!groqClient) {
      return res.status(500).json({ error: 'Groq client failed to initialize. Check GROQ_API_KEY.' });
    }

    // 1. Fetch available models from Groq account
    let availableModels: string[] = [];
    let listError: string | null = null;
    try {
      const modelsList = await groqClient.models.list();
      availableModels = (modelsList.data || []).map((m: any) => m.id);
    } catch (listErr: any) {
      listError = listErr?.message || String(listErr);
    }

    if (availableModels.length === 0) {
      return res.json({
        success: false,
        error: 'No models found for this Groq API Key.',
        listError,
        groqKeyPrefix: (process.env.GROQ_API_KEY || '').slice(0, 8),
        tip: 'Please generate a standard free API Key at https://console.groq.com/keys and update GROQ_API_KEY in Render environment variables.'
      });
    }

    // 2. Select best English/multilingual conversational model
    const priorityModels = [
      'qwen/qwen2.5-27b',
      'groq/compound',
      'groq/compound-mini',
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'llama3-8b-8192',
    ];

    const modelToUse = priorityModels.find((m) => availableModels.includes(m)) || availableModels[0];

    const completion = await groqClient.chat.completions.create({
      model: modelToUse,
      messages: [
        { role: 'user', content: 'Say "Groq AI is active and operational!"' }
      ],
      max_tokens: 30,
    });

    return res.json({
      success: true,
      modelUsed: modelToUse,
      availableModelsCount: availableModels.length,
      availableModels,
      response: completion.choices[0]?.message?.content,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || err,
      status: err?.status,
      code: err?.code,
    });
  }
});

router.get('/test-agentrouter', async (_req: Request, res: Response) => {
  try {
    const { ENV } = await import('../config/env');
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

    return res.status(response.ok ? 200 : 502).json({
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
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || String(err),
      stack: err?.stack,
    });
  }
});

/**
 * Root index endpoint for GET /
 */
router.get('/', (_req: Request, res: Response) => {
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>BizBot OS | Backend Core Engine</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background-color: #FBF9F4;
          color: #1A1A1A;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          padding: 20px;
        }
        .card {
          background: #FFFFFF;
          border: 2px solid #E5DFD3;
          border-radius: 12px;
          padding: 32px;
          max-width: 550px;
          box-shadow: 0 4px 12px rgba(15, 61, 62, 0.08);
        }
        .badge {
          display: inline-block;
          background: #E0EBE9;
          color: #0F3D3E;
          font-weight: bold;
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 12px;
        }
        h1 {
          font-size: 24px;
          color: #0F3D3E;
          margin: 0 0 8px 0;
        }
        p {
          font-size: 14px;
          color: #666666;
          line-height: 1.5;
          margin-bottom: 24px;
        }
        .links {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .btn {
          display: block;
          text-align: center;
          background: #0F3D3E;
          color: #FFFFFF;
          text-decoration: none;
          padding: 12px 20px;
          border-radius: 6px;
          font-weight: bold;
          font-size: 14px;
          transition: background 0.2s;
        }
        .btn:hover {
          background: #145253;
        }
        .btn-outline {
          background: transparent;
          color: #0F3D3E;
          border: 1.5px solid #0F3D3E;
        }
        .btn-outline:hover {
          background: #E0EBE9;
        }
        .footer {
          margin-top: 24px;
          font-size: 12px;
          color: #888888;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <span class="badge">● Server Active (Port 3002)</span>
        <h1>BizBot OS Backend Engine</h1>
        <p>This is the Node.js/Express API server providing Meta WhatsApp webhooks, Razorpay billing integrations, and Groq Llama 3.3 AI prompt processing.</p>
        
        <div class="links">
          <a href="http://localhost:3004/dashboard" class="btn">Go to Next.js Owner Portal (Port 3004) &rarr;</a>
          <a href="/health" class="btn btn-outline">Check Health Status (/health)</a>
        </div>

        <div class="footer">
          BizBot OS Phase 4 — Express Backend Engine
        </div>
      </div>
    </body>
    </html>
  `);
});

export default router;
