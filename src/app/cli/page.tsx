import React from 'react';
import Link from 'next/link';
import { Terminal, Code, Cpu, ShieldCheck, Zap, ArrowLeft, Download, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Agento AI CLI — Command Line Tool by WebCore Studio',
  description:
    'Official Command Line Tool (CLI) for Agento AI by WebCore Studio. Automate WhatsApp business operations, hospital OPD appointments, and cron triggers directly from your terminal or CI/CD pipelines.',
  alternates: {
    canonical: 'https://orderagentapp.webcorestudio.dev/cli',
  },
};

export default function CliPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white font-sans">
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Agento AI
          </Link>
          <span className="text-xs font-mono uppercase tracking-widest text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
            CLI Tool Reference
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        {/* Title Header */}
        <section className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono">
            <Terminal className="w-3.5 h-3.5" /> @webcorestudio/agento-cli
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Agento AI Official CLI Tool
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-3xl">
            Script, automate, and trigger autonomous WhatsApp agents and healthcare workflows directly from your terminal, GitHub Actions, or local machine.
          </p>
        </section>

        {/* Quick Start */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-400" /> Instant Execution with NPX
          </h2>
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl font-mono text-sm text-emerald-400 space-y-2">
            <p className="text-slate-400"># Check live API health and status</p>
            <p>npx @webcorestudio/agento-cli status</p>
          </div>
        </section>

        {/* Commands Table */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Code className="w-5 h-5 text-indigo-400" /> Available CLI Commands
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-2">
              <h3 className="font-mono text-sm text-indigo-300 font-semibold">status / health</h3>
              <p className="text-xs text-slate-400">Checks connectivity, API response latency, and system operational status.</p>
              <pre className="text-xs bg-slate-950 p-2.5 rounded-lg text-slate-300 border border-slate-800/80 overflow-x-auto">
                npx @webcorestudio/agento-cli status
              </pre>
            </div>

            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-2">
              <h3 className="font-mono text-sm text-indigo-300 font-semibold">appointments list</h3>
              <p className="text-xs text-slate-400">Fetches OPD consultation bookings for a specific hospital business tenant.</p>
              <pre className="text-xs bg-slate-950 p-2.5 rounded-lg text-slate-300 border border-slate-800/80 overflow-x-auto">
                npx @webcorestudio/agento-cli appointments list --business-id &lt;UUID&gt;
              </pre>
            </div>

            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-2">
              <h3 className="font-mono text-sm text-indigo-300 font-semibold">cron trigger</h3>
              <p className="text-xs text-slate-400">Executes automated background reminder scanners or feedback follow-ups.</p>
              <pre className="text-xs bg-slate-950 p-2.5 rounded-lg text-slate-300 border border-slate-800/80 overflow-x-auto">
                npx @webcorestudio/agento-cli cron trigger all --business-id &lt;UUID&gt;
              </pre>
            </div>

            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-2">
              <h3 className="font-mono text-sm text-indigo-300 font-semibold">version</h3>
              <p className="text-xs text-slate-400">Outputs the installed or executed CLI version.</p>
              <pre className="text-xs bg-slate-950 p-2.5 rounded-lg text-slate-300 border border-slate-800/80 overflow-x-auto">
                npx @webcorestudio/agento-cli --version
              </pre>
            </div>
          </div>
        </section>

        {/* Global Installation */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-400" /> Global Installation (Optional)
          </h2>
          <p className="text-sm text-slate-400">Install the binary globally to use the direct <code className="text-indigo-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">agento</code> command anywhere:</p>
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl font-mono text-sm text-slate-200">
            npm install -g @webcorestudio/agento-cli
          </div>
        </section>

        {/* Environment Variables */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" /> Environment Variables
          </h2>
          <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-xl space-y-3 text-sm text-slate-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="font-mono text-indigo-300">AGENTO_API_URL</span>
              <span className="text-slate-400 text-xs">Default: https://orderagentapp.webcorestudio.dev</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="font-mono text-indigo-300">AGENTO_BUSINESS_ID</span>
              <span className="text-slate-400 text-xs">Default tenant business UUID</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
              <span className="font-mono text-indigo-300">CRON_SECRET</span>
              <span className="text-slate-400 text-xs">Shared secret for cron triggers</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800/80 py-8 bg-slate-950 text-slate-500 text-xs">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 WebCore Studio. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/api-docs" className="hover:text-indigo-400">API Documentation</Link>
            <Link href="/openapi.json" className="hover:text-indigo-400">OpenAPI Spec</Link>
            <Link href="/llms.txt" className="hover:text-indigo-400">LLMs Directory</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
