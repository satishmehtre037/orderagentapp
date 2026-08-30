import React from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, ArrowLeft, Clock, MessageSquare } from 'lucide-react';
import { ThemeToggle } from '../../components/ui/ThemeContext';
import { Card, CardContent } from '../../components/ui';

export default function ContactPage() {
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
              <span className="text-xs font-semibold text-fg">Agento AI Support</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="border-b border-line pb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent-subtle text-accent text-xs font-bold uppercase tracking-wider mb-3 border border-accent-border">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Support & Helpdesk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-fg tracking-tight">
            Contact Us
          </h1>
          <p className="text-xs text-fg-muted mt-1.5">
            Have questions about your subscription, AI setup, or need technical assistance? We are here to help.
          </p>
        </div>

        {/* Contact Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-accent-subtle text-accent flex items-center justify-center border border-accent-border">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-fg">Email Support</h3>
                <p className="text-xs text-fg-muted mt-0.5">For billing, account, and technical queries</p>
              </div>
              <p className="text-xs font-semibold text-accent font-mono">
                support@webcorestudios.in
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-accent-subtle text-accent flex items-center justify-center border border-accent-border">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-fg">Operational Hours</h3>
                <p className="text-xs text-fg-muted mt-0.5">Customer Support & Technical Operations</p>
              </div>
              <p className="text-xs font-semibold text-fg">
                Monday to Saturday: 9:00 AM – 7:00 PM IST
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
