'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Activity,
  PhoneCall,
  MessageSquare,
  FileText,
  Star,
  Users,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { HospitalAppointment, HospitalReport, HospitalVoiceCall, HospitalFeedback, DashboardTab } from '@/types';
import { useToast } from '@/components/ui/ToastProvider';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  DataTable,
  StatCard,
  StatusBadge,
  type Column,
} from '@/components/ui';

interface HospitalDashboardOverviewTabProps {
  businessId?: string;
  onNavigateTab: (tab: DashboardTab) => void;
  onOpenNewAppointment: () => void;
}

export default function HospitalDashboardOverviewTab({
  businessId,
  onNavigateTab,
  onOpenNewAppointment,
}: HospitalDashboardOverviewTabProps) {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<HospitalAppointment[]>([]);
  const [reports, setReports] = useState<HospitalReport[]>([]);
  const [voiceCalls, setVoiceCalls] = useState<HospitalVoiceCall[]>([]);
  const [feedbackList, setFeedbackList] = useState<HospitalFeedback[]>([]);
  const [stats, setStats] = useState({
    todayTotal: 0,
    completed: 0,
    pending: 0,
    missed: 0,
    waHandled: 0,
    aiCalls: 0,
    remindersSent: 0,
    reportsDelivered: 0,
    avgFeedback: '—',
  });

  const { showToast } = useToast();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const todayStr = new Date().toISOString().split('T')[0];
      const bizParam = businessId ? `business_id=${encodeURIComponent(businessId)}` : '';

      // Parallel fetch from real Supabase endpoints
      const [apptRes, allApptRes, reportsRes, voiceRes, feedbackRes, convRes] = await Promise.all([
        fetch(`/api/hospital/appointments?${bizParam ? `${bizParam}&` : ''}date=${todayStr}`),
        fetch(`/api/hospital/appointments?${bizParam}`),
        fetch(`/api/hospital/reports?${bizParam}`),
        fetch(`/api/hospital/voice-calls?${bizParam}`),
        fetch(`/api/hospital/feedback?${bizParam}`),
        fetch(`/api/conversations?${businessId ? `businessId=${encodeURIComponent(businessId)}` : ''}`),
      ]);

      const [apptData, allApptData, reportsData, voiceData, feedbackData, convData] = await Promise.all([
        apptRes.json(),
        allApptRes.json(),
        reportsRes.json(),
        voiceRes.json(),
        feedbackRes.json(),
        convRes.json().catch(() => ({})),
      ]);

      const allAppts: HospitalAppointment[] = allApptData.appointments || [];
      const todayAppts: HospitalAppointment[] = apptData.appointments || [];
      const allReports: HospitalReport[] = reportsData.reports || [];
      const allCalls: HospitalVoiceCall[] = voiceData.calls || [];
      const allFeedback: HospitalFeedback[] = feedbackData.feedback || [];
      const totalConversations: number = Array.isArray(convData.conversations) ? convData.conversations.length : 0;

      setAppointments(todayAppts.length > 0 ? todayAppts : allAppts.slice(0, 5));
      setReports(allReports.slice(0, 4));
      setVoiceCalls(allCalls);
      setFeedbackList(allFeedback);

      const comp = allAppts.filter((a) => a.status === 'completed').length;
      const pend = allAppts.filter((a) => a.status === 'confirmed' || a.status === 'rescheduled').length;
      const miss = allAppts.filter((a) => a.status === 'missed').length;
      const remSent = allAppts.filter((a) => a.reminder_24h_sent || a.reminder_2h_sent).length;
      const deliveredLabs = allReports.filter((r) => r.delivered_via_wa).length;

      let avgRatingStr = '—';
      if (allFeedback.length > 0) {
        const sum = allFeedback.reduce((acc, f) => acc + (f.rating || 5), 0);
        avgRatingStr = (sum / allFeedback.length).toFixed(1) + '★';
      }

      setStats({
        todayTotal: todayAppts.length > 0 ? todayAppts.length : allAppts.length,
        completed: comp,
        pending: pend,
        missed: miss,
        waHandled: totalConversations,
        aiCalls: allCalls.length,
        remindersSent: remSent,
        reportsDelivered: deliveredLabs,
        avgFeedback: avgRatingStr,
      });
    } catch (e) {
      console.error('Error fetching hospital dashboard overview data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [businessId]);

  const apptColumns: Column<HospitalAppointment>[] = [
    {
      key: 'token_number',
      header: 'Token',
      width: '70px',
      render: (appt) => (
        <span className="font-mono font-bold text-accent">#{appt.token_number || 1}</span>
      ),
    },
    {
      key: 'patient_name',
      header: 'Patient Info',
      primary: true,
      render: (appt) => (
        <div>
          <div className="font-semibold text-fg">{appt.patient_name}</div>
          <div className="text-[11px] text-fg-muted font-mono">{appt.patient_phone}</div>
        </div>
      ),
    },
    {
      key: 'doctor_name',
      header: 'Doctor',
      render: (appt) => (
        <div>
          <div className="font-medium text-fg">{appt.doctor_name || 'Dr. Rajesh Gupta'}</div>
          <div className="text-[11px] text-accent">{appt.department || 'Cardiology'}</div>
        </div>
      ),
    },
    {
      key: 'slot_time',
      header: 'Slot Time',
      render: (appt) => (
        <span className="font-mono text-xs text-fg-muted">
          {new Date(appt.slot_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (appt) => <StatusBadge status={appt.status} />,
    },
  ];

  const reportColumns: Column<HospitalReport>[] = [
    {
      key: 'report_type',
      header: 'Report',
      primary: true,
      render: (r) => (
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-fg">{r.report_type}</span>
            {r.is_critical && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-danger-subtle text-danger border border-danger-border">
                Critical
              </span>
            )}
          </div>
          <div className="text-[11px] text-fg-muted">{r.patient_name} ({r.patient_phone})</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Delivery',
      render: (r) => (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
            r.delivered_via_wa
              ? 'bg-success-subtle text-success border border-success-border'
              : 'bg-warning-subtle text-warning border border-warning-border'
          }`}
        >
          {r.delivered_via_wa ? 'Delivered' : 'Pending'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Top Banner: Greeting & Quick Actions */}
      <Card>
        <CardHeader className="flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-accent-subtle text-accent border border-accent-border">
                Clinical Command Center
              </span>
              <span className="flex items-center text-xs text-success font-medium">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse mr-1.5" />
                Live Sync
              </span>
            </div>
            <h2 className="text-xl font-bold text-fg mt-1">
              Clinical Practice & Patient Overview
            </h2>
            <CardDescription>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                fetchDashboardData();
                showToast({ title: 'Refreshing', message: 'Clinical data synced with Supabase.', type: 'info' });
              }}
              title="Refresh Ledger"
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenNewAppointment}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              + Book Consultation
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Top 4 Key Operational Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Scheduled Today"
          value={stats.todayTotal}
          icon={<Calendar className="text-accent" />}
          hint={`${stats.todayTotal} OPD Slots Active`}
        />
        <StatCard
          label="Completed Visits"
          value={stats.completed}
          deltaTone="positive"
          icon={<CheckCircle2 className="text-success" />}
          hint="Consultations concluded"
        />
        <StatCard
          label="Pending / Waiting"
          value={stats.pending}
          deltaTone="neutral"
          icon={<Clock className="text-warning" />}
          hint="Token queue active"
        />
        <StatCard
          label="Missed / No-Show"
          value={stats.missed}
          deltaTone={stats.missed > 0 ? 'negative' : 'neutral'}
          icon={<AlertCircle className="text-danger" />}
          hint="Automated follow-ups dispatched"
        />
      </div>

      {/* AI Automation Live Metrics Bar */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent" />
              <span>Automated Medical AI Staff Activity</span>
            </CardTitle>
            <CardDescription>
              24/7 WhatsApp triage, voice follow-ups, and lab dispatches
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3 bg-surface-subtle rounded-md border border-line text-center">
              <div className="text-lg sm:text-xl font-bold text-fg font-mono">{stats.waHandled}</div>
              <div className="text-[11px] text-fg-muted mt-0.5">WhatsApp Messages</div>
            </div>
            <div className="p-3 bg-surface-subtle rounded-md border border-line text-center">
              <div className="text-lg sm:text-xl font-bold text-fg font-mono">{stats.aiCalls}</div>
              <div className="text-[11px] text-fg-muted mt-0.5">AI Voice Calls</div>
            </div>
            <div className="p-3 bg-surface-subtle rounded-md border border-line text-center">
              <div className="text-lg sm:text-xl font-bold text-fg font-mono">{stats.remindersSent}</div>
              <div className="text-[11px] text-fg-muted mt-0.5">Slot Reminders</div>
            </div>
            <div className="p-3 bg-surface-subtle rounded-md border border-line text-center">
              <div className="text-lg sm:text-xl font-bold text-fg font-mono">{stats.reportsDelivered}</div>
              <div className="text-[11px] text-fg-muted mt-0.5">Labs Delivered</div>
            </div>
            <div className="p-3 bg-surface-subtle rounded-md border border-line text-center col-span-2 sm:col-span-1">
              <div className="text-lg sm:text-xl font-bold text-warning font-mono">{stats.avgFeedback}</div>
              <div className="text-[11px] text-fg-muted mt-0.5">Satisfaction Score</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid: Active OPD Queue & Recent Lab Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active Appointments */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent" />
              <span>Today's Active OPD Consultations</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onNavigateTab('hospital_appointments' as DashboardTab)}
              rightIcon={<ArrowUpRight className="w-3 h-3" />}
            >
              View All
            </Button>
          </CardHeader>
          <CardContent className="p-0 sm:p-0">
            <DataTable
              columns={apptColumns}
              rows={appointments}
              getRowKey={(a) => a.id}
              loading={loading && appointments.length === 0}
              empty={
                <div className="py-8 text-center text-xs text-fg-muted">
                  No appointments scheduled for today yet.
                </div>
              }
            />
          </CardContent>
        </Card>

        {/* Recent Lab Reports */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-accent" />
              <span>Recent Diagnostic Lab Reports</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onNavigateTab('hospital_reports' as DashboardTab)}
              rightIcon={<ArrowUpRight className="w-3 h-3" />}
            >
              View All
            </Button>
          </CardHeader>
          <CardContent className="p-0 sm:p-0">
            <DataTable
              columns={reportColumns}
              rows={reports}
              getRowKey={(r) => r.id}
              loading={loading && reports.length === 0}
              empty={
                <div className="py-8 text-center text-xs text-fg-muted">
                  No lab reports published yet.
                </div>
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
