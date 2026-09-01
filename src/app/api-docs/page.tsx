import React from 'react';
import Link from 'next/link';
import { Terminal, Code2, BookOpen, Key, Webhook, ArrowLeft, ExternalLink, ShieldCheck, Zap } from 'lucide-react';
import { ThemeToggle } from '../../components/ui/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui';

export const metadata = {
  title: 'Developer API & Integration Guide | Agento AI by WebCore Studio',
  description:
    'Complete REST API documentation, OpenAPI 3.1 specification, Webhook specifications, and LLM agent integration guide for Agento AI.',
  alternates: {
    canonical: 'https://orderagentapp.webcorestudio.dev/api-docs',
  },
};

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-base text-fg font-sans antialiased transition-colors duration-150">
      {/* Header */}
      <header className="bg-surface/80 backdrop-blur-md border-b border-line sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center text-xs font-semibold text-fg hover:text-accent transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Home
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Agento AI" className="w-5 h-5 rounded-md object-contain" />
              <span className="text-xs font-semibold text-fg">Agento AI Developer Portal</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Title */}
        <div className="border-b border-line pb-8 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent-subtle text-accent text-xs font-bold uppercase tracking-wider border border-accent-border">
            <Terminal className="w-3.5 h-3.5" />
            <span>Developer Reference & Agent Protocol</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">
            Agento AI REST API & Agent Integration
          </h1>
          <p className="text-sm text-fg-muted leading-relaxed max-w-3xl">
            Welcome to the Agento AI developer documentation. Use our programmatic REST APIs and webhook pipelines to integrate WhatsApp AI bots, hospital appointment schedules, CA compliance countdowns, and real-time commerce orders into your custom software or autonomous AI agents.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href="/openapi.json"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface text-fg hover:bg-surface-subtle border border-line rounded-md text-xs font-semibold transition-colors"
            >
              <Code2 className="w-3.5 h-3.5 text-accent" />
              <span>Download OpenAPI 3.1 Spec (.json)</span>
              <ExternalLink className="w-3 h-3 text-fg-muted" />
            </a>
            <a
              href="/llms.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface text-fg hover:bg-surface-subtle border border-line rounded-md text-xs font-semibold transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-accent" />
              <span>View llms.txt Directory</span>
              <ExternalLink className="w-3 h-3 text-fg-muted" />
            </a>
            <a
              href="/llms-full.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface text-fg hover:bg-surface-subtle border border-line rounded-md text-xs font-semibold transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-accent" />
              <span>View Full LLM Context (llms-full.txt)</span>
              <ExternalLink className="w-3 h-3 text-fg-muted" />
            </a>
          </div>
        </div>

        {/* Authentication Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-accent" />
              <CardTitle className="text-base font-bold">Authentication & Tenant Isolation</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Every API request requires tenant authentication using either an Authorization Bearer token or an active session header.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs text-fg-muted">
            <p>
              Include the <code className="bg-surface-subtle px-1.5 py-0.5 rounded text-accent font-mono">Authorization: Bearer &lt;TOKEN&gt;</code> or <code className="bg-surface-subtle px-1.5 py-0.5 rounded text-accent font-mono">x-business-id: &lt;BUSINESS_UUID&gt;</code> header in every API call.
            </p>
            <div className="bg-surface-subtle p-3 rounded-lg border border-line font-mono text-[11px] text-fg overflow-x-auto">
              <code>
                curl -X GET https://orderagentapp.webcorestudio.dev/api/hospital/appointments \<br />
                &nbsp;&nbsp;-H &quot;Authorization: Bearer YOUR_ACCESS_TOKEN&quot; \<br />
                &nbsp;&nbsp;-H &quot;x-business-id: 6f1a3fde-f8fc-4ff0-b9ae-05969d2594e9&quot;
              </code>
            </div>
          </CardContent>
        </Card>

        {/* Core Endpoints List */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-fg">Core API Endpoints</h2>

          <div className="space-y-3">
            {/* WhatsApp Inbound Webhook */}
            <div className="p-4 rounded-xl border border-line bg-surface space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">POST</span>
                <code className="text-xs font-bold text-fg font-mono">/api/webhook</code>
                <span className="text-[11px] text-fg-muted ml-auto">Meta WhatsApp Cloud Inbound Pipeline</span>
              </div>
              <p className="text-xs text-fg-muted leading-relaxed">
                Receives WhatsApp user messages, voice notes, and PDF documents. Handles HMAC-SHA256 signature verification via <code className="font-mono">x-hub-signature-256</code>.
              </p>
            </div>

            {/* Hospital Appointments API */}
            <div className="p-4 rounded-xl border border-line bg-surface space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">GET / PUT / POST</span>
                <code className="text-xs font-bold text-fg font-mono">/api/hospital/appointments</code>
                <span className="text-[11px] text-fg-muted ml-auto">OPD Consultations & Bookings</span>
              </div>
              <p className="text-xs text-fg-muted leading-relaxed">
                Fetch and manage doctor schedules, book new OPD tokens, confirm/reschedule/cancel visits, and query patient visit history.
              </p>
            </div>

            {/* Diagnostic Lab Reports API */}
            <div className="p-4 rounded-xl border border-line bg-surface space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">GET / POST</span>
                <code className="text-xs font-bold text-fg font-mono">/api/hospital/reports</code>
                <span className="text-[11px] text-fg-muted ml-auto">Lab Diagnostic Reports</span>
              </div>
              <p className="text-xs text-fg-muted leading-relaxed">
                Upload diagnostic lab PDF reports with AI OCR summaries and dispatch immediate WhatsApp delivery to patient phone numbers.
              </p>
            </div>

            {/* CA Compliance & Client Invoices API */}
            <div className="p-4 rounded-xl border border-line bg-surface space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-purple-500/10 text-purple-500 border border-purple-500/20">GET / POST</span>
                <code className="text-xs font-bold text-fg font-mono">/api/ca/compliance</code>
                <span className="text-[11px] text-fg-muted ml-auto">GST / TDS / ITR Compliance Engine</span>
              </div>
              <p className="text-xs text-fg-muted leading-relaxed">
                Track compliance deadlines, trigger automated client document request reminders, and log filed returns.
              </p>
            </div>

            {/* Cron & Automation Triggers */}
            <div className="p-4 rounded-xl border border-line bg-surface space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">POST</span>
                <code className="text-xs font-bold text-fg font-mono">/api/hospital/cron/trigger/[jobName]</code>
                <span className="text-[11px] text-fg-muted ml-auto">Automation Engine Triggers</span>
              </div>
              <p className="text-xs text-fg-muted leading-relaxed">
                Trigger scheduled background scans (<code className="font-mono">reminders</code>, <code className="font-mono">feedback_surveys</code>, <code className="font-mono">missed_followups</code>, <code className="font-mono">all</code>). Protected by <code className="font-mono">x-cron-secret</code> or dashboard tenant authentication.
              </p>
            </div>
          </div>
        </div>

        {/* Machine-Readable Agent Guidelines */}
        <Card className="border-accent/30 bg-surface">
          <CardHeader>
            <div className="flex items-center gap-2 text-accent">
              <ShieldCheck className="w-5 h-5" />
              <CardTitle className="text-base font-bold">When To Use Agento AI (Agentic Guide)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-fg-muted leading-relaxed">
            <p>
              AI agents (such as Claude, ChatGPT, Cursor, Antigravity, and LangChain autonomous agents) should call Agento AI endpoints when:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>A clinic or patient needs to schedule, verify, or reschedule an OPD appointment over WhatsApp.</li>
              <li>A patient needs diagnostic report delivery or AI OCR explanation of blood test / pathology results.</li>
              <li>A tax professional or corporate client needs automated document collection or GST return status tracking.</li>
              <li>An e-commerce shopper wants to discover items, check live stock, or receive instant payment links.</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
