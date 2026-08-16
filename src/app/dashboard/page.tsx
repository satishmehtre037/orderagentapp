'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '../../lib/supabase/client';
import { Business, DashboardTab } from '../../types';
import { OrdersLedgerTab } from '../../components/dashboard/OrdersLedgerTab';
import { ConversationsTab } from '../../components/dashboard/ConversationsTab';
import { EditBusinessInfoTab } from '../../components/dashboard/EditBusinessInfoTab';
import { BillingTab } from '../../components/dashboard/BillingTab';
import {
  Bot,
  ShoppingBag,
  MessageSquare,
  Settings,
  CreditCard,
  LogOut,
  Clock,
  AlertTriangle,
  PhoneCall,
  Sparkles,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DashboardTab>('orders');

  const [isBotPaused, setIsBotPaused] = useState(false);
  const [pauseLoading, setPauseLoading] = useState(false);

  const toggleBotPause = async () => {
    if (!business?.id) return;
    try {
      setPauseLoading(true);
      const nextPausedState = !isBotPaused;
      setIsBotPaused(nextPausedState);
      await fetch('/api/business', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          configs: [{ config_key: 'bot_paused', config_value: nextPausedState }],
        }),
      });
    } catch (e) {
      console.error('Error toggling bot pause status:', e);
    } finally {
      setPauseLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      const userEmail = session?.user?.email || 'owner@bizbotos.in';

      // Fetch business via server API route (bypasses RLS using service role key)
      const res = await fetch(`/api/business?email=${encodeURIComponent(userEmail)}`);
      const resData = await res.json();

      if (resData.business) {
        setBusiness(resData.business as Business);
        setIsBotPaused(resData.configs?.bot_paused === true || resData.configs?.bot_paused === 'true');
      } else {
        console.warn('[Dashboard] No business found for email:', userEmail);
        // Only show fallback if truly no data
        setBusiness({
          id: 'demo-business-id',
          name: 'BizBot Demo',
          category: 'bakery',
          whatsapp_number: 'Not configured',
          owner_email: userEmail,
          trial_end_date: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
          subscription_status: 'trial',
          plan: 'trial',
          created_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Error loading dashboard business record:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
    router.push('/login');
  };

  // 1-Day (24-Hour) Countdown state synced with live UTC timestamp
  const [countdownStr, setCountdownStr] = useState('');
  const [isTrialEnded, setIsTrialEnded] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      if (!business?.trial_end_date) {
        setCountdownStr('24h 00m left');
        return;
      }
      const end = new Date(business.trial_end_date).getTime();
      const diffMs = end - Date.now();

      if (diffMs <= 0) {
        setIsTrialEnded(true);
        setCountdownStr('Trial Expired');
      } else {
        setIsTrialEnded(false);
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
        if (hours > 0) {
          setCountdownStr(`${hours}h ${mins}m ${secs < 10 ? '0' : ''}${secs}s left`);
        } else {
          setCountdownStr(`${mins}m ${secs < 10 ? '0' : ''}${secs}s left`);
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [business?.trial_end_date]);

  const isTrialExpired =
    business?.subscription_status === 'expired' ||
    (business?.subscription_status === 'trial' && isTrialEnded);

  const captureTypeLabel =
    business?.category === 'salon'
      ? 'Bookings'
      : business?.category === 'tuition'
      ? 'Leads'
      : 'Orders';

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      {/* Top Header Bar */}
      <header className="bg-paper border-b border-warm-border sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-teal text-paper p-2 rounded-lg">
              <Bot className="w-5 h-5 text-marigold" />
            </div>
            <div>
              <h1 className="font-serif text-lg font-bold text-ink leading-tight">
                {loading ? 'Loading...' : business?.name}
              </h1>
              <span className="inline-block text-[10px] font-mono uppercase tracking-wider px-2 py-0.2 rounded bg-warm-card border border-warm-border text-ink-muted">
                {business?.category || 'Bakery'} Category
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* AI Agent Pause/Live Toggle Switch */}
            <button
              onClick={toggleBotPause}
              disabled={pauseLoading}
              title={isBotPaused ? 'Click to Resume AI Bot' : 'Click to Pause AI Bot'}
              className={`inline-flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-md border transition-all ${
                isBotPaused
                  ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isBotPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'
                }`}
              />
              <span>{pauseLoading ? 'Updating...' : isBotPaused ? 'AI Paused (Paused)' : 'AI Live 🟢'}</span>
            </button>

            <div className="hidden sm:flex items-center space-x-2 text-xs font-mono text-ink-muted bg-warm-card px-3 py-1.5 rounded border border-warm-border">
              <PhoneCall className="w-3.5 h-3.5 text-teal" />
              <span>{business?.whatsapp_number}</span>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center space-x-1 text-xs font-semibold px-3 py-1.5 rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Trial Expired Red Alert Banner */}
      {isTrialExpired && business?.subscription_status !== 'active' && (
        <div className="bg-red-100 border-b border-red-300 py-3 px-4 text-center text-xs font-medium text-red-900 flex items-center justify-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>
            Your 1-day free trial has ended — WhatsApp AI assistant is paused. Upgrade for ₹1 to keep receiving automated orders.
          </span>
          <button
            onClick={() => setActiveTab('billing')}
            className="font-bold text-red-800 underline ml-1 hover:text-red-950"
          >
            Renew Now — ₹1/mo
          </button>
        </div>
      )}

      {/* Main Dashboard Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Trial Status & AI Agent Summary Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Trial Status */}
          <div className="bg-paper border-2 border-warm-border rounded-lg p-4 shadow-ledger flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-ink-light uppercase block mb-0.5">
                PLAN STATUS
              </span>
              <div className="flex items-baseline space-x-2">
                {business?.subscription_status === 'active' ? (
                  <span className="font-serif text-xl font-bold text-sage">Pro Active</span>
                ) : (
                  <>
                    <span className="font-mono text-xl font-bold text-teal tabular-nums">
                      {countdownStr}
                    </span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-ink-muted mt-0.5">
                {business?.subscription_status === 'active'
                  ? '₹1/mo Plan Active'
                  : isTrialExpired
                  ? 'AI Replies Paused'
                  : '1-Day Free Trial Window'}
              </p>
            </div>
            <div className="p-2.5 bg-teal-light text-teal rounded-full">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          {/* WhatsApp Agent */}
          <div className="bg-paper border-2 border-warm-border rounded-lg p-4 shadow-ledger flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-ink-light uppercase block mb-0.5">
                WHATSAPP AGENT
              </span>
              <div className="flex items-center space-x-1.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isBotPaused
                      ? 'bg-amber-500'
                      : isTrialExpired
                      ? 'bg-red-500'
                      : 'bg-sage animate-pulse'
                  }`}
                />
                <span className="font-serif text-base font-bold text-ink">
                  {isBotPaused
                    ? 'Paused by Owner'
                    : isTrialExpired
                    ? 'Paused (Expired)'
                    : 'Live & Listening'}
                </span>
              </div>
              <p className="text-[11px] font-mono text-teal font-semibold mt-0.5">
                {business?.whatsapp_number}
              </p>
            </div>
            <button
              onClick={toggleBotPause}
              disabled={pauseLoading}
              className={`p-2 rounded-lg border text-xs font-bold transition-all ${
                isBotPaused
                  ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
              }`}
            >
              {isBotPaused ? '▶ Resume' : '⏸ Pause'}
            </button>
          </div>

          {/* System Prompt */}
          <div className="bg-paper border-2 border-warm-border rounded-lg p-4 shadow-ledger flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-ink-light uppercase block mb-0.5">
                SYSTEM PROMPT
              </span>
              <div className="flex items-center space-x-1.5 text-sage">
                <Sparkles className="w-4 h-4 text-marigold" />
                <span className="font-serif text-base font-bold text-ink">Category Hydrated</span>
              </div>
              <p className="text-[11px] text-ink-muted mt-0.5">Ready for auto replies</p>
            </div>
            <div className="p-2.5 bg-marigold-light text-marigold rounded-full">
              <Bot className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <div className="border-b border-warm-border flex items-center space-x-2 overflow-x-auto scrollbar-none pb-0.5">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-3 font-serif text-sm font-bold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-teal text-teal bg-warm-card/40'
                : 'border-transparent text-ink-muted hover:text-ink hover:border-warm-border'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{captureTypeLabel} Ledger</span>
          </button>

          <button
            onClick={() => setActiveTab('conversations')}
            className={`px-4 py-3 font-serif text-sm font-bold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'conversations'
                ? 'border-teal text-teal bg-warm-card/40'
                : 'border-transparent text-ink-muted hover:text-ink hover:border-warm-border'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Conversations & Logs</span>
          </button>

          <button
            onClick={() => setActiveTab('edit_info')}
            className={`px-4 py-3 font-serif text-sm font-bold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'edit_info'
                ? 'border-teal text-teal bg-warm-card/40'
                : 'border-transparent text-ink-muted hover:text-ink hover:border-warm-border'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Edit Business Info</span>
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`px-4 py-3 font-serif text-sm font-bold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'billing'
                ? 'border-teal text-teal bg-warm-card/40'
                : 'border-transparent text-ink-muted hover:text-ink hover:border-warm-border'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Billing & Plan</span>
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="pt-2">
          {activeTab === 'orders' && (
            <OrdersLedgerTab
              businessId={business?.id || 'demo-business-id'}
              category={business?.category || 'bakery'}
              businessName={business?.name || 'Our Business'}
            />
          )}

          {activeTab === 'conversations' && (
            <ConversationsTab businessId={business?.id || 'demo-business-id'} />
          )}

          {activeTab === 'edit_info' && (
            <EditBusinessInfoTab
              businessId={business?.id || 'demo-business-id'}
              category={business?.category || 'bakery'}
              onUpdated={loadDashboardData}
            />
          )}

          {activeTab === 'billing' && (
            <BillingTab
              businessId={business?.id || 'demo-business-id'}
              category={business?.category || 'bakery'}
              trialEndDateStr={business?.trial_end_date}
              subscriptionStatus={business?.subscription_status || 'trial'}
              plan={business?.plan || 'trial'}
              onSubscriptionUpdated={loadDashboardData}
            />
          )}
        </div>
      </main>

      {/* Compliance & Legal Footer */}
      <footer className="bg-white border-t border-warm-border mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-muted">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-ink">WebcoreStudio</span>
            <span>•</span>
            <span>BizBot OS Commerce Platform</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 font-medium">
            <Link href="/privacy" className="hover:text-teal transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-teal transition-colors">
              Terms & Conditions
            </Link>
            <Link href="/refund" className="hover:text-teal transition-colors">
              Cancellation & Refund Policy
            </Link>
            <Link href="/contact" className="hover:text-teal transition-colors">
              Contact & Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
