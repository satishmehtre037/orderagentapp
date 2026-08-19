'use client';

import React, { useState } from 'react';
import {
  Zap,
  Clock,
  Play,
  CheckCircle2,
  Calendar,
  Star,
  PhoneCall,
  Activity,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

interface HospitalAutomationTabProps {
  businessId?: string;
}

export default function HospitalAutomationTab({ businessId }: HospitalAutomationTabProps) {
  const [runningJob, setRunningJob] = useState<string | null>(null);
  const [lastResults, setLastResults] = useState<Record<string, any>>({});

  const { showToast } = useToast();

  const handleTriggerJob = async (jobName: string) => {
    try {
      setRunningJob(jobName);
      const res = await fetch(`/api/hospital/cron/trigger/${jobName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: businessId }),
      });
      const data = await res.json();

      if (data.success) {
        setLastResults((prev) => ({ ...prev, [jobName]: data.result }));
        showToast({
          title: 'Engine Execution Succeeded',
          message: `${jobName.replace('_', ' ').toUpperCase()} processed ${data.result?.processed ?? 0} events successfully.`,
          type: 'success',
        });
      } else {
        showToast({
          title: 'Execution Failed',
          message: data.error || 'Could not complete automation job.',
          type: 'error',
        });
      }
    } catch (e: any) {
      console.error('Error triggering job:', e);
      showToast({ title: 'Trigger Error', message: e.message, type: 'error' });
    } finally {
      setRunningJob(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <span>Hospital Background Cron & Webhook Engines</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Automated schedulers matching HospitalMN8nWorkflow.json triggers for reminders, follow-ups, and surveys
          </p>
        </div>

        <button
          onClick={() => handleTriggerJob('all')}
          disabled={runningJob !== null}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{runningJob === 'all' ? 'Executing Suite...' : 'Run All Automations'}</span>
        </button>
      </div>

      {/* 3 Core Cron Engines */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Engine 1: 24h & 2h Reminder Scanner */}
        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-full border border-teal-500/20">
                Every 15 Mins
              </span>
            </div>

            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Appointment Reminder Engine
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Scans upcoming confirmed appointments, verifies 24-hour and 2-hour countdowns, and delivers WhatsApp token confirmations with 1-tap reschedule buttons.
            </p>

            {lastResults['appointment_reminders'] && (
              <div className="mt-3 p-2.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl text-[11px] text-slate-600 dark:text-slate-300 font-mono border border-slate-200/60 dark:border-slate-800/60">
                ✅ Last run: {lastResults['appointment_reminders'].processed} reminders dispatched.
              </div>
            )}
          </div>

          <button
            onClick={() => handleTriggerJob('appointment_reminders')}
            disabled={runningJob !== null}
            className="mt-5 w-full py-2 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 text-teal-700 dark:text-teal-300 border border-teal-500/30 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{runningJob === 'appointment_reminders' ? 'Running...' : 'Trigger Reminders'}</span>
          </button>
        </div>

        {/* Engine 2: Post-Visit Feedback Scanner */}
        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Star className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/20">
                Hourly
              </span>
            </div>

            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Patient Feedback & Review Collector
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Detects newly completed consultations and delivers 1-5 star WhatsApp surveys. Triggers Google Review links for 4-5★ and escalates ≤3★ to the supervisor.
            </p>

            {lastResults['feedback_scanner'] && (
              <div className="mt-3 p-2.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl text-[11px] text-slate-600 dark:text-slate-300 font-mono border border-slate-200/60 dark:border-slate-800/60">
                ✅ Last run: {lastResults['feedback_scanner'].processed} surveys dispatched.
              </div>
            )}
          </div>

          <button
            onClick={() => handleTriggerJob('feedback_scanner')}
            disabled={runningJob !== null}
            className="mt-5 w-full py-2 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{runningJob === 'feedback_scanner' ? 'Running...' : 'Trigger Feedback Scanner'}</span>
          </button>
        </div>

        {/* Engine 3: Missed Follow-up & Voice Calling */}
        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <PhoneCall className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-500/20">
                Daily at 6 PM
              </span>
            </div>

            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              No-Show Follow-up & Voice Re-booking
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Scans for missed OPD visits, schedules speech-synthesis AI voice calls to patients, and offers instant 1-tap WhatsApp consultation rescheduling.
            </p>

            {lastResults['missed_followup'] && (
              <div className="mt-3 p-2.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl text-[11px] text-slate-600 dark:text-slate-300 font-mono border border-slate-200/60 dark:border-slate-800/60">
                ✅ Last run: {lastResults['missed_followup'].processed} follow-ups processed.
              </div>
            )}
          </div>

          <button
            onClick={() => handleTriggerJob('missed_followup')}
            disabled={runningJob !== null}
            className="mt-5 w-full py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{runningJob === 'missed_followup' ? 'Running...' : 'Trigger Voice Follow-ups'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
