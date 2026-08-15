import React from 'react';
import Link from 'next/link';
import { RotateCcw, ArrowLeft, Clock, CheckCircle, HelpCircle } from 'lucide-react';

export default function RefundPolicyPage() {
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
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Refund & Cancellation</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#0F3D3E] tracking-tight sm:text-4xl">
            Cancellation & Refund Policy
          </h1>
          <p className="text-sm text-[#64748B] mt-2">
            Last Updated: August 16, 2026 | Effective Date: August 16, 2026
          </p>
        </div>

        <section className="prose prose-slate max-w-none space-y-6 text-sm sm:text-base leading-relaxed text-[#334155]">
          <div>
            <h2 className="text-xl font-serif font-bold text-[#0F3D3E] mb-2 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-[#0F3D3E]" /> 1. Subscription Cancellations
            </h2>
            <p>
              You may cancel your <strong>WebcoreStudio (BizBot OS)</strong> recurring subscription at any time directly through your dashboard or by emailing our billing support desk. Upon cancellation, your Pro plan access will remain active until the conclusion of your current paid billing period without any additional renewal charges.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-serif font-bold text-[#0F3D3E] mb-2 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-[#0F3D3E]" /> 2. 7-Day Money-Back Guarantee / Refund Eligibility
            </h2>
            <p>
              We stand by our software quality. If you experience technical defects or service disruptions that our engineering team cannot resolve within 48 hours of notification:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>You are eligible for a <strong>100% full refund</strong> if requested within <strong>7 days</strong> of your initial subscription purchase.</li>
              <li>Duplicate or accidental charges are automatically refunded in full upon verification.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-serif font-bold text-[#0F3D3E] mb-2 flex items-center">
              <HelpCircle className="w-5 h-5 mr-2 text-[#0F3D3E]" /> 3. Refund Processing Timelines
            </h2>
            <p>
              Once approved by our billing desk, refunds are initiated immediately through our payment gateway partner (<strong>Razorpay</strong>). The funds will be credited back to your original source of payment (Bank Account, UPI ID, or Credit/Debit Card) within <strong>5 to 7 business days</strong> as per standard banking clearing cycles.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-serif font-bold text-[#0F3D3E] mb-2">
              4. How to Request a Refund
            </h2>
            <p>
              To initiate a cancellation or refund request, please email your transaction details (Payment ID or Registered Mobile Number) to:
            </p>
            <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 mt-3 space-y-1 text-sm font-medium">
              <p><strong>Support Desk:</strong> support@webcorestudios.in</p>
              <p><strong>Direct Helpline:</strong> +91 97021 57387</p>
              <p><strong>Turnaround Time:</strong> Within 24 hours</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
