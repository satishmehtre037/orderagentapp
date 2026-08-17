import React from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export default function TermsPage() {
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
          <div className="flex items-center space-x-2">
            <img src="/logo.png" alt="Agento AI" className="w-6 h-6 rounded-md object-contain" />
            <span className="text-xs font-semibold text-slate-800">Agento AI Legal</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="border-b border-[#E2E8F0] pb-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#E0F2F1] text-[#0F3D3E] text-xs font-bold uppercase tracking-wider mb-3">
            <FileText className="w-3.5 h-3.5" />
            <span>Service Agreement</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#0F3D3E] tracking-tight sm:text-4xl">
            Terms & Conditions
          </h1>
          <p className="text-sm text-[#64748B] mt-2">
            Last Updated: August 16, 2026 | Effective Date: August 16, 2026
          </p>
        </div>

        <section className="prose prose-slate max-w-none space-y-6 text-sm sm:text-base leading-relaxed text-[#334155]">
          <div>
            <h2 className="text-xl font-serif font-bold text-[#0F3D3E] mb-2 flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2 text-[#0F3D3E]" /> 1. Acceptance of Terms
            </h2>
            <p>
              By signing up, creating an account, or subscribing to <strong>WebcoreStudio</strong>’s software services (including <strong>BizBot OS</strong>), you agree to comply with and be bound by these Terms and Conditions. If you disagree with any portion of these terms, you must not access or use our services.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-serif font-bold text-[#0F3D3E] mb-2">
              2. Description of Services
            </h2>
            <p>
              WebcoreStudio provides an AI-powered conversational platform integrating with the Meta WhatsApp Cloud API to automate customer orders, service bookings, catalog inquiries, and lead capturing for retail businesses, salons, cafes, bakeries, gyms, and tuition centres.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-serif font-bold text-[#0F3D3E] mb-2">
              3. Subscription Plans, Billing & Payments
            </h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Free Trials:</strong> New accounts receive an initial free trial window to test and explore the software capabilities.</li>
              <li><strong>Paid Subscriptions:</strong> Subscriptions are billed on a monthly or annual recurring cycle via our licensed payment gateway partner (<strong>Razorpay</strong>).</li>
              <li><strong>Service Activation:</strong> Access to Pro features, unthrottled AI responses, and business order tracking is provisioned immediately upon successful transaction confirmation.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-serif font-bold text-[#0F3D3E] mb-2">
              4. User Responsibilities & Acceptable Use
            </h2>
            <p>
              You agree to use the platform in full compliance with applicable laws, including Meta’s WhatsApp Business Policies. You must not use the service to transmit spam, fraudulent content, copyrighted materials without authorization, or prohibited goods.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-serif font-bold text-[#0F3D3E] mb-2 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-[#0F3D3E]" /> 5. Limitation of Liability
            </h2>
            <p>
              WebcoreStudio shall not be liable for indirect, incidental, or consequential damages resulting from downtime of third-party APIs (such as WhatsApp, Meta, or network telecom carriers).
            </p>
          </div>

          <div>
            <h2 className="text-xl font-serif font-bold text-[#0F3D3E] mb-2">
              6. Governing Law & Jurisdiction
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection with these terms shall be subject to the exclusive jurisdiction of the courts located in Mumbai, Maharashtra, India.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
