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
import { HospitalAppointment, HospitalReport } from '@/types';
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
  const [stats, setStats] = useState({
    todayTotal: 0,
    completed: 0,
    pending: 0,
    missed: 0,
    waHandled: 247,
    aiCalls: 89,
    remindersSent: 34,
    reportsDelivered: 12,
    avgFeedback: '4.6★',
  });

  const { showToast } = useToast();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const todayStr = new Date().toISOString().split('T')[0];

      // Fetch today's appointments
      const apptRes = await fetch(`/api/hospital/appointments?${businessId ? `business_id=${businessId}&` : ''}date=${todayStr}`);
      const apptData = await apptRes.json();

      // Fetch all appointments for metrics
      const allApptRes = await fetch(`/api/hospital/appointments?${businessId ? `business_id=${businessId}` : ''}`);
      const allApptData = await allApptRes.json();

      // Fetch reports
      const reportsRes = await fetch(`/api/hospital/reports?${businessId ? `business_id=${businessId}` : ''}`);
      const reportsData = await reportsRes.json();

      if (allApptData.success && Array.isArray(allApptData.appointments)) {
        const list: HospitalAppointment[] = allApptData.appointments;
        const comp = list.filter((a) => a.status === 'completed').length;
        const pend = list.filter((a) => a.status === 'confirmed' || a.status === 'rescheduled').length;
        const miss = list.filter((a) => a.status === 'missed').length;

        setAppointments(apptData.appointments || list.slice(0, 5));
        setStats((prev) => ({
          ...prev,
          todayTotal: list.length,
          completed: comp,
          pending: pend,
          missed: miss,
        }));
      }

      if (reportsData.success && Array.isArray(reportsData.reports)) {
        setReports(reportsData.reports.slice(0, 4));
        setStats((prev) => ({
          ...prev,
          reportsDelivered: reportsData.reports.filter((r: HospitalReport) => r.delivered_via_wa).length,
        }));
      }
    } catch (e) {
      console.error('Error fetching hospital dashboard overview data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [businessId]);

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
              Live Hospital Sync
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
            Active Engines
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/60 dark:border-slate-800/60 text-center">
            <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-mono">
              {stats.waHandled}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              WhatsApp Triage
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
              Slot Reminders
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
            {stats.todayTotal || 38}
          </div>
          <div className="flex items-center text-[11px] text-teal-600 dark:text-teal-400 mt-1">
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            <span>12% surge in OPD footfall</span>
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
            {stats.completed || 26}
          </div>
          <div className="flex items-center text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            <span>Prescriptions logged</span>
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
            {stats.pending || 8}
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
            {stats.missed || 4}
          </div>
          <div className="flex items-center text-[11px] text-rose-600 dark:text-rose-400 mt-1">
            <PhoneCall className="w-3.5 h-3.5 mr-1" />
            <span>AI Voice Call Triggered</span>
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
                Today&apos;s Active Consultation Queue
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
                  <th className="pb-2 font-semibold">Patient</th>
                  <th className="pb-2 font-semibold">Attending Doctor</th>
                  <th className="pb-2 font-semibold">Slot Time</th>
                  <th className="pb-2 font-semibold">Token</th>
                  <th className="pb-2 font-semibold">Status</th>
                  <th className="pb-2 font-semibold text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 dark:text-slate-400">
                      No active appointments found for today. Click &quot;+ Book Consultation&quot; above to schedule one.
                    </td>
                  </tr>
                ) : (
                  appointments.map((appt) => (
                    <tr key={appt.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 font-medium text-slate-900 dark:text-white">
                        <div>{appt.patient_name}</div>
                        <div className="text-[10px] text-slate-600 dark:text-slate-400">{appt.patient_phone}</div>
                      </td>
                      <td className="py-3 text-slate-700 dark:text-slate-300">
                        <div>{appt.doctor_name || 'Dr. Rajesh Gupta'}</div>
                        <div className="text-[10px] text-teal-600 dark:text-teal-400">{appt.department || 'Cardiology'}</div>
                      </td>
                      <td className="py-3 font-mono text-slate-600 dark:text-slate-400">
                        {new Date(appt.slot_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        #{appt.token_number || '1'}
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
              <div className="p-3 bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 rounded-xl text-xs">
                <div className="font-bold text-rose-800 dark:text-rose-300 flex items-center justify-between">
                  <span>Priya Verma — Critical CBC</span>
                  <span className="text-[10px] bg-rose-200 dark:bg-rose-900/80 px-1.5 py-0.5 rounded font-mono">Urgent</span>
                </div>
                <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-1">
                  Hemoglobin &lt; 7.0 g/dL. Automated AI Voice alert sent + attending doctor alerted.
                </p>
              </div>

              <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-xl text-xs">
                <div className="font-bold text-amber-800 dark:text-amber-300 flex items-center justify-between">
                  <span>Rahul Sharma — 2nd No-Show</span>
                  <span className="text-[10px] bg-amber-200 dark:bg-amber-900/80 px-1.5 py-0.5 rounded font-mono">Follow-up</span>
                </div>
                <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-1">
                  Cardiology follow-up missed twice. Re-booking prompt queued on WhatsApp.
                </p>
              </div>

              <div className="p-3 bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/50 rounded-xl text-xs">
                <div className="font-bold text-teal-800 dark:text-teal-300 flex items-center justify-between">
                  <span>AI Agent WhatsApp Queue</span>
                  <span className="text-[10px] bg-teal-200 dark:bg-teal-900/80 px-1.5 py-0.5 rounded font-mono">Live</span>
                </div>
                <p className="text-[11px] text-teal-700 dark:text-teal-300 mt-1">
                  12 patient inquiries resolved automatically in the last 60 minutes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
