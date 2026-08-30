import React from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { ThemeToggle } from '../../components/ui/ThemeContext';
import { Card, CardContent } from '../../components/ui';

export default function TermsPage() {
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
              <span className="text-xs font-semibold text-fg">Agento AI Legal</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="border-b border-line pb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent-subtle text-accent text-xs font-bold uppercase tracking-wider mb-3 border border-accent-border">
            <FileText className="w-3.5 h-3.5" />
            <span>Service Agreement</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-fg tracking-tight">
            Terms & Conditions
          </h1>
          <p className="text-xs text-fg-muted mt-1.5">
            Last Updated: August 2026 | Effective Date: August 2026
          </p>
        </div>

        <Card>
          <CardContent className="p-6 sm:p-8 space-y-6 text-xs sm:text-sm leading-relaxed text-fg-muted">
            <div>
              <h2 className="text-base font-bold text-fg mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent" /> 1. Acceptance of Terms
              </h2>
              <p>
                By signing up, creating an account, or subscribing to <strong>WebCore Studios</strong>’ software services (including <strong>Agento AI</strong>), you agree to comply with and be bound by these Terms and Conditions.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-fg mb-2">
                2. Description of Services
              </h2>
              <p>
                Agento AI provides an AI-powered conversational platform integrating with the Meta WhatsApp Cloud API to automate customer orders, appointments, document collection, and fee invoicing for retail businesses, clinics, hospitals, CA practices, cafes, and education centers.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-fg mb-2">
                3. Fair Usage & WhatsApp Compliance
              </h2>
              <p>
                Users must adhere strictly to Meta WhatsApp Business Messaging Policies and avoid sending unsolicited spam or deceptive commercial content.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
