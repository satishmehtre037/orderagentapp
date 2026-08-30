import React from 'react';
import Link from 'next/link';
import { Shield, ArrowLeft, Lock, Eye, Server, UserCheck } from 'lucide-react';
import { ThemeToggle } from '../../components/ui/ThemeContext';
import { Card, CardContent } from '../../components/ui';

export default function PrivacyPolicyPage() {
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
            <Shield className="w-3.5 h-3.5" />
            <span>Legal Compliance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-fg tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs text-fg-muted mt-1.5">
            Last Updated: August 2026 | Effective Date: August 2026
          </p>
        </div>

        <Card>
          <CardContent className="p-6 sm:p-8 space-y-6 text-xs sm:text-sm leading-relaxed text-fg-muted">
            <div>
              <h2 className="text-base font-bold text-fg mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4 text-accent" /> 1. Overview & Commitment
              </h2>
              <p>
                Welcome to <strong>WebCore Studios</strong> (operating the <strong>Agento AI</strong> platform). We are dedicated to protecting your personal information and respecting your data privacy rights. This Privacy Policy details how we collect, store, process, and safeguard information when you use our WhatsApp conversational AI software, web dashboards, and mobile applications.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-fg mb-2 flex items-center gap-2">
                <Eye className="w-4 h-4 text-accent" /> 2. Information We Collect
              </h2>
              <p>We only collect data necessary to provide our WhatsApp AI business automation services:</p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li><strong>Account Credentials:</strong> Name, business name, official email address, and phone numbers.</li>
                <li><strong>Business Catalog Data:</strong> Menus, service offerings, pricing tiers, business hours, and operational policies.</li>
                <li><strong>WhatsApp Interaction Records:</strong> Inbound and outbound customer messages, inquiry contexts, and automated booking/order payloads.</li>
                <li><strong>Payment & Billing Data:</strong> Transaction IDs, invoice details, and subscription tiers processed securely via Razorpay (we never store your raw credit/debit card numbers or UPI MPINs).</li>
              </ul>
            </div>

            <div>
              <h2 className="text-base font-bold text-fg mb-2 flex items-center gap-2">
                <Server className="w-4 h-4 text-accent" /> 3. Data Storage & Security
              </h2>
              <p>
                All data is encrypted in transit (TLS 1.3) and at rest (AES-256) using Supabase Postgres cloud infrastructure with Row-Level Security (RLS) policies enforcing multi-tenant isolation.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-fg mb-2 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-accent" /> 4. Data Ownership & Deletion
              </h2>
              <p>
                You retain complete ownership over your business data and customer transaction history. You can permanently delete your entire account and associated records at any time from your Dashboard Billing settings.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
