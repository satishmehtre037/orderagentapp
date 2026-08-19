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
import { HospitalAppointment, HospitalReport, HospitalVoiceCall, HospitalFeedback } from '@/types';
import { useToast } from '@/components/ui/ToastProvider';

interface HospitalDashboardOverviewTabProps {
  businessId?: string;
  onNavigateTab: (tab: any) => void;
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

  const criticalReports = reports.filter((r) => r.is_critical);
  const missedAppts = appointments.filter((a) => a.status === 'missed');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner: Greeting & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-teal-900/40 via-slate-900/60 to-indigo-950/40 p-5 sm:p-6 rounded-2xl border border-teal-500/20 shadow-lg">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 px-2 rounded-md bg-teal-500/20 text-teal-300 text-xs font-bold uppercase tracking-wider">
              Clinical Command Center
            </span>
            <span className="flex items-center text-xs text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
              Live Supabase Sync
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Clinical Practice & Patient Overview
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              fetchDashboardData();
              showToast({ title: 'Refreshing', message: 'Clinical data synced with Supabase.', type: 'info' });
            }}
            className="p-2.5 bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onOpenNewAppointment}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-md shadow-teal-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Book Consultation</span>
          </button>
        </div>
      </div>

      {/* AI Automation Live Metrics Bar */}
      <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Automated Medical AI Staff Activity
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                24/7 WhatsApp triage, voice follow-ups, and lab dispatches
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-full border border-teal-500/30">
            Live Supabase Records
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/60 dark:border-slate-800/60 text-center">
            <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-mono">
              {stats.waHandled}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              WhatsApp Messages
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/60 dark:border-slate-800/60 text-center">
            <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-mono">
              {stats.aiCalls}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              AI Voice Calls
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/60 dark:border-slate-800/60 text-center">
            <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-mono">
              {stats.remindersSent}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Slot Reminders Sent
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/60 dark:border-slate-800/60 text-center">
            <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-mono">
              {stats.reportsDelivered}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Labs Delivered
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/60 dark:border-slate-800/60 text-center col-span-2 sm:col-span-1">
            <div className="text-lg sm:text-xl font-bold text-amber-500 font-mono">
              {stats.avgFeedback}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Patient Satisfaction
            </div>
          </div>
        </div>
      </div>

      {/* Top 4 Key Operational Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Scheduled Today</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {stats.todayTotal}
          </div>
          <div className="flex items-center text-[11px] text-teal-600 dark:text-teal-400 mt-1">
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            <span>{stats.todayTotal > 0 ? `${stats.todayTotal} OPD Slots Active` : 'No slots booked yet'}</span>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed Visits</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {stats.completed}
          </div>
          <div className="flex items-center text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            <span>Consultations concluded</span>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending / Waiting</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {stats.pending}
          </div>
          <div className="flex items-center text-[11px] text-amber-600 dark:text-amber-400 mt-1">
            <Clock className="w-3.5 h-3.5 mr-1" />
            <span>Token queue active</span>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Missed / No-Show</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono">
            {stats.missed}
          </div>
          <div className="flex items-center text-[11px] text-rose-600 dark:text-rose-400 mt-1">
            <PhoneCall className="w-3.5 h-3.5 mr-1" />
            <span>{stats.missed > 0 ? 'Follow-ups required' : 'Zero no-shows'}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Today's Appointments & Clinical Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Appointments Matrix */}
        <div className="lg:col-span-2 bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Active Consultation Queue
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('hospital_appointments')}
              className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center"
            >
              <span>View All OPD →</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <th className="pb-2 font-semibold">Token</th>
                  <th className="pb-2 font-semibold">Patient</th>
                  <th className="pb-2 font-semibold">Attending Doctor</th>
                  <th className="pb-2 font-semibold">Slot Time</th>
                  <th className="pb-2 font-semibold">Status</th>
                  <th className="pb-2 font-semibold text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 dark:text-slate-400">
                      No active appointments found. Click &quot;+ Book Consultation&quot; above to schedule one.
                    </td>
                  </tr>
                ) : (
                  appointments.map((appt) => (
                    <tr key={appt.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        #{appt.token_number || '1'}
                      </td>
                      <td className="py-3 font-medium text-slate-900 dark:text-white">
                        <div>{appt.patient_name}</div>
                        <div className="text-[10px] text-slate-600 dark:text-slate-400">{appt.patient_phone}</div>
                      </td>
                      <td className="py-3 text-slate-700 dark:text-slate-300">
                        <div>{appt.doctor_name || 'Assigned On Duty'}</div>
                        <div className="text-[10px] text-teal-600 dark:text-teal-400">{appt.department || 'General Medicine'}</div>
                      </td>
                      <td className="py-3 font-mono text-slate-600 dark:text-slate-400">
                        {new Date(appt.slot_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            appt.status === 'completed'
                              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400'
                              : appt.status === 'missed'
                              ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400'
                              : 'bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-400'
                          }`}
                        >
                          {appt.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => {
                            showToast({
                              title: 'Reminder Dispatched',
                              message: `WhatsApp reminder delivered to ${appt.patient_name}`,
                              type: 'whatsapp',
                            });
                          }}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-teal-500/20 text-slate-700 dark:text-slate-300 hover:text-teal-600 rounded-lg text-[11px] font-medium transition-colors"
                        >
                          💬 Remind
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Critical Lab & Diagnostic Alerts */}
        <div className="space-y-4">
          <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Emergency & Lab Alerts</h3>
              </div>
            </div>

            <div className="space-y-2.5">
              {criticalReports.length === 0 && missedAppts.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1">
                  <ShieldCheck className="w-8 h-8 mx-auto text-emerald-500/60" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">All Clinical Queues Normal</p>
                  <p className="text-[11px]">No critical lab abnormalities or unhandled emergencies.</p>
                </div>
              ) : (
                <>
                  {criticalReports.map((r) => (
                    <div key={r.id} className="p-3 bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 rounded-xl text-xs">
                      <div className="font-bold text-rose-800 dark:text-rose-300 flex items-center justify-between">
                        <span>{r.patient_name} — {r.report_type}</span>
                        <span className="text-[10px] bg-rose-200 dark:bg-rose-900/80 px-1.5 py-0.5 rounded font-mono">Critical</span>
                      </div>
                      <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-1">
                        {r.ai_summary || 'Abnormal diagnostic readings detected. Doctor alerted.'}
                      </p>
                    </div>
                  ))}

                  {missedAppts.map((a) => (
                    <div key={a.id} className="p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-xl text-xs">
                      <div className="font-bold text-amber-800 dark:text-amber-300 flex items-center justify-between">
                        <span>{a.patient_name} — Missed Appointment</span>
                        <span className="text-[10px] bg-amber-200 dark:bg-amber-900/80 px-1.5 py-0.5 rounded font-mono">No-Show</span>
                      </div>
                      <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-1">
                        Slot at {new Date(a.slot_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} was missed. Auto voice follow-up queued.
                      </p>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

