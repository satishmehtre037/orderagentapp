import React from 'react';
import Link from 'next/link';
import { Shield, ArrowLeft, Lock, Eye, Server, UserCheck } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1E293B] font-sans antialiased">
      {/* Header */}
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm font-semibold text-[#0F3D3E] hover:text-[#0a292a] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Dashboard
          </Link>
          <span className="text-xs font-mono font-medium px-2.5 py-1 rounded bg-[#F1F5F9] text-[#64748B]">
            WebcoreStudio Legal
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="border-b border-[#E2E8F0] pb-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#E0F2F1] text-[#0F3D3E] text-xs font-bold uppercase tracking-wider mb-3">
            <Shield className="w-3.5 h-3.5" />
            <span>Legal Compliance</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#0F3D3E] tracking-tight sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="text-sm text-[#64748B] mt-2">
            Last Updated: August 16, 2026 | Effective Date: August 16, 2026
          </p>
        </div>

        <section className="prose prose-slate max-w-none space-y-6 text-sm sm:text-base leading-relaxed text-[#334155]">
          <div>
            <h2 className="text-xl font-serif font-bold text-[#0F3D3E] mb-2 flex items-center">
              <Lock className="w-5 h-5 mr-2 text-[#0F3D3E]" /> 1. Overview & Commitment
            </h2>
            <p>
              Welcome to <strong>WebcoreStudio</strong> (operating the <strong>BizBot OS</strong> platform). We are dedicated to protecting your personal information and respecting your data privacy rights. This Privacy Policy details how we collect, store, process, and safeguard information when you use our WhatsApp conversational commerce software, web dashboards, and mobile applications.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-serif font-bold text-[#0F3D3E] mb-2 flex items-center">
              <Eye className="w-5 h-5 mr-2 text-[#0F3D3E]" /> 2. Information We Collect
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
            <h2 className="text-xl font-serif font-bold text-[#0F3D3E] mb-2 flex items-center">
              <Server className="w-5 h-5 mr-2 text-[#0F3D3E]" /> 3. How We Use Your Data
            </h2>
            <p>Collected information is utilized strictly for the following business purposes:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>To power real-time, automated AI customer responses over the official WhatsApp Cloud API.</li>
              <li>To generate live order books, appointment schedules, and lead notifications for store owners.</li>
              <li>To process subscription billing, renewals, and invoice generation.</li>
              <li>To maintain system uptime, prevent unauthorized intrusion, and optimize API performance.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-serif font-bold text-[#0F3D3E] mb-2 flex items-center">
              <UserCheck className="w-5 h-5 mr-2 text-[#0F3D3E]" /> 4. Third-Party Service Providers
            </h2>
            <p>
              We collaborate with industry-leading, ISO/SOC-2 certified infrastructure partners to deliver our services:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li><strong>Meta / WhatsApp Cloud API:</strong> Secure message transmission.</li>
              <li><strong>Razorpay:</strong> RBI-licensed payment gateway for payment processing.</li>
              <li><strong>Supabase:</strong> End-to-end encrypted database storage with Row-Level Security.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-serif font-bold text-[#0F3D3E] mb-2">
              5. Data Security & Retention
            </h2>
            <p>
              We enforce SSL/TLS 256-bit encryption in transit and AES-256 encryption at rest. Your business records and catalogs remain private to your authenticated account. You may request account deletion or data export at any time by contacting our compliance desk.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-serif font-bold text-[#0F3D3E] mb-2">
              6. Contact Our Privacy Officer
            </h2>
            <p>
              If you have any questions or data requests regarding this Privacy Policy, please reach out to:
            </p>
            <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 mt-3 space-y-1 text-sm font-medium">
              <p><strong>Entity:</strong> WebcoreStudio (BizBot OS)</p>
              <p><strong>Email:</strong> support@webcorestudios.in / support@bizbotos.in</p>
              <p><strong>Phone:</strong> +91 97021 57387</p>
              <p><strong>Location:</strong> Mumbai, Maharashtra, India</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
