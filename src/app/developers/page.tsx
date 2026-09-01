import React from 'react';
import Link from 'next/link';
import { Terminal, Code2, BookOpen, Key, ArrowLeft, ExternalLink, ShieldCheck, Zap, Cpu, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui';

export const metadata = {
  title: 'Agento AI by WebCore Studio — Developer Portal & API Directory',
  description:
    'Official Developer Portal for Agento AI by WebCore Studio. Access REST APIs, OpenAPI 3.1 specification, Authentication guides, MCP Server, and CLI tools.',
  alternates: {
    canonical: 'https://orderagentapp.webcorestudio.dev/developers',
  },
};

export default function DevelopersPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white font-sans">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Agento AI
          </Link>
          <span className="text-xs font-mono uppercase tracking-widest text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
            Developer Portal
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        {/* Title Header */}
        <section className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono">
            <Terminal className="w-3.5 h-3.5" /> Developer Hub & Agent Infrastructure
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Agento AI by WebCore Studio Developer Portal
          </h1>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed max-w-3xl">
            Complete suite of developer tools, machine-readable specifications, and agent protocols for building and automating 24/7 WhatsApp AI workflows.
          </p>
        </section>

        {/* Resource Grid */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* REST API Docs */}
          <Link href="/api-docs" className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition-all space-y-3 group">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 group-hover:scale-105 transition-transform">
              <Code2 className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">REST API Docs</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Complete endpoint documentation for hospital bookings, diagnostic reports, and WhatsApp inbound webhooks.
            </p>
          </Link>

          {/* OpenAPI Specification */}
          <a href="/openapi.json" target="_blank" rel="noopener noreferrer" className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition-all space-y-3 group">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">OpenAPI 3.1 Spec</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              100% typed OpenAPI 3.1 specification schema with RFC 9457 problem+json error responses.
            </p>
          </a>

          {/* Auth Docs */}
          <Link href="/auth-docs" className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition-all space-y-3 group">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 group-hover:scale-105 transition-transform">
              <Key className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">Authentication Docs</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Multi-tenant security, Bearer tokens, x-business-id headers, and HMAC-SHA256 signature verification.
            </p>
          </Link>

          {/* MCP Server */}
          <Link href="/mcp" className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition-all space-y-3 group">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 group-hover:scale-105 transition-transform">
              <Cpu className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">MCP Server</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Model Context Protocol (MCP) server for Claude Desktop, Cursor, and autonomous AI agents.
            </p>
          </Link>

          {/* CLI Tool */}
          <Link href="/cli" className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition-all space-y-3 group">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 group-hover:scale-105 transition-transform">
              <Terminal className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">CLI Runner</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Execute appointments, cron scans, and health probes with <code className="text-indigo-300 font-mono">@webcorestudio/agento-cli</code>.
            </p>
          </Link>

          {/* Deprecation Policy */}
          <Link href="/deprecation" className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition-all space-y-3 group">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">Deprecation Policy</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Our 180-day advance notice guarantee, RFC 8594 Sunset headers, and versioning conventions.
            </p>
          </Link>
        </section>

        {/* Agent Machine-Readable Directories */}
        <section className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-400" /> Machine-Readable Agent Directories
          </h2>
          <div className="grid sm:grid-cols-2 gap-3 text-xs font-mono">
            <a href="/llms.txt" target="_blank" className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between text-indigo-400 hover:text-indigo-300">
              <span>https://orderagentapp.webcorestudio.dev/llms.txt</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a href="/llms-full.txt" target="_blank" className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between text-indigo-400 hover:text-indigo-300">
              <span>https://orderagentapp.webcorestudio.dev/llms-full.txt</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 bg-slate-950 text-slate-500 text-xs">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 WebCore Studio. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/api-docs" className="hover:text-indigo-400">API Documentation</Link>
            <Link href="/openapi.json" className="hover:text-indigo-400">OpenAPI Spec</Link>
            <Link href="/brand" className="hover:text-indigo-400">Brand Kit</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
