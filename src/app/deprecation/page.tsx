import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, ShieldAlert, CheckCircle, FileText, Calendar } from 'lucide-react';

export const metadata = {
  title: 'API Versioning & Deprecation Policy | Agento AI by WebCore Studio',
  description:
    'Official API Lifecycle, Versioning, and Deprecation Policy for Agento AI by WebCore Studio. Learn about our 180-day sunset timeline and deprecation headers.',
  alternates: {
    canonical: 'https://orderagentapp.webcorestudio.dev/deprecation',
  },
};

export default function DeprecationPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white font-sans">
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/api-docs" className="flex items-center gap-2 text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to API Docs
          </Link>
          <span className="text-xs font-mono uppercase tracking-widest text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
            API Lifecycle Policy
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        <section className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono">
            <Clock className="w-3.5 h-3.5" /> RFC 8594 Sunset & Deprecation Standard
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Agento AI API Versioning & Deprecation Policy
          </h1>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            This policy outlines how WebCore Studio manages API changes, signals deprecation, and ensures autonomous AI agents and enterprise integrations experience zero unexpected downtime.
          </p>
        </section>

        {/* 1. Versioning Strategy */}
        <section className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" /> 1. API Versioning Conventions
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Agento AI supports dual versioning mechanisms:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-400">
            <li><strong className="text-slate-200">URL Path Versioning:</strong> All endpoints are accessible via versioned paths such as <code className="text-indigo-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">/api/v1/...</code> alongside canonical aliases.</li>
            <li><strong className="text-slate-200">Header Versioning:</strong> Every response includes the <code className="text-indigo-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">X-API-Version: 2026-09-01</code> header indicating the exact active contract.</li>
          </ul>
        </section>

        {/* 2. Deprecation Timeline */}
        <section className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" /> 2. 180-Day Sunset Guarantee
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            We guarantee a minimum of <strong className="text-white">180 days advance notice</strong> before removing or modifying any endpoint in a backwards-incompatible manner.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-xs font-mono text-amber-400 font-semibold">Stage 1: Notice</span>
              <p className="text-xs text-slate-400">Announced via email, release notes, and OpenAPI spec.</p>
            </div>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-xs font-mono text-amber-400 font-semibold">Stage 2: Deprecation</span>
              <p className="text-xs text-slate-400">HTTP Deprecation and Sunset headers returned on all calls.</p>
            </div>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-xs font-mono text-emerald-400 font-semibold">Stage 3: Sunset</span>
              <p className="text-xs text-slate-400">Endpoint gracefully transitions to HTTP 410 Gone.</p>
            </div>
          </div>
        </section>

        {/* 3. HTTP Header Standards */}
        <section className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" /> 3. Machine-Readable Deprecation Headers
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Deprecated operations return standard RFC 8594 headers to allow autonomous agents to self-adjust:
          </p>
          <div className="p-4 bg-slate-950 rounded-xl font-mono text-xs text-slate-300 space-y-2 border border-slate-800/80 overflow-x-auto">
            <p><span className="text-amber-400">Deprecation:</span> @1756684800</p>
            <p><span className="text-amber-400">Sunset:</span> Wed, 01 Sep 2027 00:00:00 GMT</p>
            <p><span className="text-indigo-400">Link:</span> &lt;https://orderagentapp.webcorestudio.dev/deprecation&gt;; rel=&quot;deprecation&quot;</p>
          </div>
        </section>

        {/* 4. Active API Status */}
        <section className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
          <h2 className="text-base font-bold text-emerald-400 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Current API Lifecycle Status: Active (v1)
          </h2>
          <p className="text-xs text-slate-300">
            All endpoints documented in our <a href="/openapi.json" className="text-indigo-400 underline">OpenAPI 3.1 Specification</a> are fully active and supported under SLA.
          </p>
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
