import React from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, ArrowLeft, Clock, MessageSquare } from 'lucide-react';

export default function ContactPage() {
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
            WebcoreStudio Support
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="border-b border-[#E2E8F0] pb-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#E0F2F1] text-[#0F3D3E] text-xs font-bold uppercase tracking-wider mb-3">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Support & Helpdesk</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#0F3D3E] tracking-tight sm:text-4xl">
            Contact Us
          </h1>
          <p className="text-sm text-[#64748B] mt-2">
            Have questions about your subscription, AI setup, or need technical support? We are here to assist you.
          </p>
        </div>

        {/* Contact Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm space-y-4">
            <div className="w-10 h-10 rounded-lg bg-[#E0F2F1] text-[#0F3D3E] flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-[#0F3D3E]">Email Support</h3>
              <p className="text-xs text-[#64748B] mt-1">For general queries, billing, and technical assistance</p>
            </div>
            <p className="text-sm font-semibold text-[#0F3D3E]">
              support@webcorestudios.in<br />
              support@bizbotos.in
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm space-y-4">
            <div className="w-10 h-10 rounded-lg bg-[#E0F2F1] text-[#0F3D3E] flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-[#0F3D3E]">Phone & WhatsApp Helpline</h3>
              <p className="text-xs text-[#64748B] mt-1">Instant assistance via direct call or WhatsApp</p>
            </div>
            <p className="text-sm font-semibold text-[#0F3D3E]">
              +91 97021 57387
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm space-y-4">
            <div className="w-10 h-10 rounded-lg bg-[#E0F2F1] text-[#0F3D3E] flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-[#0F3D3E]">Registered Business Address</h3>
              <p className="text-xs text-[#64748B] mt-1">Official operating office</p>
            </div>
            <p className="text-sm font-medium text-[#334155]">
              WebcoreStudio (BizBot OS)<br />
              Mumbai, Maharashtra, 400001, India
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm space-y-4">
            <div className="w-10 h-10 rounded-lg bg-[#E0F2F1] text-[#0F3D3E] flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-[#0F3D3E]">Operating Hours</h3>
              <p className="text-xs text-[#64748B] mt-1">Customer service team availability</p>
            </div>
            <p className="text-sm font-medium text-[#334155]">
              Monday – Saturday: 9:00 AM – 8:00 PM IST<br />
              Sunday: Emergency Support Only
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
