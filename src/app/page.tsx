'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '../lib/supabase/client';

export default function Home() {
  const router = useRouter();
  const [targetRoute, setTargetRoute] = useState<string | null>(null);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Check auth status
    async function checkAuth() {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session?.user) {
          setTargetRoute('/dashboard');
        } else {
          setTargetRoute('/signup');
        }
      } catch {
        setTargetRoute('/signup');
      }
    }

    checkAuth();
  }, []);

  useEffect(() => {
    // Transition after the left-to-right typography sweep completes (~1.6s)
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 1700);

    const redirectTimer = setTimeout(() => {
      if (targetRoute) {
        router.replace(targetRoute);
      } else {
        router.replace('/signup');
      }
    }, 2000);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(redirectTimer);
    };
  }, [targetRoute, router]);

  const letters = ['A', 'g', 'e', 'n', 't', 'o', '\u00A0', 'A', 'I'];

  return (
    <main
      className={`min-h-screen bg-black text-white flex flex-col items-center justify-center select-none overflow-hidden relative font-sans transition-opacity duration-300 ${
        isExiting ? 'animate-splash-exit' : ''
      }`}
    >
      {/* Center Minimalist Typography Wordmark with Left-to-Right Reveal */}
      <div className="relative flex flex-col items-center justify-center" aria-hidden="true">
        {/* Left-to-Right Letter Reveal Container */}
        <div className="flex items-center justify-center text-4xl sm:text-5xl md:text-6xl font-bold tracking-[-0.03em] text-white">
          {letters.map((char, index) => (
            <span
              key={index}
              className="inline-block opacity-0 animate-sweep-letter"
              style={{
                animationDelay: `${index * 85}ms`,
              }}
            >
              {char}
            </span>
          ))}
        </div>

        {/* Hairline Left-to-Right Sweep Accent */}
        <div className="relative w-full h-[1.5px] mt-2.5 overflow-hidden">
          <div className="absolute inset-0 bg-white/70 animate-sweep-line" />
        </div>
      </div>

      {/* Semantic, accessible content for AI crawlers, search engines, and No-JS agents */}
      <section className="sr-only p-8 max-w-4xl mx-auto space-y-6 text-slate-300">
        <h1 className="text-3xl font-bold text-white">
          Agento AI by WebCore Studio — 24/7 Autonomous WhatsApp AI Staff & Business Operating System
        </h1>
        <p>
          Agento AI by WebCore Studio is an autonomous multi-tenant AI business operating system that deploys intelligent 24/7 AI agents across WhatsApp, Voice, and Web. Designed specifically for Indian and global SMBs, clinics, hospitals, CA firms, salons, and retail commerce.
        </p>

        <h2 className="text-2xl font-semibold text-white">Core Industry Automation Suites</h2>
        
        <h3 className="text-xl font-medium text-white">1. Hospital & Clinic OPD Automation</h3>
        <p>
          Automates OPD token booking, doctor schedule discovery, 24h & 2h WhatsApp visit reminders with interactive confirm/reschedule/cancel action buttons, diagnostic PDF lab report delivery with AI summaries, and post-consultation 5-star feedback surveys that route satisfied patients directly to Google Reviews.
        </p>

        <h3 className="text-xl font-medium text-white">2. Chartered Accountant & Tax Firm OS</h3>
        <p>
          Automates monthly GST, TDS, and ITR compliance deadline chasing, intelligent client document collection (PAN, Aadhaar, Bank Statements, Invoices) with OCR classification, quote generation, payment reminders, and instant partner escalation alerts.
        </p>

        <h3 className="text-xl font-medium text-white">3. E-Commerce & Retail Order Engine</h3>
        <p>
          Enables conversational product discovery, WhatsApp catalog browsing, live cart management, Razorpay payment verification, real-time dispatch tracking, and automated customer re-engagement.
        </p>

        <h2 className="text-2xl font-semibold text-white">Developer & Agent Resources</h2>
        <p>
          Agento AI exposes programmatic APIs, OpenAPI specifications, and machine-readable context files for AI agent integration:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><a href="/llms.txt" className="text-blue-400 underline">/llms.txt</a> — Machine-readable LLM summary and when-to-use directory</li>
          <li><a href="/llms-full.txt" className="text-blue-400 underline">/llms-full.txt</a> — Full architectural context, API endpoints, and agent instructions</li>
          <li><a href="/openapi.json" className="text-blue-400 underline">/openapi.json</a> — OpenAPI 3.1 specification for WhatsApp and Business APIs</li>
          <li><a href="/api-docs" className="text-blue-400 underline">/api-docs</a> — Interactive developer documentation and guide</li>
          <li><a href="/cli" className="text-blue-400 underline">/cli</a> — Official Agento AI CLI tool documentation</li>
          <li><a href="/sitemap.xml" className="text-blue-400 underline">/sitemap.xml</a> — XML Sitemap</li>
          <li><a href="/about" className="text-blue-400 underline">/about</a> — About WebCore Studio & Agento AI</li>
          <li><a href="/contact" className="text-blue-400 underline">/contact</a> — Contact & Support</li>
          <li><a href="/privacy" className="text-blue-400 underline">/privacy</a> — Privacy Policy & Data Protection</li>
          <li><a href="/terms" className="text-blue-400 underline">/terms</a> — Terms of Service</li>
        </ul>
      </section>

      {/* NoScript fallback for browsers without JavaScript */}
      <noscript>
        <div className="absolute inset-0 z-50 bg-slate-950 text-slate-100 p-8 overflow-y-auto font-sans">
          <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-3xl font-extrabold text-white">
              Agento AI by WebCore Studio — 24/7 Autonomous WhatsApp AI Staff & Business Operating System
            </h1>
            <p className="text-sm leading-relaxed text-slate-300">
              Welcome to Agento AI by WebCore Studio. Agento AI automates WhatsApp appointment bookings for hospitals, document chasing for CA firms, and catalog order management for retail businesses.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <a href="/login" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg">
                Log In to Dashboard
              </a>
              <a href="/signup" className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg border border-slate-700">
                Start Free Trial
              </a>
              <a href="/about" className="px-5 py-2.5 text-slate-300 hover:text-white">
                About Us
              </a>
              <a href="/cli" className="px-5 py-2.5 text-slate-300 hover:text-white">
                CLI Tool
              </a>
              <a href="/api-docs" className="px-5 py-2.5 text-slate-300 hover:text-white">
                API Docs
              </a>
            </div>
          </div>
        </div>
      </noscript>
    </main>
  );
}
