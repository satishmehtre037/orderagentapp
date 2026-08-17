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
import { resolveCategoryFromNameOrType } from '../../lib/constants/categoryPresets';
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
    try {
      setPauseLoading(true);
      const nextPausedState = !isBotPaused;
      setIsBotPaused(nextPausedState);

      const bizId = business?.id || (typeof window !== 'undefined' ? localStorage.getItem('biz_id') : null);
      const bizEmail = business?.owner_email || (typeof window !== 'undefined' ? localStorage.getItem('biz_email') : null);

      await fetch('/api/business', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: bizId,
          email: bizEmail,
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
        const rawCat = resData.configs?.category || resData.business.category;
        const resolvedCategory = resolveCategoryFromNameOrType(rawCat, resData.business.name);
        const resolvedBiz = {
          ...resData.business,
          category: resolvedCategory,
        };

        setBusiness(resolvedBiz as Business);
        if (typeof window !== 'undefined') {
          localStorage.setItem('biz_id', resData.business.id);
          localStorage.setItem('biz_category', resolvedCategory);
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

  const effectiveCategory = resolveCategoryFromNameOrType(business?.category, business?.name);

  const captureTypeLabel =
    effectiveCategory === 'salon' || effectiveCategory === 'clinic'
      ? 'Appointments'
      : effectiveCategory === 'tuition'
      ? 'Inquiries'
      : effectiveCategory === 'real_estate'
      ? 'Site Visits'
      : effectiveCategory === 'gym'
      ? 'Passes & Plans'
      : 'Orders';

  const renderCategoryIcon = (cls: string) => {
    switch (effectiveCategory) {
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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col antialiased text-slate-900 font-sans">
      {/* Sleek iOS Frosted Top Navigation Bar */}
      <header className="backdrop-blur-2xl bg-white/90 border-b border-slate-200/60 sticky top-0 z-30 shadow-[0_4px_20px_rgba(0,0,0,0.03)] pt-4 pb-3 sm:py-3.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <img
              src="/logo.png"
              alt="Agento AI"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl object-contain bg-slate-950 border border-white/20 shadow-md p-1 flex-shrink-0"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                  {business?.name || 'Agento AI Store'}
                </h1>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-slate-200/70 border border-slate-300/60 text-slate-700 rounded-lg font-bold">
                  {effectiveCategory || 'bakery'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">24/7 WhatsApp AI Staff</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick Bot Toggle */}
            <button
              onClick={toggleBotPause}
              disabled={pauseLoading}
              className={`inline-flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border backdrop-blur-md transition-all shadow-sm active:scale-95 ${
                isBotPaused
                  ? 'bg-amber-500/10 text-amber-800 border-amber-300/50 hover:bg-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-800 border-emerald-300/50 hover:bg-emerald-500/20'
              }`}
              title="Click to pause or activate AI agent replies"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isBotPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'
                }`}
              />
              <span className="hidden xs:inline sm:inline">
                {pauseLoading ? 'Updating...' : isBotPaused ? 'Agent Paused' : 'Agent Active'}
              </span>
            </button>

            <a
              href="https://web.whatsapp.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-700 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-300/50 transition-all shadow-sm"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>WhatsApp Web</span>
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
            </a>

            <button
              onClick={handleLogout}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white/80 hover:bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 transition-all shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Trial Expired Alert Banner */}
      {isTrialExpired && business?.subscription_status !== 'active' && (
        <div className="backdrop-blur-md bg-amber-500/90 text-white py-2.5 px-4 text-center text-xs font-semibold flex items-center justify-center space-x-2 shadow-sm">
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
        {/* Metric Stat Cards with Frosted Glass */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Card 1: Subscription Status */}
          <div className="backdrop-blur-xl bg-white/75 border border-white/60 rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-between transition-all hover:shadow-md">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500">Plan & Subscription</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-lg font-bold text-slate-900">
                  {business?.subscription_status === 'active' ? 'Pro Plan Active' : 'Free Trial'}
                </span>
                {business?.subscription_status !== 'active' && (
                  <span className="text-xs font-mono font-medium text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-300/50">
                    {countdownStr}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {business?.subscription_status === 'active' ? '₹1/mo unlimited access' : 'Full access to WhatsApp automation'}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-300/40 flex items-center justify-center shadow-inner">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: WhatsApp Automation Status */}
          <div className="backdrop-blur-xl bg-white/75 border border-white/60 rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-between transition-all hover:shadow-md">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500">WhatsApp Automation</span>
              <div className="flex items-center space-x-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isBotPaused ? 'bg-amber-500' : isTrialExpired ? 'bg-red-500' : 'bg-emerald-500'
                  }`}
                />
                <span className="text-lg font-bold text-slate-900">
                  {isBotPaused
                    ? 'Paused'
                    : isTrialExpired
                    ? 'Paused (Trial Ended)'
                    : 'Active & Responding'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {isBotPaused ? 'Replies stopped' : 'Auto taking orders & inquiries'}
              </p>
            </div>
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-inner ${
                isBotPaused
                  ? 'bg-amber-500/10 text-amber-600 border-amber-300/40'
                  : 'bg-emerald-500/10 text-emerald-600 border-emerald-300/40'
              }`}
            >
              {renderCategoryIcon('w-5 h-5')}
            </div>
          </div>

          {/* Card 3: Business Vertical Category */}
          <div className="backdrop-blur-xl bg-white/75 border border-white/60 rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-between sm:col-span-2 lg:col-span-1 transition-all hover:shadow-md">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500">Operating Category</span>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-slate-900 capitalize">
                  {effectiveCategory.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                AI customized for {effectiveCategory.replace('_', ' ')} workflow
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 border border-indigo-300/40 flex items-center justify-center shadow-inner">
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

      {/* Mobile Native Bottom Navigation Bar (iOS Frosted Glass) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-2xl bg-white/80 border-t border-slate-200/60 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] px-3 py-2 flex items-center justify-around pb-safe">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all ${
            activeTab === 'orders'
              ? 'text-slate-950 font-bold scale-105'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {renderCategoryIcon(
            `w-5 h-5 mb-0.5 ${activeTab === 'orders' ? 'text-slate-950 stroke-[2.5]' : 'stroke-[1.8]'}`
          )}
          <span className="text-[10px] tracking-tight font-medium">{captureTypeLabel}</span>
        </button>

        <button
          onClick={() => setActiveTab('conversations')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all ${
            activeTab === 'conversations'
              ? 'text-slate-950 font-bold scale-105'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className={`w-5 h-5 mb-0.5 ${activeTab === 'conversations' ? 'text-slate-950 stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] tracking-tight font-medium">Live Chats</span>
        </button>

        <button
          onClick={() => setActiveTab('edit_info')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all ${
            activeTab === 'edit_info'
              ? 'text-slate-950 font-bold scale-105'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings className={`w-5 h-5 mb-0.5 ${activeTab === 'edit_info' ? 'text-slate-950 stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] tracking-tight font-medium">Store Info</span>
        </button>

        <button
          onClick={() => setActiveTab('billing')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all ${
            activeTab === 'billing'
              ? 'text-slate-950 font-bold scale-105'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className={`w-5 h-5 mb-0.5 ${activeTab === 'billing' ? 'text-slate-950 stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] tracking-tight font-medium">Plan</span>
        </button>
      </nav>

      {/* Clean Modern Footer */}
      <footer className="hidden sm:block bg-white border-t border-slate-200 mt-16 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700">Agento AI</span>
            <span>•</span>
            <span>24/7 Autonomous WhatsApp AI Staff & Business OS</span>
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
