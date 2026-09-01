import React from 'react';
import Link from 'next/link';
import { Key, ArrowLeft, Shield, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Agento AI by WebCore Studio — Authentication & Security Documentation',
  description:
    'Official Authentication and Multi-Tenant Security Guide for Agento AI by WebCore Studio. Learn how to authenticate API requests via Bearer tokens, x-business-id, and HMAC signatures.',
  alternates: {
    canonical: 'https://orderagentapp.webcorestudio.dev/auth-docs',
  },
};

export default function AuthDocsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white font-sans">
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/developers" className="flex items-center gap-2 text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Developer Hub
          </Link>
          <span className="text-xs font-mono uppercase tracking-widest text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
            Auth & Security
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        <section className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono">
            <Key className="w-3.5 h-3.5" /> API Security Specification
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Agento AI by WebCore Studio Authentication Documentation
          </h1>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            Every programmatic interaction with Agento AI is authenticated and scoped to an isolated business tenant using cryptographic credentials or multi-tenant session tokens.
          </p>
        </section>

        {/* 1. Header-Based Authentication */}
        <section className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" /> 1. Bearer Token & Tenant Headers
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Include one of the following authentication headers with every REST API request:
          </p>
          <div className="p-4 bg-slate-950 rounded-xl font-mono text-xs text-slate-300 space-y-2 border border-slate-800/80">
            <p className="text-slate-400"># Option A: Standard Bearer Token</p>
            <p><span className="text-indigo-400">Authorization:</span> Bearer &lt;YOUR_API_TOKEN&gt;</p>
            <p className="text-slate-400 pt-2"># Option B: Business Tenant Header</p>
            <p><span className="text-indigo-400">x-business-id:</span> 6f1a3fde-f8fc-4ff0-b9ae-05969d2594e9</p>
          </div>
        </section>

        {/* 2. Webhook HMAC-SHA256 Verification */}
        <section className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-400" /> 2. WhatsApp Inbound Webhook Verification
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Inbound webhook events delivered from Meta WhatsApp Cloud API are verified against the raw request body using HMAC-SHA256:
          </p>
          <div className="p-4 bg-slate-950 rounded-xl font-mono text-xs text-slate-300 space-y-1 border border-slate-800/80">
            <p><span className="text-emerald-400">Header:</span> x-hub-signature-256: sha256=&lt;HASH&gt;</p>
            <p><span className="text-slate-400">Secret:</span> Processed against configured WHATSAPP_APP_SECRET</p>
          </div>
        </section>

        {/* 3. Cron Runner Authentication */}
        <section className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-amber-400" /> 3. Background Job & Cron Authentication
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Background automation scan triggers require the shared cron secret in request headers:
          </p>
          <div className="p-4 bg-slate-950 rounded-xl font-mono text-xs text-slate-300 space-y-1 border border-slate-800/80">
            <p><span className="text-amber-400">Header:</span> x-cron-secret: &lt;YOUR_CRON_SECRET&gt;</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800/80 py-8 bg-slate-950 text-slate-500 text-xs">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 WebCore Studio. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/api-docs" className="hover:text-indigo-400">API Documentation</Link>
            <Link href="/developers" className="hover:text-indigo-400">Developer Portal</Link>
            <Link href="/openapi.json" className="hover:text-indigo-400">OpenAPI Spec</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
