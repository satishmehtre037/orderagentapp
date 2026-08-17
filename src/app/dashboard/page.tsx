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
  AlertCircle,
  Phone,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Stethoscope,
  Building2,
  Scissors,
  Dumbbell,
  GraduationCap,
  Coffee,
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
      const userEmail = session?.user?.email || (typeof window !== 'undefined' ? localStorage.getItem('biz_email') : null) || 'owner@bizbotos.in';

      const res = await fetch(`/api/business?email=${encodeURIComponent(userEmail)}`);
      const resData = await res.json();

      if (resData.business) {
        setBusiness(resData.business as Business);
        if (typeof window !== 'undefined') {
          localStorage.setItem('biz_id', resData.business.id);
          if (resData.business.owner_email) {
            localStorage.setItem('biz_email', resData.business.owner_email);
          }
        }
        setIsBotPaused(resData.configs?.bot_paused === true || resData.configs?.bot_paused === 'true');
      } else {
        setBusiness({
          id: 'demo-business-id',
          name: 'Demo Store',
          category: 'bakery',
          whatsapp_number: 'Not configured',
          owner_email: userEmail,
          trial_end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
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

  const [countdownStr, setCountdownStr] = useState('');
  const [isTrialEnded, setIsTrialEnded] = useState(false);

  useEffect(() => {
    if (!business?.trial_end_date) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const end = new Date(business.trial_end_date!).getTime();
      const distance = end - now;

      if (distance <= 0) {
        setCountdownStr('Trial Expired');
        setIsTrialEnded(true);
      } else {
        const hours = Math.floor(distance / (1000 * 60 * 60));
        const mins = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((distance % (1000 * 60)) / 1000);

        if (hours > 0) {
          setCountdownStr(`${hours}h ${mins}m ${secs < 10 ? '0' : ''}${secs}s`);
        } else {
          setCountdownStr(`${mins}m ${secs < 10 ? '0' : ''}${secs}s`);
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
    business?.category === 'salon' || business?.category === 'clinic'
      ? 'Appointments'
      : business?.category === 'tuition'
      ? 'Inquiries'
      : business?.category === 'real_estate'
      ? 'Site Visits'
      : business?.category === 'gym'
      ? 'Passes & Plans'
      : 'Orders';

  const renderCategoryIcon = (cls: string) => {
    switch (business?.category) {
      case 'clinic':
        return <Stethoscope className={cls} />;
      case 'real_estate':
        return <Building2 className={cls} />;
      case 'salon':
        return <Scissors className={cls} />;
      case 'gym':
        return <Dumbbell className={cls} />;
      case 'tuition':
        return <GraduationCap className={cls} />;
      case 'cafe':
        return <Coffee className={cls} />;
      default:
        return <ShoppingBag className={cls} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased text-slate-900 font-sans">
      {/* Sleek Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-sm">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-sm font-bold text-slate-900 leading-tight">
                    {business?.name || 'BizBot OS Store'}
                  </h1>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-md font-semibold">
                    {business?.category || 'bakery'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">Autonomous WhatsApp AI Concierge</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <a
              href="https://web.whatsapp.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center space-x-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-md border border-emerald-200 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>WhatsApp Web</span>
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
            </a>

            <button
              onClick={handleLogout}
              className="inline-flex items-center space-x-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Trial Expired Alert Banner */}
      {isTrialExpired && business?.subscription_status !== 'active' && (
        <div className="bg-amber-500 text-white py-2.5 px-4 text-center text-xs font-medium flex items-center justify-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>
            Your 24-hour free trial has expired. WhatsApp replies are currently paused.
          </span>
          <button
            onClick={() => setActiveTab('billing')}
            className="font-bold underline ml-1 hover:text-amber-100"
          >
            Upgrade for ₹1/month
          </button>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 sm:space-y-6 pb-28 sm:pb-10">
        {/* Metric Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Card 1: Subscription Status */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500">Plan & Subscription</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-lg font-semibold text-slate-900">
                  {business?.subscription_status === 'active' ? 'Pro Plan Active' : 'Free Trial'}
                </span>
                {business?.subscription_status !== 'active' && (
                  <span className="text-xs font-mono font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {countdownStr}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {business?.subscription_status === 'active' ? '₹1/mo unlimited access' : 'Full access to WhatsApp automation'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: WhatsApp Automation Status */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500">WhatsApp Automation</span>
              <div className="flex items-center space-x-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isBotPaused ? 'bg-amber-500' : isTrialExpired ? 'bg-red-500' : 'bg-emerald-500'
                  }`}
                />
                <span className="text-lg font-semibold text-slate-900">
                  {isBotPaused
                    ? 'Paused'
                    : isTrialExpired
                    ? 'Paused (Trial Ended)'
                    : 'Active & Responding'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {business?.whatsapp_number ? `Bound to ${business.whatsapp_number}` : 'Awaiting number config'}
              </p>
            </div>
            <button
              onClick={toggleBotPause}
              disabled={pauseLoading}
              className={`p-2.5 rounded-lg border text-xs font-medium transition-all ${
                isBotPaused
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
              }`}
            >
              {isBotPaused ? <PlayCircle className="w-5 h-5" /> : <PauseCircle className="w-5 h-5" />}
            </button>
          </div>

          {/* Card 3: AI Engine Health */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex items-center justify-between sm:col-span-2 lg:col-span-1">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500">Intelligence Engine</span>
              <div className="flex items-center space-x-1.5">
                <span className="text-lg font-semibold text-slate-900">Groq Whisper + LLaMA</span>
              </div>
              <p className="text-xs text-slate-500">Voice Notes, Hinglish, UPI Links & PDF Bills</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Desktop & Tablet Segmented Navigation Tabs */}
        <div className="hidden sm:flex bg-slate-200/60 p-1 rounded-xl items-center space-x-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 min-w-[140px] py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'orders'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            {renderCategoryIcon('w-4 h-4')}
            <span>{captureTypeLabel} & Ledger</span>
          </button>

          <button
            onClick={() => setActiveTab('conversations')}
            className={`flex-1 min-w-[140px] py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'conversations'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Live Conversations</span>
          </button>

          <button
            onClick={() => setActiveTab('edit_info')}
            className={`flex-1 min-w-[140px] py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'edit_info'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Store & Catalog</span>
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`flex-1 min-w-[140px] py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'billing'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Billing & Plans</span>
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="pt-1">
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

      {/* Mobile Native Bottom Navigation Bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 flex items-center justify-around pb-safe">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all ${
            activeTab === 'orders'
              ? 'text-slate-950 font-semibold scale-105'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {renderCategoryIcon(
            `w-5 h-5 mb-0.5 ${activeTab === 'orders' ? 'text-slate-950 stroke-[2.5]' : 'stroke-[1.8]'}`
          )}
          <span className="text-[10px] tracking-tight">{captureTypeLabel}</span>
        </button>

        <button
          onClick={() => setActiveTab('conversations')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all ${
            activeTab === 'conversations'
              ? 'text-slate-950 font-semibold scale-105'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className={`w-5 h-5 mb-0.5 ${activeTab === 'conversations' ? 'text-slate-950 stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] tracking-tight">Live Chats</span>
        </button>

        <button
          onClick={() => setActiveTab('edit_info')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all ${
            activeTab === 'edit_info'
              ? 'text-slate-950 font-semibold scale-105'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings className={`w-5 h-5 mb-0.5 ${activeTab === 'edit_info' ? 'text-slate-950 stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] tracking-tight">Store Info</span>
        </button>

        <button
          onClick={() => setActiveTab('billing')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all ${
            activeTab === 'billing'
              ? 'text-slate-950 font-semibold scale-105'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className={`w-5 h-5 mb-0.5 ${activeTab === 'billing' ? 'text-slate-950 stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] tracking-tight">Plan</span>
        </button>
      </nav>

      {/* Clean Modern Footer */}
      <footer className="hidden sm:block bg-white border-t border-slate-200 mt-16 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700">BizBot OS</span>
            <span>•</span>
            <span>Enterprise WhatsApp Commerce Engine</span>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-slate-900 transition-colors">
              Terms of Service
            </Link>
            <Link href="/refund" className="hover:text-slate-900 transition-colors">
              Cancellation & Refund Policy
            </Link>
            <Link href="/contact" className="hover:text-slate-900 transition-colors">
              Support & Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
