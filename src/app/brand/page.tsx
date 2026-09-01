import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Building2, Mail, Phone, MapPin, Globe, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Agento AI by WebCore Studio — Official Brand Kit & Corporate Identity',
  description:
    'Official Brand Identity, Media Kit, and Corporate NAP for Agento AI by WebCore Studio. Discover our 24/7 Autonomous WhatsApp AI Business OS.',
  alternates: {
    canonical: 'https://orderagentapp.webcorestudio.dev/brand',
  },
};

export default function BrandPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white font-sans">
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>
          <span className="text-xs font-mono uppercase tracking-widest text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
            Brand Kit & NAP
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-10">
        <section className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5" /> Official Brand Identity
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Agento AI by WebCore Studio
          </h1>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            The autonomous WhatsApp AI business operating system that automates clinic appointments, CA tax compliance, and retail e-commerce.
          </p>
        </section>

        {/* Corporate NAP Card */}
        <section className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-400" /> Corporate Entity & Verified NAP
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm text-slate-300">
            <div className="flex items-start gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800/80">
              <Building2 className="w-4 h-4 text-indigo-400 mt-0.5" />
              <div>
                <strong className="block text-white text-xs font-mono">Legal Organization</strong>
                <span>WebCore Studio</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800/80">
              <Globe className="w-4 h-4 text-indigo-400 mt-0.5" />
              <div>
                <strong className="block text-white text-xs font-mono">Canonical Domain</strong>
                <a href="https://orderagentapp.webcorestudio.dev" className="text-indigo-400 underline">https://orderagentapp.webcorestudio.dev</a>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800/80">
              <Phone className="w-4 h-4 text-indigo-400 mt-0.5" />
              <div>
                <strong className="block text-white text-xs font-mono">Telephone / WhatsApp</strong>
                <span>+91 87798 41346</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800/80">
              <Mail className="w-4 h-4 text-indigo-400 mt-0.5" />
              <div>
                <strong className="block text-white text-xs font-mono">Support Email</strong>
                <span>support@webcorestudios.in</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800/80 sm:col-span-2">
              <MapPin className="w-4 h-4 text-indigo-400 mt-0.5" />
              <div>
                <strong className="block text-white text-xs font-mono">Headquarters Address</strong>
                <span>WebCore Studio Tech Hub, Mumbai, Maharashtra 400001, India</span>
              </div>
            </div>
          </div>
        </section>

        {/* Brand Usage Rules */}
        <section className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" /> Brand Nomenclature Guidelines
          </h2>
          <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
            <p>
              When referring to our product in press, technical documentation, or AI agent directories:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
              <li><strong className="text-slate-200">Full Brand Name:</strong> Agento AI by WebCore Studio</li>
              <li><strong className="text-slate-200">Short Name:</strong> Agento AI</li>
              <li><strong className="text-slate-200">Legal Publisher:</strong> WebCore Studio</li>
              <li><strong className="text-slate-200">Category:</strong> Autonomous WhatsApp AI Business OS</li>
            </ul>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800/80 py-8 bg-slate-950 text-slate-500 text-xs">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 WebCore Studio. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/about" className="hover:text-indigo-400">About</Link>
            <Link href="/contact" className="hover:text-indigo-400">Contact</Link>
            <Link href="/api-docs" className="hover:text-indigo-400">API Docs</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
