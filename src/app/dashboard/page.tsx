"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseClient } from "../../lib/supabase/client";
import { Business, DashboardTab } from "../../types";
import { OrdersLedgerTab } from "../../components/dashboard/OrdersLedgerTab";
import { ConversationsTab } from "../../components/dashboard/ConversationsTab";
import { EditBusinessInfoTab } from "../../components/dashboard/EditBusinessInfoTab";
import { BillingTab } from "../../components/dashboard/BillingTab";
import CAComplianceTab from "../../components/dashboard/ca/CAComplianceTab";
import CADocumentsTab from "../../components/dashboard/ca/CADocumentsTab";
import CALeadsTab from "../../components/dashboard/ca/CALeadsTab";
import CAAutomationControlTab from "../../components/dashboard/ca/CAAutomationControlTab";
import CADashboardOverviewTab from "../../components/dashboard/ca/CADashboardOverviewTab";
import CAInvoicesTab from "../../components/dashboard/ca/CAInvoicesTab";
import CAAIAgentTab from "../../components/dashboard/ca/CAAIAgentTab";
import CANewClientModal from "../../components/dashboard/ca/CANewClientModal";
import HospitalDashboardOverviewTab from "../../components/dashboard/hospital/HospitalDashboardOverviewTab";
import HospitalAppointmentsTab from "../../components/dashboard/hospital/HospitalAppointmentsTab";
import HospitalPatientsTab from "../../components/dashboard/hospital/HospitalPatientsTab";
import HospitalReportsTab from "../../components/dashboard/hospital/HospitalReportsTab";
import HospitalVoiceCallsTab from "../../components/dashboard/hospital/HospitalVoiceCallsTab";
import HospitalFeedbackTab from "../../components/dashboard/hospital/HospitalFeedbackTab";
import HospitalAIAgentTab from "../../components/dashboard/hospital/HospitalAIAgentTab";
import HospitalAutomationTab from "../../components/dashboard/hospital/HospitalAutomationTab";
import HospitalNewAppointmentModal from "../../components/dashboard/hospital/HospitalNewAppointmentModal";
import HospitalNewPatientModal from "../../components/dashboard/hospital/HospitalNewPatientModal";
import HospitalUploadReportModal from "../../components/dashboard/hospital/HospitalUploadReportModal";
import {
  resolveCategoryFromNameOrType,
  getCategoryDisplayMetadata,
} from "../../lib/constants/categoryPresets";
import { PLANS, TRIAL_DAYS, formatRupees } from "../../config/plans";
import { useToast } from "../../components/ui/ToastContext";
import { ThemeToggle } from "../../components/ui/ThemeContext";
import {
  Button,
  ButtonLink,
  Card,
  StatCard,
  Tabs,
  Modal,
  type TabItem,
} from "../../components/ui";
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
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DashboardTab>("orders");
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isMobileAllTabsOpen, setIsMobileAllTabsOpen] = useState(false);
  const [isNewHospitalApptModalOpen, setIsNewHospitalApptModalOpen] =
    useState(false);
  const [isNewHospitalPatientModalOpen, setIsNewHospitalPatientModalOpen] =
    useState(false);
  const [isUploadHospitalReportModalOpen, setIsUploadHospitalReportModalOpen] =
    useState(false);

  const [isBotPaused, setIsBotPaused] = useState(false);
  const [pauseLoading, setPauseLoading] = useState(false);

  const { showToast } = useToast();

  const toggleBotPause = async () => {
    try {
      setPauseLoading(true);
      const nextPausedState = !isBotPaused;
      setIsBotPaused(nextPausedState);

      const bizId =
        business?.id ||
        (typeof window !== "undefined" ? localStorage.getItem("biz_id") : null);
      const bizEmail =
        business?.owner_email ||
        (typeof window !== "undefined"
          ? localStorage.getItem("biz_email")
          : null);

      showToast({
        title: nextPausedState ? "AI Agent Paused" : "AI Agent Active",
        message: nextPausedState
          ? "Automated WhatsApp replies are paused. You can reply manually in Live Chats."
          : "Automated 24/7 AI staff is active and replying to incoming customer messages.",
        type: nextPausedState ? "info" : "whatsapp",
      });

      if (bizId) {
        await supabaseClient
          .from("businesses")
          .update({ is_bot_paused: nextPausedState })
          .eq("id", bizId);
      }
    } catch (err) {
      console.error("Failed to toggle AI pause state:", err);
    } finally {
      setPauseLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      let bizId: string | null = null;
      let bizEmail: string | null = null;

      if (typeof window !== "undefined") {
        bizId = localStorage.getItem("biz_id");
        bizEmail = localStorage.getItem("biz_email");
      }

      // Always check auth state to get reliable email
      const { data: authData } = await supabaseClient.auth.getUser();
      const authEmail = authData?.user?.email ?? null;

      if (!bizEmail && authEmail) {
        bizEmail = authEmail;
        if (typeof window !== "undefined") {
          localStorage.setItem("biz_email", authEmail);
        }
      }

      if (!bizId && !bizEmail) {
        router.push("/login");
        return;
      }

      // Try fetching by ID first, then by email
      let data: any = null;
      if (bizId) {
        const res = await fetch(`/api/business?id=${encodeURIComponent(bizId)}`);
        data = await res.json();
      }

      // If ID lookup returned no business, also try email
      if (!data?.business && bizEmail) {
        const res = await fetch(`/api/business?email=${encodeURIComponent(bizEmail)}`);
        data = await res.json();
      }

      // Also try with auth email if different from stored email
      if (!data?.business && authEmail && authEmail !== bizEmail) {
        const res = await fetch(`/api/business?email=${encodeURIComponent(authEmail)}`);
        data = await res.json();
      }

      if (data?.business) {
        const bizRecord = data.business;
        if (typeof window !== "undefined") {
          localStorage.setItem("biz_id", bizRecord.id);
          localStorage.setItem("biz_name", bizRecord.name);
          localStorage.setItem("biz_email", bizRecord.owner_email || bizEmail || "");
        }
        const resolvedCategory = resolveCategoryFromNameOrType(
          bizRecord.category,
          bizRecord.name,
        );
        setBusiness({
          ...bizRecord,
          category: resolvedCategory,
        });
        setIsBotPaused(bizRecord.is_bot_paused ?? false);

        if (resolvedCategory === "hospital" || resolvedCategory === "clinic") {
          setActiveTab((prev) =>
            prev === "orders" ? "hospital_dashboard" : prev,
          );
        } else if (resolvedCategory === "ca_firm") {
          setActiveTab((prev) => (prev === "orders" ? "ca_dashboard" : prev));
        }
      } else {
        // No business found for this user — send to onboarding to create one
        if (typeof window !== "undefined") {
          // Clear stale localStorage so onboarding starts fresh
          localStorage.removeItem("biz_id");
          localStorage.removeItem("biz_name");
        }
        router.push("/onboarding");
        return;
      }
    } catch (err) {
      console.error("Error fetching dashboard business:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadDashboardData();
  }, []);

  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
    if (typeof window !== "undefined") {
      localStorage.removeItem("biz_id");
      localStorage.removeItem("biz_email");
    }
    router.push("/login");
  };

  const isTrialEnded = useMemo(() => {
    if (!business?.trial_end_date) return false;
    return new Date(business.trial_end_date).getTime() < Date.now();
  }, [business?.trial_end_date]);

  const countdownStr = useMemo(() => {
    if (!business?.trial_end_date) return null;
    const diffMs = new Date(business.trial_end_date).getTime() - Date.now();
    if (diffMs <= 0) return "Expired";
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return `${days}d left`;
  }, [business?.trial_end_date]);

  const effectiveCategory = useMemo(() => {
    return resolveCategoryFromNameOrType(business?.category, business?.name);
  }, [business?.category, business?.name]);

  const isHospital =
    effectiveCategory === "hospital" || effectiveCategory === "clinic";
  const isCA = effectiveCategory === "ca_firm";

  const captureTypeLabel =
    effectiveCategory === "clinic" || effectiveCategory === "hospital"
      ? "Consultations"
      : effectiveCategory === "real_estate"
        ? "Site Visits"
        : effectiveCategory === "salon"
          ? "Appointments"
          : effectiveCategory === "gym"
            ? "Memberships"
            : effectiveCategory === "tuition"
              ? "Enrollments"
              : effectiveCategory === "cafe"
                ? "Table Bookings"
                : effectiveCategory === "ca_firm"
                  ? "Tax Filings"
                  : "Orders";

  const renderCategoryIcon = (cls: string) => {
    switch (effectiveCategory) {
      case "clinic":
      case "hospital":
        return <Stethoscope className={cls} />;
      case "real_estate":
        return <Building2 className={cls} />;
      case "salon":
        return <Scissors className={cls} />;
      case "gym":
        return <Dumbbell className={cls} />;
      case "tuition":
        return <GraduationCap className={cls} />;
      case "cafe":
        return <Coffee className={cls} />;
      case "ca_firm":
        return <Briefcase className={cls} />;
      default:
        return <ShoppingBag className={cls} />;
    }
  };

  // Tab definitions
  const tabItems: TabItem[] = useMemo(() => {
    if (isHospital) {
      return [
        { key: "hospital_dashboard", label: "Overview", icon: <BarChart3 /> },
        {
          key: "hospital_appointments",
          label: "Appointments",
          icon: <Calendar />,
        },
        { key: "hospital_patients", label: "Patients", icon: <Users /> },
        {
          key: "hospital_reports",
          label: "Reports & Labs",
          icon: <FileText />,
        },
        { key: "hospital_voice", label: "Voice Calls", icon: <Phone /> },
        { key: "hospital_feedback", label: "Feedback", icon: <Sparkles /> },
        { key: "hospital_agent", label: "AI Agent Desk", icon: <Bot /> },
        { key: "hospital_automation", label: "Cron Engines", icon: <Zap /> },
        { key: "conversations", label: "Chats", icon: <MessageSquare /> },
        { key: "billing", label: "Billing", icon: <CreditCard /> },
      ];
    }
    if (isCA) {
      return [
        { key: "ca_dashboard", label: "Dashboard", icon: <BarChart3 /> },
        { key: "ca_compliance", label: "Compliance", icon: <Calendar /> },
        { key: "ca_documents", label: "Doc Hub", icon: <FileText /> },
        { key: "ca_leads", label: "Leads CRM", icon: <Users /> },
        { key: "ca_invoices", label: "Invoices & Fees", icon: <Receipt /> },
        { key: "ca_agent", label: "AI Agent Desk", icon: <Bot /> },
        { key: "ca_automation", label: "Cron Engines", icon: <Zap /> },
        { key: "conversations", label: "Chats", icon: <MessageSquare /> },
        { key: "billing", label: "Billing", icon: <CreditCard /> },
      ];
    }
    return [
      {
        key: "orders",
        label: `${captureTypeLabel} & Ledger`,
        icon: renderCategoryIcon("h-3.5 w-3.5"),
      },
      {
        key: "conversations",
        label: "Live Conversations",
        icon: <MessageSquare />,
      },
      {
        key: "edit_info",
        label: "Store Settings & Catalog",
        icon: <Settings />,
      },
      { key: "billing", label: "Billing & Pro Plans", icon: <CreditCard /> },
    ];
  }, [isHospital, isCA, captureTypeLabel, effectiveCategory]);

  return (
    <div className="min-h-screen bg-base text-fg flex flex-col antialiased font-sans transition-colors duration-150">
      {/* Sleek Top Navigation Bar */}
      <header className="sticky top-0 z-30 shrink-0 border-b border-line bg-surface/85 backdrop-blur-xl pt-safe transition-colors duration-150">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0 pr-2">
            <img
              src="/logo.png"
              alt="Agento AI"
              className="w-10 h-10 rounded-lg object-contain bg-slate-900 border border-white/20 shadow-xs p-1 flex-shrink-0"
            />
            <div className="min-w-0">
              <h1
                suppressHydrationWarning
                className="text-sm font-bold text-fg leading-tight truncate max-w-[130px] xs:max-w-[180px] sm:max-w-[280px]"
              >
                {business?.name || (mounted && typeof window !== 'undefined' ? localStorage.getItem('biz_name') : '') || "Business"}
              </h1>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 bg-surface-subtle border border-line text-fg-muted rounded font-bold tracking-wider">
                  {effectiveCategory === "ca_firm"
                    ? "Chartered Accountant"
                    : isHospital
                      ? "Hospital & Clinic CRM"
                      : effectiveCategory}
                </span>
                <span className="text-[11px] text-fg-muted font-medium whitespace-nowrap">
                  24/7 AI Practice
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {/* Dark / Light Mode Switch */}
            <ThemeToggle />

            {/* Quick + New Client button for CA Firm */}
            {effectiveCategory === "ca_firm" && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsNewClientModalOpen(true)}
                leftIcon={<UserPlus className="w-3.5 h-3.5" />}
              >
                <span className="hidden xs:inline">+ New Client</span>
              </Button>
            )}

            {/* Quick + Book OPD button for Hospital */}
            {isHospital && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsNewHospitalApptModalOpen(true)}
                leftIcon={<Calendar className="w-3.5 h-3.5" />}
              >
                <span className="hidden xs:inline">+ Book OPD</span>
              </Button>
            )}

            {/* Quick Bot Toggle */}
            <Button
              variant="secondary"
              size="sm"
              onClick={toggleBotPause}
              disabled={pauseLoading}
              title="Click to pause or activate 24/7 AI agent replies"
              leftIcon={
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    isBotPaused
                      ? "bg-amber-500"
                      : "bg-emerald-500 animate-pulse"
                  }`}
                />
              }
            >
              <span className="whitespace-nowrap">
                {pauseLoading
                  ? "Updating..."
                  : isBotPaused
                    ? "AI Paused"
                    : "AI Active"}
              </span>
            </Button>

            {/* WhatsApp Web Link */}
            <ButtonLink
              variant="ghost"
              size="sm"
              href="https://web.whatsapp.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex"
              leftIcon={<Phone className="w-3.5 h-3.5 text-accent" />}
              rightIcon={<ExternalLink className="w-3 h-3 opacity-60" />}
            >
              WhatsApp Web
            </ButtonLink>

            {/* Logout Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              leftIcon={<LogOut className="w-3.5 h-3.5" />}
            >
              <span className="hidden sm:inline">Log out</span>
            </Button>
          </div>
        </div>
      </header>



      {/* Trial Expired Alert Banner */}
      {isTrialEnded && business?.subscription_status !== "active" && (
        <div className="bg-warning text-warning-fg py-2 px-4 text-center text-xs font-semibold flex items-center justify-center space-x-2 border-b border-warning-border">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>
            Your {TRIAL_DAYS}-day free trial has expired. WhatsApp replies are
            currently paused.
          </span>
          <button
            onClick={() => setActiveTab("billing")}
            className="font-bold underline ml-1 hover:opacity-80"
          >
            Upgrade for {formatRupees(PLANS.monthly_999.amountPaise)}/month
          </button>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 sm:space-y-6 pb-safe-gutter">
        {/* Top 3 Quick Stats Widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Live Plan / Trial Countdown */}
          <div
            onClick={() => setActiveTab("billing")}
            className="cursor-pointer"
          >
            <StatCard
              label="Plan & Subscription"
              value={
                business?.subscription_status === "active"
                  ? "Pro Active"
                  : isTrialEnded
                    ? "Expired"
                    : "Free Trial"
              }
              delta={countdownStr || undefined}
              deltaTone={isTrialEnded ? "negative" : "positive"}
              icon={<CreditCard />}
              hint="Click to manage subscription & limits"
            />
          </div>

          {/* Card 2: 24/7 WhatsApp AI Bot Active Status */}
          <StatCard
            label="WhatsApp Automation"
            value={
              isBotPaused ? "AI Paused" : isTrialEnded ? "Paused" : "Active"
            }
            deltaTone={isBotPaused || isTrialEnded ? "negative" : "positive"}
            icon={renderCategoryIcon("w-4 h-4")}
            hint={
              isBotPaused
                ? "Replies stopped"
                : "Auto taking orders & inquiries 24/7"
            }
          />

          {/* Card 3: Business Vertical Category */}
          <div className="sm:col-span-2 lg:col-span-1">
            <StatCard
              label="Operating Category"
              value={effectiveCategory.replace("_", " ").toUpperCase()}
              icon={<Sparkles />}
              hint={`AI customized for ${effectiveCategory.replace("_", " ")} workflow`}
            />
          </div>
        </div>

        {/* Unified Accessible Tabs Strip */}
        <Tabs
          items={tabItems}
          value={activeTab}
          onChange={(key) => setActiveTab(key as DashboardTab)}
        />

        {/* Tab Content Body */}
        <div className="transition-all duration-150">
          {activeTab === "orders" && (
            <OrdersLedgerTab
              businessId={business?.id || ""}
              category={business?.category || "bakery"}
              businessName={business?.name || "Agento AI Store"}
            />
          )}

          {activeTab === "hospital_dashboard" && (
            <HospitalDashboardOverviewTab
              businessId={business?.id}
              onNavigateTab={(tab) => setActiveTab(tab as DashboardTab)}
              onOpenNewAppointment={() => setIsNewHospitalApptModalOpen(true)}
            />
          )}

          {activeTab === "hospital_appointments" && (
            <HospitalAppointmentsTab
              businessId={business?.id}
              onOpenNewAppointment={() => setIsNewHospitalApptModalOpen(true)}
            />
          )}

          {activeTab === "hospital_patients" && (
            <HospitalPatientsTab
              businessId={business?.id}
              onOpenNewPatient={() => setIsNewHospitalPatientModalOpen(true)}
            />
          )}

          {activeTab === "hospital_reports" && (
            <HospitalReportsTab
              businessId={business?.id}
              onOpenUploadReport={() =>
                setIsUploadHospitalReportModalOpen(true)
              }
            />
          )}

          {activeTab === "hospital_voice" && (
            <HospitalVoiceCallsTab businessId={business?.id} />
          )}

          {activeTab === "hospital_feedback" && (
            <HospitalFeedbackTab businessId={business?.id} />
          )}

          {activeTab === "hospital_agent" && (
            <HospitalAIAgentTab businessId={business?.id} />
          )}

          {activeTab === "ca_dashboard" && (
            <CADashboardOverviewTab
              businessId={business?.id}
              businessName={business?.name}
              onNavigateTab={(tab) => setActiveTab(tab as DashboardTab)}
              onOpenNewClientModal={() => setIsNewClientModalOpen(true)}
            />
          )}

          {activeTab === "ca_compliance" && (
            <CAComplianceTab businessId={business?.id} />
          )}

          {activeTab === "ca_documents" && (
            <CADocumentsTab businessId={business?.id} />
          )}

          {activeTab === "ca_leads" && <CALeadsTab businessId={business?.id} />}

          {activeTab === "ca_invoices" && (
            <CAInvoicesTab businessId={business?.id} />
          )}

          {activeTab === "ca_agent" && (
            <CAAIAgentTab businessId={business?.id} />
          )}

          {activeTab === "ca_automation" && (
            <CAAutomationControlTab businessId={business?.id} />
          )}

          {activeTab === "hospital_automation" && (
            <HospitalAutomationTab businessId={business?.id} />
          )}

          {activeTab === "conversations" && (
            <ConversationsTab businessId={business?.id || ""} />
          )}

          {activeTab === "edit_info" && (
            <EditBusinessInfoTab
              businessId={business?.id || ""}
              category={business?.category || "bakery"}
              onUpdated={loadDashboardData}
            />
          )}

          {activeTab === "billing" && (
            <BillingTab
              businessId={business?.id || ""}
              category={business?.category || "bakery"}
              trialEndDateStr={business?.trial_end_date}
              subscriptionStatus={business?.subscription_status || "trial"}
              plan={business?.plan || "trial"}
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
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl bg-surface/90 border-t border-line px-3 py-1.5 flex items-center justify-between pb-safe transition-colors duration-150 shadow-md">
        {isHospital ? (
          <>
            <button
              onClick={() => setActiveTab("hospital_dashboard")}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-md transition-colors min-h-[44px] ${
                activeTab === "hospital_dashboard"
                  ? "text-accent font-bold"
                  : "text-fg-muted hover:text-fg"
              }`}
            >
              <BarChart3 className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">Home</span>
            </button>

            <button
              onClick={() => setActiveTab("hospital_appointments")}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-md transition-colors min-h-[44px] ${
                activeTab === "hospital_appointments"
                  ? "text-accent font-bold"
                  : "text-fg-muted hover:text-fg"
              }`}
            >
              <Calendar className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">Appts</span>
            </button>

            {/* Floating Center Action Button: + Book OPD */}
            <button
              onClick={() => setIsNewHospitalApptModalOpen(true)}
              className="flex flex-col items-center justify-center -mt-5"
            >
              <div className="w-12 h-12 rounded-full bg-accent text-accent-fg flex items-center justify-center shadow-md border-2 border-surface active:scale-98 transition-transform">
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </div>
              <span className="text-[9px] font-bold text-accent mt-0.5">
                + Book
              </span>
            </button>

            <button
              onClick={() => setActiveTab("conversations")}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-md transition-colors min-h-[44px] ${
                activeTab === "conversations"
                  ? "text-accent font-bold"
                  : "text-fg-muted hover:text-fg"
              }`}
            >
              <MessageSquare className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">Chats</span>
            </button>

            {/* All Tabs / Menu Drawer Trigger */}
            <button
              onClick={() => setIsMobileAllTabsOpen(true)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-md transition-colors min-h-[44px] ${
                isMobileAllTabsOpen
                  ? "text-accent font-bold"
                  : "text-fg-muted hover:text-fg"
              }`}
            >
              <LayoutGrid className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight font-medium">
                All Modules
              </span>
            </button>
          </>
        ) : isCA ? (
          <>
            <button
              onClick={() => setActiveTab("ca_dashboard")}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-md transition-colors min-h-[44px] ${
                activeTab === "ca_dashboard"
                  ? "text-accent font-bold"
                  : "text-fg-muted hover:text-fg"
              }`}
            >
              <BarChart3 className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">Home</span>
            </button>

            <button
              onClick={() => setActiveTab("ca_documents")}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-md transition-colors min-h-[44px] ${
                activeTab === "ca_documents"
                  ? "text-accent font-bold"
                  : "text-fg-muted hover:text-fg"
              }`}
            >
              <FileText className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">Docs</span>
            </button>

            {/* Floating Center Action Button: + Onboard Client */}
            <button
              onClick={() => setIsNewClientModalOpen(true)}
              className="flex flex-col items-center justify-center -mt-5"
            >
              <div className="w-12 h-12 rounded-full bg-accent text-accent-fg flex items-center justify-center shadow-md border-2 border-surface active:scale-98 transition-transform">
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </div>
              <span className="text-[9px] font-bold text-accent mt-0.5">
                + Client
              </span>
            </button>

            <button
              onClick={() => setActiveTab("conversations")}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-md transition-colors min-h-[44px] ${
                activeTab === "conversations"
                  ? "text-accent font-bold"
                  : "text-fg-muted hover:text-fg"
              }`}
            >
              <MessageSquare className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">Chats</span>
            </button>

            {/* All Tabs / Menu Drawer Trigger */}
            <button
              onClick={() => setIsMobileAllTabsOpen(true)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-md transition-colors min-h-[44px] ${
                isMobileAllTabsOpen
                  ? "text-accent font-bold"
                  : "text-fg-muted hover:text-fg"
              }`}
            >
              <LayoutGrid className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight font-medium">
                All Modules
              </span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setActiveTab("orders")}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-md transition-colors min-h-[44px] ${
                activeTab === "orders"
                  ? "text-accent font-bold"
                  : "text-fg-muted hover:text-fg"
              }`}
            >
              {renderCategoryIcon(
                `w-5 h-5 mb-0.5 ${activeTab === "orders" ? "text-accent stroke-[2.5]" : "stroke-[1.8]"}`,
              )}
              <span className="text-[10px] tracking-tight">
                {captureTypeLabel}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("conversations")}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-md transition-colors min-h-[44px] ${
                activeTab === "conversations"
                  ? "text-accent font-bold"
                  : "text-fg-muted hover:text-fg"
              }`}
            >
              <MessageSquare
                className={`w-5 h-5 mb-0.5 ${activeTab === "conversations" ? "text-accent stroke-[2.5]" : "stroke-[1.8]"}`}
              />
              <span className="text-[10px] tracking-tight">Chats</span>
            </button>

            <button
              onClick={() => setActiveTab("edit_info")}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-md transition-colors min-h-[44px] ${
                activeTab === "edit_info"
                  ? "text-accent font-bold"
                  : "text-fg-muted hover:text-fg"
              }`}
            >
              <Settings
                className={`w-5 h-5 mb-0.5 ${activeTab === "edit_info" ? "text-accent stroke-[2.5]" : "stroke-[1.8]"}`}
              />
              <span className="text-[10px] tracking-tight">Settings</span>
            </button>

            <button
              onClick={() => setActiveTab("billing")}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-md transition-colors min-h-[44px] ${
                activeTab === "billing"
                  ? "text-accent font-bold"
                  : "text-fg-muted hover:text-fg"
              }`}
            >
              <CreditCard
                className={`w-5 h-5 mb-0.5 ${activeTab === "billing" ? "text-accent stroke-[2.5]" : "stroke-[1.8]"}`}
              />
              <span className="text-[10px] tracking-tight">Billing</span>
            </button>

            {/* All Tabs Drawer Trigger for retail too! */}
            <button
              onClick={() => setIsMobileAllTabsOpen(true)}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-md transition-colors min-h-[44px] ${
                isMobileAllTabsOpen
                  ? "text-accent font-bold"
                  : "text-fg-muted hover:text-fg"
              }`}
            >
              <LayoutGrid className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight font-medium">
                All
              </span>
            </button>
          </>
        )}
      </nav>

      {/* Mobile All Modules Modal (replaces custom overlay) */}
      <Modal
        open={isMobileAllTabsOpen}
        onClose={() => setIsMobileAllTabsOpen(false)}
        title={
          isHospital
            ? "All Hospital Modules"
            : isCA
              ? "All Practice Modules"
              : "All Store Modules"
        }
        description="Switch directly to any practice section"
        icon={<LayoutGrid className="text-accent" />}
        mobile="sheet"
        size="md"
      >
        <div className="grid grid-cols-2 gap-2.5 text-left py-1">
          {tabItems.map((tab) => {
            const isTabActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key as DashboardTab);
                  setIsMobileAllTabsOpen(false);
                }}
                className={`p-3 rounded-lg border text-left transition-colors flex flex-col gap-2 ${
                  isTabActive
                    ? "bg-accent-subtle border-accent-border text-accent font-bold shadow-xs"
                    : "bg-surface border-line text-fg hover:bg-surface-hover"
                }`}
              >
                <div className="p-2 bg-surface-subtle text-fg-muted rounded-md w-fit">
                  {tab.icon}
                </div>
                <div>
                  <div className="text-xs font-semibold text-fg">
                    {tab.label}
                  </div>
                  <div className="text-[10px] text-fg-muted mt-0.5 line-clamp-1">
                    Open {tab.label.toLowerCase()}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </Modal>

      {/* Clean Themed Modern Footer */}
      <footer className="hidden sm:block bg-surface border-t border-line mt-16 py-6 text-xs text-fg-muted transition-colors duration-150">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-fg">Agento AI</span>
            <span>•</span>
            <span>24/7 Autonomous WhatsApp AI Staff &amp; Business OS</span>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/privacy" className="hover:text-fg transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-fg transition-colors">
              Terms of Service
            </Link>
            <Link href="/refund" className="hover:text-fg transition-colors">
              Cancellation &amp; Refund Policy
            </Link>
            <Link href="/shipping" className="hover:text-fg transition-colors">
              Shipping &amp; Delivery
            </Link>
            <Link href="/contact" className="hover:text-fg transition-colors">
              Support &amp; Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
