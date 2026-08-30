import React from 'react';
import Link from 'next/link';
import { RotateCcw, ArrowLeft, Clock, CheckCircle } from 'lucide-react';
import { ThemeToggle } from '../../components/ui/ThemeContext';
import { Card, CardContent } from '../../components/ui';

export default function RefundPolicyPage() {
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
              <span className="text-xs font-semibold text-fg">Agento AI Billing</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="border-b border-line pb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent-subtle text-accent text-xs font-bold uppercase tracking-wider mb-3 border border-accent-border">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Refund & Cancellation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-fg tracking-tight">
            Cancellation & Refund Policy
          </h1>
          <p className="text-xs text-fg-muted mt-1.5">
            Last Updated: August 2026 | Effective Date: August 2026
          </p>
        </div>

        <Card>
          <CardContent className="p-6 sm:p-8 space-y-6 text-xs sm:text-sm leading-relaxed text-fg-muted">
            <div>
              <h2 className="text-base font-bold text-fg mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent" /> 1. Subscription Cancellations
              </h2>
              <p>
                You may cancel your <strong>WebCore Studios (Agento AI)</strong> recurring subscription at any time directly through your dashboard Billing tab. Upon cancellation, your Pro plan access will remain active until the conclusion of your current paid billing period without any renewal charges.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-fg mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-accent" /> 2. 7-Day Money-Back Guarantee
              </h2>
              <p>
                We stand by our software quality. If you experience technical defects or service disruptions that our engineering team cannot resolve within 48 hours:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li>You are eligible for a <strong>100% full refund</strong> if requested within <strong>7 days</strong> of your initial purchase.</li>
                <li>Duplicate or accidental charges are automatically refunded in full upon verification.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
