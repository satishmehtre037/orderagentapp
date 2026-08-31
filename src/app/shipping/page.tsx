import React from 'react';
import Link from 'next/link';
import { Truck, ArrowLeft, CheckCircle, Zap } from 'lucide-react';
import { ThemeToggle } from '../../components/ui/ThemeContext';
import { Card, CardContent } from '../../components/ui';

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-base text-fg font-sans antialiased transition-colors duration-150">
      {/* Header */}
      <header className="bg-surface/80 backdrop-blur-md border-b border-line sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-xs font-semibold text-fg hover:text-accent transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Agento AI" className="w-5 h-5 rounded-md object-contain" />
              <span className="text-xs font-semibold text-fg">Agento AI Delivery</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="border-b border-line pb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent-subtle text-accent text-xs font-bold uppercase tracking-wider mb-3 border border-accent-border">
            <Truck className="w-3.5 h-3.5" />
            <span>Digital Delivery Policy</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-fg tracking-tight">
            Shipping &amp; Delivery Policy
          </h1>
          <p className="text-xs text-fg-muted mt-1.5">
            Last Updated: August 2026 | Effective Date: August 2026
          </p>
        </div>

        <Card>
          <CardContent className="p-6 sm:p-8 space-y-6 text-xs sm:text-sm leading-relaxed text-fg-muted">
            <div>
              <h2 className="text-base font-bold text-fg mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-accent" /> 1. Instant Digital Software Delivery
              </h2>
              <p>
                <strong>Agento AI (operated by WebCore Studios)</strong> is a cloud-based Software-as-a-Service (SaaS) and AI automation platform. We do not ship physical goods.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-fg mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-accent" /> 2. Delivery Timeline &amp; Access
              </h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Upon successful online payment via Razorpay, your Pro plan access, higher message credits, and 24/7 AI staff features are activated <strong>instantaneously (within 0–60 seconds)</strong>.</li>
                <li>Confirmation of your subscription and digital tax invoice will be sent to your registered email immediately.</li>
                <li>If you do not see your plan upgrade reflected within 5 minutes, please reach out to <strong className="text-fg">support@webcorestudios.in</strong>.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
