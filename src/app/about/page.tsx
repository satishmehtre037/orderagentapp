import React from 'react';
import Link from 'next/link';
import { Shield, Sparkles, Building2, Users, Cpu, ArrowLeft, ArrowRight, CheckCircle2, Lock } from 'lucide-react';
import { ThemeToggle } from '../../components/ui/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui';

export const metadata = {
  title: 'About Agento AI | WebCore Studio',
  description:
    'Learn about Agento AI by WebCore Studio — our mission, autonomous multi-tenant WhatsApp AI architecture, data privacy standards, and team.',
  alternates: {
    canonical: 'https://orderagentapp.webcorestudio.dev/about',
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-base text-fg font-sans antialiased transition-colors duration-150">
      {/* Header */}
      <header className="bg-surface/80 backdrop-blur-md border-b border-line sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
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
              <span className="text-xs font-semibold text-fg">Agento AI by WebCore Studio</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Hero Section */}
        <div className="border-b border-line pb-8 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent-subtle text-accent text-xs font-bold uppercase tracking-wider border border-accent-border">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autonomous Intelligence for Real-World Business</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">
            About Agento AI & WebCore Studio
          </h1>
          <p className="text-sm text-fg-muted leading-relaxed max-w-3xl">
            Agento AI was created by WebCore Studio to bridge the gap between complex enterprise AI capabilities and everyday business operations. We build 24/7 autonomous AI assistants that manage WhatsApp conversations, OPD appointments, CA compliance reminders, and e-commerce orders with zero manual overhead.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="w-9 h-9 rounded-lg bg-accent-subtle text-accent flex items-center justify-center border border-accent-border mb-2">
                <Building2 className="w-4 h-4" />
              </div>
              <CardTitle className="text-lg font-bold">Our Mission</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-fg-muted leading-relaxed space-y-2">
              <p>
                To provide every doctor, chartered accountant, salon owner, and retail merchant with an enterprise-grade AI staff member who never sleeps, never misses an inquiry, and speaks the native language of their customers.
              </p>
              <p>
                We believe conversational WhatsApp automation should be instant to deploy, secure by design, and deeply integrated with existing business workflows.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-9 h-9 rounded-lg bg-accent-subtle text-accent flex items-center justify-center border border-accent-border mb-2">
                <Cpu className="w-4 h-4" />
              </div>
              <CardTitle className="text-lg font-bold">The Technology Stack</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-fg-muted leading-relaxed space-y-2">
              <p>
                Agento AI combines Meta Official WhatsApp Cloud APIs, Claude 3.5 Sonnet / Groq Llama 3 for low-latency reasoning, Whisper for regional voice note transcription, and Supabase for real-time tenant data isolation.
              </p>
              <p>
                Every message is processed with HMAC-SHA256 signature verification, row-level security (RLS), and end-to-end audit logging.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Core Pillars */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-fg">Key Capabilities & Industry Vertical Engines</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-line bg-surface space-y-2">
              <div className="flex items-center gap-2 text-accent font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Hospital & Clinic OS</span>
              </div>
              <p className="text-xs text-fg-muted leading-relaxed">
                24h & 2h appointment reminder scans, interactive WhatsApp confirmation buttons, token dispatch, lab report OCR delivery, and Google review survey routing.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-line bg-surface space-y-2">
              <div className="flex items-center gap-2 text-accent font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>CA & Tax Advisory</span>
              </div>
              <p className="text-xs text-fg-muted leading-relaxed">
                Automated monthly GST, TDS, and ITR compliance countdown reminders, document chasing via WhatsApp upload, client billing recovery, and hot lead alerts.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-line bg-surface space-y-2">
              <div className="flex items-center gap-2 text-accent font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Commerce & Retail</span>
              </div>
              <p className="text-xs text-fg-muted leading-relaxed">
                Conversational catalog search, Razorpay UPI payment integration, instant invoice generation, live order tracking, and abandoned cart re-engagement.
              </p>
            </div>
          </div>
        </div>

        {/* Security & Data Integrity */}
        <Card className="border-accent/30 bg-surface">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2 text-accent font-bold text-sm">
              <Shield className="w-4 h-4" />
              <span>Enterprise Security & Data Protection</span>
            </div>
            <p className="text-xs text-fg-muted leading-relaxed">
              We uphold strict tenant isolation standards. Your business data, patient consultation logs, financial invoices, and customer contact records are encrypted at rest and in transit. We never sell customer data or share proprietary business records across tenants.
            </p>
          </CardContent>
        </Card>

        {/* Company Information & NAP */}
        <div className="border-t border-line pt-6 space-y-4">
          <h2 className="text-base font-bold text-fg">Corporate & Contact Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-fg-muted">
            <div className="space-y-1">
              <p><span className="font-semibold text-fg">Parent Company:</span> WebCore Studio</p>
              <p><span className="font-semibold text-fg">Platform:</span> Agento AI Business OS</p>
              <p><span className="font-semibold text-fg">Headquarters:</span> Mumbai, Maharashtra, India</p>
              <p><span className="font-semibold text-fg">Postal Code:</span> 400001</p>
            </div>
            <div className="space-y-1">
              <p><span className="font-semibold text-fg">Email:</span> support@webcorestudios.in</p>
              <p><span className="font-semibold text-fg">Phone / WhatsApp:</span> +91 87798 41346</p>
              <p><span className="font-semibold text-fg">Operational Hours:</span> 24/7 Automated Support & Mon–Sat 9AM–7PM IST Desk</p>
              <p><span className="font-semibold text-fg">Official Website:</span> <a href="https://orderagentapp.webcorestudio.dev" className="text-accent underline">orderagentapp.webcorestudio.dev</a></p>
            </div>
          </div>
        </div>

        {/* Call to action */}
        <div className="p-6 rounded-xl bg-accent-subtle border border-accent-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-fg">Ready to deploy your AI staff?</h3>
            <p className="text-xs text-fg-muted mt-0.5">Start your 14-day risk-free trial in under 60 seconds.</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/signup"
              className="px-4 py-2 bg-accent text-accent-fg hover:opacity-90 font-semibold text-xs rounded-lg inline-flex items-center gap-1.5 transition-opacity"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/contact"
              className="px-4 py-2 bg-surface text-fg hover:bg-surface-subtle font-semibold text-xs rounded-lg border border-line transition-colors"
            >
              Contact Team
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
