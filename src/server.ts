import express from 'express';
import cors from 'cors';
import { ENV } from './config/env';
import healthRouter from './routes/health';
import webhookRouter from './routes/webhook';
import billingRouter from './routes/billing';
import invoiceRouter from './routes/invoice';
import paymentRouter from './routes/payment';
import { caRouter } from './routes/caRoutes';
import { initCACronScheduler } from './services/caCronService';
import { initHospitalCronScheduler } from './services/hospitalCronService';
import { startCampaignWorker } from './services/campaignService';

const app = express();

// Middlewares
app.use(cors());

// Capture the raw request body alongside the parsed one. Meta signs the exact
// bytes it sent, so verifying x-hub-signature-256 against a re-serialised
// JSON.stringify(req.body) fails on any key-order or whitespace difference.
app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf.toString('utf8');
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req, _res, next) => {
  console.log(`[HTTP] ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Routes Registration
app.use('/', healthRouter);
app.use('/', webhookRouter);
app.use('/', invoiceRouter);
app.use('/billing', billingRouter);
app.use('/', paymentRouter);
app.use('/api/ca', caRouter);

// Schedulers. initCACronScheduler was previously the only one registered — the
// hospital reminder/feedback/follow-up jobs were fully implemented but never
// scheduled anywhere, so none of them had ever run.
initCACronScheduler();
initHospitalCronScheduler();

// Campaign worker: sends at most one queued pitch per tick, paced by each
// campaign's next_send_at. Serverless deployments use the equivalent route at
// /api/admin/lead-hunter/campaign/tick instead; running both is safe.
startCampaignWorker(5000);

// Start periodic trial expiration checker (every 1 hour)
setInterval(async () => {
  try {
    await fetch(`http://localhost:${ENV.PORT}/billing/check-trials`, { method: 'POST' });
  } catch (err: any) {
    console.error('[Periodic Trial Check Error]:', err.message);
  }
}, 60 * 60 * 1000);

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('🔥 Server Unhandled Error:', err);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

process.on('uncaughtException', (err) => {
  console.error('🔥 Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start Server
app.listen(ENV.PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Agento AI Backend Engine Live!`);
  console.log(`📡 Listening on Port        : http://localhost:${ENV.PORT}`);
  console.log(`📥 WhatsApp Webhook         : http://localhost:${ENV.PORT}/webhook`);
  console.log(`💳 Create Order Endpoint    : http://localhost:${ENV.PORT}/api/create-order`);
  console.log(`🔐 Verify Payment Endpoint  : http://localhost:${ENV.PORT}/api/verify-payment`);
  console.log(`======================================================\n`);
});

export default app;
