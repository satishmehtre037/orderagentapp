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
import CAComplianceTab from '../../components/dashboard/ca/CAComplianceTab';
import CADocumentsTab from '../../components/dashboard/ca/CADocumentsTab';
import CALeadsTab from '../../components/dashboard/ca/CALeadsTab';
import CAAutomationControlTab from '../../components/dashboard/ca/CAAutomationControlTab';
import { resolveCategoryFromNameOrType } from '../../lib/constants/categoryPresets';
import { useToast } from '../../components/ui/ToastContext';
import { ThemeToggle } from '../../components/ui/ThemeContext';
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
  Calendar,
  FileText,
  Users,
  Briefcase,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DashboardTab>('orders');

  const [isBotPaused, setIsBotPaused] = useState(false);
  const [pauseLoading, setPauseLoading] = useState(false);

  const { showToast } = useToast();

  const toggleBotPause = async () => {
    try {
      setPauseLoading(true);
      const nextPausedState = !isBotPaused;
      setIsBotPaused(nextPausedState);

      const bizId = business?.id || (typeof window !== 'undefined' ? localStorage.getItem('biz_id') : null);
      const bizEmail = business?.owner_email || (typeof window !== 'undefined' ? localStorage.getItem('biz_email') : null);

      showToast({
        title: nextPausedState ? 'AI Agent Paused' : 'AI Agent Active',
        message: nextPausedState
          ? 'Automated WhatsApp replies are paused. You can reply manually in Live Chats.'
          : 'Automated 24/7 AI staff is active and replying to incoming customer messages.',
        type: nextPausedState ? 'info' : 'whatsapp',
      });

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
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col antialiased text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Sleek iOS Frosted Top Navigation Bar */}
      <header className="backdrop-blur-2xl bg-white/85 dark:bg-slate-900/85 border-b border-slate-200/60 dark:border-slate-800/80 sticky top-0 z-30 shadow-[0_4px_20px_rgba(0,0,0,0.02)] pt-2.5 sm:pt-3 pb-1.5 sm:pb-2 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-2 sm:py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0 pr-2">
            <img
              src="/logo.png"
              alt="Agento AI"
              className="w-10 h-10 rounded-2xl object-contain bg-slate-900 border border-white/20 shadow-md p-1 flex-shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight truncate max-w-[130px] xs:max-w-[180px] sm:max-w-[280px]">
                {business?.name || 'Agento AI Store'}
              </h1>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 bg-slate-200/70 dark:bg-slate-800 border border-slate-300/70 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-md font-bold tracking-wider">
                  {effectiveCategory || business?.category || 'tuition'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                  24/7 AI Staff
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2.5">
            {/* Dark / Light Mode Switch */}
            <ThemeToggle />

            {/* Quick Bot Toggle */}
            <button
              onClick={toggleBotPause}
              disabled={pauseLoading}
              className={`inline-flex items-center space-x-1.5 text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-xl border backdrop-blur-md transition-all shadow-sm active:scale-95 select-none ${
                isBotPaused
                  ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-300/60 dark:border-amber-500/40 hover:bg-amber-500/25'
                  : 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-300/60 dark:border-emerald-500/40 hover:bg-emerald-500/25'
              }`}
              title="Click to pause or activate 24/7 AI agent replies"
            >
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  isBotPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                }`}
              />
              <span className="font-bold whitespace-nowrap">
                {pauseLoading ? 'Updating...' : isBotPaused ? 'AI Paused' : 'AI Active'}
              </span>
            </button>

            <a
              href="https://web.whatsapp.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-300/50 dark:border-emerald-500/30 transition-all shadow-sm"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>WhatsApp Web</span>
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
            </a>

            <button
              onClick={handleLogout}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700 transition-all shadow-sm"
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
        {/* Top 3 Quick Stats Widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Live Plan / Trial Countdown */}
          <div className="backdrop-blur-xl bg-white/75 dark:bg-slate-900/75 border border-white/60 dark:border-slate-800/80 rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-between transition-all hover:shadow-md">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Plan & Subscription</span>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {business?.subscription_status === 'active'
                    ? 'Pro Plan Active'
                    : isTrialEnded
                    ? 'Trial Expired'
                    : 'Free Trial'}
                </span>
                {countdownStr && (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-medium ${
                      isTrialEnded
                        ? 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                        : 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    }`}
                  >
                    {countdownStr}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {business?.subscription_status === 'active'
                  ? 'Full WhatsApp AI Automation & Live CRM'
                  : isTrialEnded
                  ? 'Upgrade to continue automated replies'
                  : 'Full access to WhatsApp automation'}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-300/40 dark:border-emerald-500/30 flex items-center justify-center shadow-inner">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: 24/7 WhatsApp AI Bot Active Status */}
          <div className="backdrop-blur-xl bg-white/75 dark:bg-slate-900/75 border border-white/60 dark:border-slate-800/80 rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-between transition-all hover:shadow-md">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">WhatsApp Automation</span>
              <div className="flex items-center space-x-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isBotPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'
                  }`}
                />
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {isBotPaused
                    ? 'AI Paused'
                    : isTrialEnded
                    ? 'Paused (Trial Ended)'
                    : 'Active & Responding'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isBotPaused ? 'Replies stopped' : 'Auto taking orders & inquiries'}
              </p>
            </div>
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-inner ${
                isBotPaused
                  ? 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-300/40 dark:border-amber-500/30'
                  : 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-300/40 dark:border-emerald-500/30'
              }`}
            >
              {renderCategoryIcon('w-5 h-5')}
            </div>
          </div>

          {/* Card 3: Business Vertical Category */}
          <div className="backdrop-blur-xl bg-white/75 dark:bg-slate-900/75 border border-white/60 dark:border-slate-800/80 rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-between sm:col-span-2 lg:col-span-1 transition-all hover:shadow-md">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Operating Category</span>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-slate-900 dark:text-white capitalize">
                  {effectiveCategory.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                AI customized for {effectiveCategory.replace('_', ' ')} workflow
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-300/40 dark:border-indigo-500/30 flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Desktop & Tablet Segmented Navigation Tabs */}
        <div className="hidden sm:flex bg-slate-200/60 dark:bg-slate-800/80 p-1 rounded-xl items-center space-x-1 overflow-x-auto">
          {effectiveCategory === 'ca_firm' ? (
            <>
              <button
                onClick={() => setActiveTab('ca_compliance')}
                className={`flex-1 min-w-[130px] py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center space-x-1.5 ${
                  activeTab === 'ca_compliance'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>Tax Calendar</span>
              </button>

              <button
                onClick={() => setActiveTab('ca_documents')}
                className={`flex-1 min-w-[130px] py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center space-x-1.5 ${
                  activeTab === 'ca_documents'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                <span>Doc Tracker</span>
              </button>

              <button
                onClick={() => setActiveTab('ca_leads')}
                className={`flex-1 min-w-[130px] py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center space-x-1.5 ${
                  activeTab === 'ca_leads'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-rose-500" />
                <span>Leads CRM</span>
              </button>

              <button
                onClick={() => setActiveTab('ca_automation')}
                className={`flex-1 min-w-[130px] py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center space-x-1.5 ${
                  activeTab === 'ca_automation'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Bot className="w-3.5 h-3.5 text-emerald-500" />
                <span>Cron Engines</span>
              </button>

              <button
                onClick={() => setActiveTab('conversations')}
                className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center space-x-1.5 ${
                  activeTab === 'conversations'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Live Chats</span>
              </button>

              <button
                onClick={() => setActiveTab('billing')}
                className={`flex-1 min-w-[110px] py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center space-x-1.5 ${
                  activeTab === 'billing'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Billing</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex-1 min-w-[140px] py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center space-x-2 ${
                  activeTab === 'orders'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                {renderCategoryIcon('w-4 h-4')}
                <span>{captureTypeLabel} & Ledger</span>
              </button>

              <button
                onClick={() => setActiveTab('conversations')}
                className={`flex-1 min-w-[140px] py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center space-x-2 ${
                  activeTab === 'conversations'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Live Conversations</span>
              </button>

              <button
                onClick={() => setActiveTab('edit_info')}
                className={`flex-1 min-w-[140px] py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center space-x-2 ${
                  activeTab === 'edit_info'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Store Settings & Catalog</span>
              </button>

              <button
                onClick={() => setActiveTab('billing')}
                className={`flex-1 min-w-[140px] py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center space-x-2 ${
                  activeTab === 'billing'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Billing & Pro Plans</span>
              </button>
            </>
          )}
        </div>

        {/* Tab Content Body */}
        <div className="transition-all duration-300">
          {activeTab === 'orders' && (
            <OrdersLedgerTab
              businessId={business?.id || 'demo-business-id'}
              category={business?.category || 'bakery'}
              businessName={business?.name || 'Agento AI Store'}
            />
          )}

          {activeTab === 'ca_compliance' && (
            <CAComplianceTab
              businessId={business?.id}
              businessName={business?.name}
            />
          )}

          {activeTab === 'ca_documents' && (
            <CADocumentsTab
              businessId={business?.id}
              businessName={business?.name}
            />
          )}

          {activeTab === 'ca_leads' && (
            <CALeadsTab
              businessId={business?.id}
              businessName={business?.name}
            />
          )}

          {activeTab === 'ca_automation' && (
            <CAAutomationControlTab
              businessId={business?.id}
              businessName={business?.name}
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
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-2xl bg-white/85 dark:bg-slate-900/90 border-t border-slate-200/60 dark:border-slate-800/80 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] px-3 py-2 flex items-center justify-around pb-safe transition-colors duration-200">
        {effectiveCategory === 'ca_firm' ? (
          <>
            <button
              onClick={() => setActiveTab('ca_compliance')}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all ${
                activeTab === 'ca_compliance'
                  ? 'text-slate-950 dark:text-white font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Calendar className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight font-medium">Calendar</span>
            </button>

            <button
              onClick={() => setActiveTab('ca_documents')}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all ${
                activeTab === 'ca_documents'
                  ? 'text-slate-950 dark:text-white font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight font-medium">Docs</span>
            </button>

            <button
              onClick={() => setActiveTab('ca_leads')}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all ${
                activeTab === 'ca_leads'
                  ? 'text-slate-950 dark:text-white font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Users className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight font-medium">Leads</span>
            </button>

            <button
              onClick={() => setActiveTab('ca_automation')}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all ${
                activeTab === 'ca_automation'
                  ? 'text-slate-950 dark:text-white font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Bot className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight font-medium">Cron</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all ${
                activeTab === 'orders'
                  ? 'text-slate-950 dark:text-white font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {renderCategoryIcon(
                `w-5 h-5 mb-0.5 ${activeTab === 'orders' ? 'text-slate-950 dark:text-white stroke-[2.5]' : 'stroke-[1.8]'}`
              )}
              <span className="text-[10px] tracking-tight font-medium">{captureTypeLabel}</span>
            </button>

            <button
              onClick={() => setActiveTab('conversations')}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all ${
                activeTab === 'conversations'
                  ? 'text-slate-950 dark:text-white font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <MessageSquare className={`w-5 h-5 mb-0.5 ${activeTab === 'conversations' ? 'text-slate-950 dark:text-white stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span className="text-[10px] tracking-tight font-medium">Live Chats</span>
            </button>

            <button
              onClick={() => setActiveTab('edit_info')}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all ${
                activeTab === 'edit_info'
                  ? 'text-slate-950 dark:text-white font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Settings className={`w-5 h-5 mb-0.5 ${activeTab === 'edit_info' ? 'text-slate-950 dark:text-white stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span className="text-[10px] tracking-tight font-medium">Store Info</span>
            </button>

            <button
              onClick={() => setActiveTab('billing')}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all ${
                activeTab === 'billing'
                  ? 'text-slate-950 dark:text-white font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <CreditCard className={`w-5 h-5 mb-0.5 ${activeTab === 'billing' ? 'text-slate-950 dark:text-white stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span className="text-[10px] tracking-tight font-medium">Plan</span>
            </button>
          </>
        )}
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
