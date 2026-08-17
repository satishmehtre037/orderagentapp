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
