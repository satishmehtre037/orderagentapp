import React from 'react';
import Link from 'next/link';
import { Cpu, ArrowLeft, Terminal, CheckCircle2, Copy, ExternalLink, Zap } from 'lucide-react';

export const metadata = {
  title: 'Agento AI by WebCore Studio — Model Context Protocol (MCP) Server',
  description:
    'Official Model Context Protocol (MCP) Server for Agento AI by WebCore Studio. Integrate hospital booking, lab report retrieval, and WhatsApp bots directly into Claude Desktop, Cursor, and agentic workflows.',
  alternates: {
    canonical: 'https://orderagentapp.webcorestudio.dev/mcp',
  },
};

export default function McpPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white font-sans">
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/developers" className="flex items-center gap-2 text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Developer Hub
          </Link>
          <span className="text-xs font-mono uppercase tracking-widest text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
            MCP Protocol Server
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        <section className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono">
            <Cpu className="w-3.5 h-3.5" /> Anthropic Model Context Protocol (MCP)
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Agento AI by WebCore Studio MCP Server
          </h1>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            Connect Claude Desktop, Cursor, Antigravity, and LangChain autonomous AI agents directly to Agento AI tools via the Model Context Protocol.
          </p>
        </section>

        {/* Claude Desktop Config */}
        <section className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-400" /> Claude Desktop & Cursor Integration
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Add the following configuration to your <code className="text-indigo-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">claude_desktop_config.json</code>:
          </p>
          <div className="p-4 bg-slate-950 rounded-xl font-mono text-xs text-emerald-400 border border-slate-800/80 overflow-x-auto">
            <pre>{`{
  "mcpServers": {
    "agento-ai": {
      "command": "npx",
      "args": ["-y", "@webcorestudio/agento-cli", "mcp"],
      "env": {
        "AGENTO_API_URL": "https://orderagentapp.webcorestudio.dev",
        "AGENTO_BUSINESS_ID": "<YOUR_BUSINESS_UUID>"
      }
    }
  }
}`}</pre>
          </div>
        </section>

        {/* Exposed MCP Tools */}
        <section className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-400" /> Available MCP Tools
          </h2>
          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
              <strong className="text-white font-mono">list_hospital_appointments</strong>
              <p className="text-slate-400">Query consultation bookings by doctor, date, or status.</p>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
              <strong className="text-white font-mono">book_hospital_appointment</strong>
              <p className="text-slate-400">Book OPD token and dispatch WhatsApp confirmation.</p>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
              <strong className="text-white font-mono">get_diagnostic_reports</strong>
              <p className="text-slate-400">Fetch patient lab test results and AI summaries.</p>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
              <strong className="text-white font-mono">trigger_cron_scanner</strong>
              <p className="text-slate-400">Run background appointment reminders and surveys.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800/80 py-8 bg-slate-950 text-slate-500 text-xs">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 WebCore Studio. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/developers" className="hover:text-indigo-400">Developer Portal</Link>
            <Link href="/api-docs" className="hover:text-indigo-400">API Documentation</Link>
            <Link href="/openapi.json" className="hover:text-indigo-400">OpenAPI Spec</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
