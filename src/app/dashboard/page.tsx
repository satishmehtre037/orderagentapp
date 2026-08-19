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
import CADashboardOverviewTab from '../../components/dashboard/ca/CADashboardOverviewTab';
import CAInvoicesTab from '../../components/dashboard/ca/CAInvoicesTab';
import CAAIAgentTab from '../../components/dashboard/ca/CAAIAgentTab';
import CANewClientModal from '../../components/dashboard/ca/CANewClientModal';
import HospitalDashboardOverviewTab from '../../components/dashboard/hospital/HospitalDashboardOverviewTab';
import HospitalAppointmentsTab from '../../components/dashboard/hospital/HospitalAppointmentsTab';
import HospitalPatientsTab from '../../components/dashboard/hospital/HospitalPatientsTab';
import HospitalReportsTab from '../../components/dashboard/hospital/HospitalReportsTab';
import HospitalVoiceCallsTab from '../../components/dashboard/hospital/HospitalVoiceCallsTab';
import HospitalFeedbackTab from '../../components/dashboard/hospital/HospitalFeedbackTab';
import HospitalAIAgentTab from '../../components/dashboard/hospital/HospitalAIAgentTab';
import HospitalAutomationTab from '../../components/dashboard/hospital/HospitalAutomationTab';
import HospitalNewAppointmentModal from '../../components/dashboard/hospital/HospitalNewAppointmentModal';
import HospitalNewPatientModal from '../../components/dashboard/hospital/HospitalNewPatientModal';
import HospitalUploadReportModal from '../../components/dashboard/hospital/HospitalUploadReportModal';
import { resolveCategoryFromNameOrType, getCategoryDisplayMetadata } from '../../lib/constants/categoryPresets';
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
  UserPlus,
  Receipt,
  Zap,
  Plus,
  BarChart3,
  LayoutGrid,
  X,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DashboardTab>('orders');
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isMobileAllTabsOpen, setIsMobileAllTabsOpen] = useState(false);
  const [isNewHospitalApptModalOpen, setIsNewHospitalApptModalOpen] = useState(false);
  const [isNewHospitalPatientModalOpen, setIsNewHospitalPatientModalOpen] = useState(false);
  const [isUploadHospitalReportModalOpen, setIsUploadHospitalReportModalOpen] = useState(false);

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
        if (resolvedCategory === 'ca_firm') {
          setActiveTab('ca_dashboard');
        } else if (resolvedCategory === 'clinic' || resolvedCategory === 'hospital') {
          setActiveTab('hospital_dashboard');
        }
        if (typeof window !== 'undefined') {
          localStorage.setItem('biz_id', resData.business.id);
          localStorage.setItem('biz_category', resolvedCategory);
          if (resData.business.owner_email) {
            localStorage.setItem('biz_email', resData.business.owner_email);
          }
        }
        setIsBotPaused(resData.configs?.bot_paused === true || resData.configs?.bot_paused === 'true');
      } else {
        // If user is authenticated with email, direct them straight to onboarding wizard
        if (session?.user?.email) {
          router.push('/onboarding');
          return;
        }

        const storedCat = (typeof window !== 'undefined' ? localStorage.getItem('biz_category') : null) || 'hospital';
        const isHospital = storedCat === 'hospital' || storedCat === 'clinic';
        const isCA = storedCat === 'ca_firm';

        const demoName = isHospital
          ? 'MediCare Multi-Specialty Hospital'
          : isCA
          ? 'Sharma & Associates (CA Firm)'
          : 'Apex Business Studio';

        setBusiness({
          id: 'demo-business-id',
          name: demoName,
          category: (storedCat as any) || 'hospital',
          whatsapp_number: 'Not configured',
          owner_email: userEmail,
          trial_end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          subscription_status: 'trial',
          plan: 'trial',
          created_at: new Date().toISOString(),
        });
        setActiveTab(isHospital ? 'hospital_dashboard' : isCA ? 'ca_dashboard' : 'orders');
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

  const effectiveCategory = business?.category || 'ca_firm';
  const isHospital = effectiveCategory === 'clinic' || effectiveCategory === 'hospital';

  const captureTypeLabel =
    effectiveCategory === 'clinic' || effectiveCategory === 'hospital'
      ? 'Appointments'
      : effectiveCategory === 'real_estate'
      ? 'Site Visits'
      : effectiveCategory === 'salon'
      ? 'Appointments'
      : effectiveCategory === 'tuition'
      ? 'Admissions'
      : effectiveCategory === 'gym'
      ? 'Passes & Plans'
      : 'Orders';

  const renderCategoryIcon = (cls: string) => {
    switch (effectiveCategory) {
      case 'clinic':
      case 'hospital':
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
      case 'ca_firm':
        return <Briefcase className={cls} />;
      default:
        return <ShoppingBag className={cls} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col antialiased text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Sleek Top Navigation Bar */}
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
                {business?.name || 'MediCare Hospital & Research Centre'}
              </h1>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 bg-slate-200/70 dark:bg-slate-800 border border-slate-300/70 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-md font-bold tracking-wider">
                  {effectiveCategory === 'ca_firm' ? 'Chartered Accountant' : isHospital ? 'Hospital & Clinic CRM' : effectiveCategory}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                  24/7 AI Practice
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2.5">
            {/* Dark / Light Mode Switch */}
            <ThemeToggle />

            {/* Quick + New Client button for CA Firm */}
            {effectiveCategory === 'ca_firm' && (
              <button
                onClick={() => setIsNewClientModalOpen(true)}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 px-3 py-1.5 rounded-xl transition-all shadow-sm active:scale-95"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">+ New Client</span>
              </button>
            )}

            {/* Quick + Book Consultation button for Hospital */}
            {isHospital && (
              <button
                onClick={() => setIsNewHospitalApptModalOpen(true)}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 px-3 py-1.5 rounded-xl transition-all shadow-sm active:scale-95"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">+ Book OPD</span>
              </button>
            )}

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
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Demo Store Notice Banner */}
      {business?.id === 'demo-business-id' && (() => {
        const demoMeta = getCategoryDisplayMetadata(business?.category, business?.name);
        return (
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white px-4 py-3 text-xs sm:text-sm font-medium flex flex-col sm:flex-row items-center justify-between gap-2 shadow-md">
            <div className="flex items-center gap-2 text-center sm:text-left">
              <Sparkles className="w-4 h-4 text-amber-300 flex-shrink-0" />
              <span>You are currently in Preview Mode. {demoMeta.bannerPrompt}</span>
            </div>
            <Link
              href="/onboarding"
              className="px-3.5 py-1.5 bg-white text-indigo-700 font-bold rounded-xl shadow hover:bg-indigo-50 transition whitespace-nowrap text-xs"
            >
              {demoMeta.bannerAction}
            </Link>
          </div>
        );
      })()}

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
          <div
            onClick={() => setActiveTab('billing')}
            className="backdrop-blur-xl bg-white/75 dark:bg-slate-900/75 border border-white/60 dark:border-slate-800/80 rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-between transition-all hover:shadow-md cursor-pointer hover:border-indigo-400/80 group"
          >
            <div className="space-y-1">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Plan & Subscription</span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold group-hover:underline">
                  (Click to Manage →)
                </span>
              </div>
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
                  : 'Tap here to view plans & billing details'}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-300/40 dark:border-indigo-500/30 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
              <CreditCard className="w-5 h-5" />
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

        {/* Native Mobile & Desktop Horizontal Scrollable Tab Bar */}
        <div className="flex bg-slate-200/70 dark:bg-slate-800/80 p-1.5 rounded-2xl items-center space-x-1.5 overflow-x-auto no-scrollbar shadow-inner backdrop-blur-md">
          {isHospital ? (
            <>
              <button
                onClick={() => setActiveTab('hospital_dashboard')}
                className={`shrink-0 py-2 px-3.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                  activeTab === 'hospital_dashboard'
                    ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm font-bold scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-teal-500" />
                <span>Overview</span>
              </button>

              <button
                onClick={() => setActiveTab('hospital_appointments')}
                className={`shrink-0 py-2 px-3.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                  activeTab === 'hospital_appointments'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Calendar className="w-4 h-4 text-indigo-500" />
                <span>Appointments</span>
              </button>

              <button
                onClick={() => setActiveTab('hospital_patients')}
                className={`shrink-0 py-2 px-3.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                  activeTab === 'hospital_patients'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm font-bold scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Users className="w-4 h-4 text-blue-500" />
                <span>Patients</span>
              </button>

              <button
                onClick={() => setActiveTab('hospital_reports')}
                className={`shrink-0 py-2 px-3.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                  activeTab === 'hospital_reports'
                    ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm font-bold scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <FileText className="w-4 h-4 text-teal-500" />
                <span>Reports & Labs</span>
              </button>

              <button
                onClick={() => setActiveTab('hospital_voice')}
                className={`shrink-0 py-2 px-3.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                  activeTab === 'hospital_voice'
                    ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm font-bold scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Phone className="w-4 h-4 text-rose-500" />
                <span>Voice Calls</span>
              </button>

              <button
                onClick={() => setActiveTab('hospital_feedback')}
                className={`shrink-0 py-2 px-3.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                  activeTab === 'hospital_feedback'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm font-bold scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Feedback</span>
              </button>

              <button
                onClick={() => setActiveTab('hospital_agent')}
                className={`shrink-0 py-2 px-3.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                  activeTab === 'hospital_agent'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm font-bold scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Bot className="w-4 h-4 text-purple-500" />
                <span>AI Agent Desk</span>
              </button>

              <button
                onClick={() => setActiveTab('hospital_automation')}
                className={`shrink-0 py-2 px-3.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                  activeTab === 'hospital_automation'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm font-bold scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Zap className="w-4 h-4 text-emerald-500" />
                <span>Cron Engines</span>
              </button>

              <button
                onClick={() => setActiveTab('conversations')}
                className={`shrink-0 py-2 px-3.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                  activeTab === 'conversations'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chats</span>
              </button>

              <button
                onClick={() => setActiveTab('billing')}
                className={`shrink-0 py-2 px-3.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                  activeTab === 'billing'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Billing</span>
              </button>
            </>
          ) : effectiveCategory === 'ca_firm' ? (
            <>
              <button
                onClick={() => setActiveTab('ca_dashboard')}
                className={`shrink-0 py-2 px-3.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                  activeTab === 'ca_dashboard'
                    ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm font-bold scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-teal-500" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => setActiveTab('ca_compliance')}
                className={`shrink-0 py-2 px-3.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                  activeTab === 'ca_compliance'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Calendar className="w-4 h-4 text-indigo-500" />
                <span>Compliance</span>
              </button>

              <button
                onClick={() => setActiveTab('ca_documents')}
                className={`shrink-0 py-2 px-3.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                  activeTab === 'ca_documents'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm font-bold scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <FileText className="w-4 h-4 text-blue-500" />
                <span>Doc Hub</span>
              </button>

              <button
                onClick={() => setActiveTab('ca_leads')}
                className={`shrink-0 py-2 px-3.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                  activeTab === 'ca_leads'
                    ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm font-bold scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Users className="w-4 h-4 text-rose-500" />
                <span>Leads CRM</span>
              </button>

              <button
                onClick={() => setActiveTab('ca_invoices')}
                className={`shrink-0 py-2 px-3.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                  activeTab === 'ca_invoices'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm font-bold scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Receipt className="w-4 h-4 text-amber-500" />
                <span>Invoices & Fees</span>
              </button>

              <button
                onClick={() => setActiveTab('ca_agent')}
                className={`shrink-0 py-2 px-3.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                  activeTab === 'ca_agent'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm font-bold scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Bot className="w-4 h-4 text-purple-500" />
                <span>AI Agent Desk</span>
              </button>

              <button
                onClick={() => setActiveTab('ca_automation')}
                className={`shrink-0 py-2 px-3.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                  activeTab === 'ca_automation'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm font-bold scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Zap className="w-4 h-4 text-emerald-500" />
                <span>Cron Engines</span>
              </button>

              <button
                onClick={() => setActiveTab('conversations')}
                className={`shrink-0 py-2 px-3.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                  activeTab === 'conversations'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chats</span>
              </button>

              <button
                onClick={() => setActiveTab('billing')}
                className={`shrink-0 py-2 px-3.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                  activeTab === 'billing'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <CreditCard className="w-4 h-4" />
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

          {activeTab === 'ca_dashboard' && (
            <CADashboardOverviewTab
              businessId={business?.id}
              businessName={business?.name}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenNewClientModal={() => setIsNewClientModalOpen(true)}
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

          {activeTab === 'ca_invoices' && (
            <CAInvoicesTab
              businessId={business?.id}
              businessName={business?.name}
            />
          )}

          {activeTab === 'ca_agent' && (
            <CAAIAgentTab
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

          {/* Hospital & Clinic Suite Tabs */}
          {activeTab === 'hospital_dashboard' && (
            <HospitalDashboardOverviewTab
              businessId={business?.id}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenNewAppointment={() => setIsNewHospitalApptModalOpen(true)}
            />
          )}

          {activeTab === 'hospital_appointments' && (
            <HospitalAppointmentsTab
              businessId={business?.id}
              onOpenNewAppointment={() => setIsNewHospitalApptModalOpen(true)}
            />
          )}

          {activeTab === 'hospital_patients' && (
            <HospitalPatientsTab
              businessId={business?.id}
              onOpenNewPatient={() => setIsNewHospitalPatientModalOpen(true)}
            />
          )}

          {activeTab === 'hospital_reports' && (
            <HospitalReportsTab
              businessId={business?.id}
              onOpenUploadReport={() => setIsUploadHospitalReportModalOpen(true)}
            />
          )}

          {activeTab === 'hospital_voice' && (
            <HospitalVoiceCallsTab
              businessId={business?.id}
            />
          )}

          {activeTab === 'hospital_feedback' && (
            <HospitalFeedbackTab
              businessId={business?.id}
            />
          )}

          {activeTab === 'hospital_agent' && (
            <HospitalAIAgentTab
              businessId={business?.id}
              businessName={business?.name}
            />
          )}

          {activeTab === 'hospital_automation' && (
            <HospitalAutomationTab
              businessId={business?.id}
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

        {/* New Client Modal for CA Firm */}
        <CANewClientModal
          isOpen={isNewClientModalOpen}
          onClose={() => setIsNewClientModalOpen(false)}
          onClientAdded={() => {
            setIsNewClientModalOpen(false);
            loadDashboardData();
          }}
          businessId={business?.id}
          businessName={business?.name}
        />

        {/* Hospital & Clinic Suite Modals */}
        <HospitalNewAppointmentModal
          isOpen={isNewHospitalApptModalOpen}
          onClose={() => setIsNewHospitalApptModalOpen(false)}
          onSuccess={() => {
            setIsNewHospitalApptModalOpen(false);
            loadDashboardData();
          }}
          businessId={business?.id}
        />

        <HospitalNewPatientModal
          isOpen={isNewHospitalPatientModalOpen}
          onClose={() => setIsNewHospitalPatientModalOpen(false)}
          onSuccess={() => {
            setIsNewHospitalPatientModalOpen(false);
            loadDashboardData();
          }}
          businessId={business?.id}
        />

        <HospitalUploadReportModal
          isOpen={isUploadHospitalReportModalOpen}
          onClose={() => setIsUploadHospitalReportModalOpen(false)}
          onSuccess={() => {
            setIsUploadHospitalReportModalOpen(false);
            loadDashboardData();
          }}
          businessId={business?.id}
        />
      </main>

      {/* Mobile Native App Bottom Navigation Dock */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-2xl bg-white/95 dark:bg-slate-900/95 border-t border-slate-200/80 dark:border-slate-800/80 shadow-[0_-8px_30px_rgba(0,0,0,0.1)] px-3 py-1.5 flex items-center justify-between pb-safe transition-colors duration-200">
        {isHospital ? (
          <>
            <button
              onClick={() => setActiveTab('hospital_dashboard')}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                activeTab === 'hospital_dashboard'
                  ? 'text-teal-600 dark:text-teal-400 font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight font-medium">Home</span>
            </button>

            <button
              onClick={() => setActiveTab('hospital_appointments')}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                activeTab === 'hospital_appointments'
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Calendar className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight font-medium">Appts</span>
            </button>

            {/* Floating Center Action Button: + Book OPD */}
            <button
              onClick={() => setIsNewHospitalApptModalOpen(true)}
              className="flex flex-col items-center justify-center -mt-5"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-teal-600 via-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-teal-500/30 border-2 border-white dark:border-slate-900 active:scale-95 transition-transform">
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </div>
              <span className="text-[9px] tracking-tight font-bold text-teal-600 dark:text-teal-400 mt-0.5">+ Book</span>
            </button>

            <button
              onClick={() => setActiveTab('conversations')}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                activeTab === 'conversations'
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight font-medium">Chats</span>
            </button>

            {/* All Tabs / Menu Drawer Trigger */}
            <button
              onClick={() => setIsMobileAllTabsOpen(true)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                isMobileAllTabsOpen
                  ? 'text-teal-600 dark:text-teal-400 font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-5 h-5 mb-0.5 text-indigo-500" />
              <span className="text-[10px] tracking-tight font-bold text-slate-800 dark:text-slate-200">All Tabs</span>
            </button>
          </>
        ) : effectiveCategory === 'ca_firm' ? (
          <>
            <button
              onClick={() => setActiveTab('ca_dashboard')}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                activeTab === 'ca_dashboard'
                  ? 'text-teal-600 dark:text-teal-400 font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight font-medium">Home</span>
            </button>

            <button
              onClick={() => setActiveTab('ca_documents')}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                activeTab === 'ca_documents'
                  ? 'text-blue-600 dark:text-blue-400 font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight font-medium">Docs</span>
            </button>

            {/* Floating Center Action Button: + Onboard Client */}
            <button
              onClick={() => setIsNewClientModalOpen(true)}
              className="flex flex-col items-center justify-center -mt-5"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 via-teal-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-teal-500/30 border-2 border-white dark:border-slate-900 active:scale-95 transition-transform">
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </div>
              <span className="text-[9px] tracking-tight font-bold text-teal-600 dark:text-teal-400 mt-0.5">+ Client</span>
            </button>

            <button
              onClick={() => setActiveTab('conversations')}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                activeTab === 'conversations'
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight font-medium">Chats</span>
            </button>

            {/* All Tabs / Menu Drawer Trigger */}
            <button
              onClick={() => setIsMobileAllTabsOpen(true)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                isMobileAllTabsOpen
                  ? 'text-teal-600 dark:text-teal-400 font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-5 h-5 mb-0.5 text-indigo-500" />
              <span className="text-[10px] tracking-tight font-bold text-slate-800 dark:text-slate-200">All Tabs</span>
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

      {/* Mobile All Modules Bottom Sheet Launcher */}
      {isMobileAllTabsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm sm:hidden flex flex-col justify-end animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setIsMobileAllTabsOpen(false)}
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-t-3xl p-5 border-t border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <LayoutGrid className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isHospital ? 'All Hospital Modules' : 'All Practice Modules'}
                </h3>
              </div>
              <button
                onClick={() => setIsMobileAllTabsOpen(false)}
                className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isHospital ? (
              <div className="grid grid-cols-2 gap-3 text-left">
                <button
                  onClick={() => {
                    setActiveTab('hospital_dashboard');
                    setIsMobileAllTabsOpen(false);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    activeTab === 'hospital_dashboard'
                      ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500/60 text-teal-900 dark:text-teal-300 font-bold shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="p-2 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-xl w-fit mb-2">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Overview</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Hospital stats & alerts</div>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('hospital_appointments');
                    setIsMobileAllTabsOpen(false);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    activeTab === 'hospital_appointments'
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500/60 text-indigo-900 dark:text-indigo-300 font-bold shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl w-fit mb-2">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Appointments</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">OPD & Tokens</div>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('hospital_patients');
                    setIsMobileAllTabsOpen(false);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    activeTab === 'hospital_patients'
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500/60 text-blue-900 dark:text-blue-300 font-bold shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl w-fit mb-2">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Patients</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Health directory</div>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('hospital_reports');
                    setIsMobileAllTabsOpen(false);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    activeTab === 'hospital_reports'
                      ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500/60 text-teal-900 dark:text-teal-300 font-bold shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="p-2 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-xl w-fit mb-2">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Reports & Labs</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Diagnostic results</div>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('hospital_voice');
                    setIsMobileAllTabsOpen(false);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    activeTab === 'hospital_voice'
                      ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500/60 text-rose-900 dark:text-rose-300 font-bold shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="p-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl w-fit mb-2">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Voice Calls</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">AI Follow-up calls</div>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('hospital_feedback');
                    setIsMobileAllTabsOpen(false);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    activeTab === 'hospital_feedback'
                      ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500/60 text-amber-900 dark:text-amber-300 font-bold shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl w-fit mb-2">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Feedback</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Ratings & Google reviews</div>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('hospital_agent');
                    setIsMobileAllTabsOpen(false);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    activeTab === 'hospital_agent'
                      ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-500/60 text-purple-900 dark:text-purple-300 font-bold shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl w-fit mb-2">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">AI Agent Desk</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Medical AI simulator</div>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('hospital_automation');
                    setIsMobileAllTabsOpen(false);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    activeTab === 'hospital_automation'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500/60 text-emerald-900 dark:text-emerald-300 font-bold shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl w-fit mb-2">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Cron Engines</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Background triggers</div>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('conversations');
                    setIsMobileAllTabsOpen(false);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    activeTab === 'conversations'
                      ? 'bg-slate-100 dark:bg-slate-800 border-slate-400 font-bold text-slate-900 dark:text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="p-2 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl w-fit mb-2">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Live Chats</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">2-Way WhatsApp inbox</div>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('billing');
                    setIsMobileAllTabsOpen(false);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    activeTab === 'billing'
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500/60 text-indigo-900 dark:text-indigo-300 font-bold shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl w-fit mb-2">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Plan & Billing</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Pro subscriptions</div>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-left">
                <button
                  onClick={() => {
                    setActiveTab('ca_dashboard');
                    setIsMobileAllTabsOpen(false);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    activeTab === 'ca_dashboard'
                      ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500/60 text-teal-900 dark:text-teal-300 font-bold shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="p-2 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-xl w-fit mb-2">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Dashboard</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Practice overview & stats</div>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('ca_compliance');
                    setIsMobileAllTabsOpen(false);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    activeTab === 'ca_compliance'
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500/60 text-indigo-900 dark:text-indigo-300 font-bold shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl w-fit mb-2">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Compliance</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Statutory tax deadlines</div>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('ca_documents');
                    setIsMobileAllTabsOpen(false);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    activeTab === 'ca_documents'
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500/60 text-blue-900 dark:text-blue-300 font-bold shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl w-fit mb-2">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Doc Hub</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Document collection & OCR</div>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('ca_leads');
                    setIsMobileAllTabsOpen(false);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    activeTab === 'ca_leads'
                      ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500/60 text-rose-900 dark:text-rose-300 font-bold shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="p-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl w-fit mb-2">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Leads CRM</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">4-Stage Kanban pipeline</div>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('ca_invoices');
                    setIsMobileAllTabsOpen(false);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    activeTab === 'ca_invoices'
                      ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500/60 text-amber-900 dark:text-amber-300 font-bold shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl w-fit mb-2">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Invoices & Fees</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Fee ledger & UPI links</div>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('ca_agent');
                    setIsMobileAllTabsOpen(false);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    activeTab === 'ca_agent'
                      ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-500/60 text-purple-900 dark:text-purple-300 font-bold shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl w-fit mb-2">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">AI Agent Desk</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Live WhatsApp test bot</div>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('ca_automation');
                    setIsMobileAllTabsOpen(false);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    activeTab === 'ca_automation'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500/60 text-emerald-900 dark:text-emerald-300 font-bold shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl w-fit mb-2">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Cron Engines</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Background automations</div>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('conversations');
                    setIsMobileAllTabsOpen(false);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    activeTab === 'conversations'
                      ? 'bg-slate-100 dark:bg-slate-800 border-slate-400 font-bold text-slate-900 dark:text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="p-2 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl w-fit mb-2">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Live Chats</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">2-Way WhatsApp inbox</div>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('billing');
                    setIsMobileAllTabsOpen(false);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all col-span-2 ${
                    activeTab === 'billing'
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500/60 text-indigo-900 dark:text-indigo-300 font-bold shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Plan & Subscription (Billing)</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Upgrade to Pro, invoices & danger zone</div>
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
