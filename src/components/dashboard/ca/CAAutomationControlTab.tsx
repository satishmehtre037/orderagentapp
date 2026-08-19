'use client';

import React, { useState } from 'react';
import { Bot, Play, Clock, CheckCircle2, AlertTriangle, RefreshCw, Send, Bell } from 'lucide-react';

interface CAAutomationControlTabProps {
  businessId?: string;
  businessName?: string;
}

export default function CAAutomationControlTab({ businessId, businessName }: CAAutomationControlTabProps) {
  const [runningJob, setRunningJob] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ jobName: string; data: any } | null>(null);
  const [testAlertSending, setTestAlertSending] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null);

  const handleTriggerJob = async (jobName: string) => {
    setRunningJob(jobName);
    setTestResult(null);
    try {
      const res = await fetch(`/api/ca/cron/trigger/${jobName}`, {
        method: 'POST',
      });
      const data = await res.json();
      setTestResult({ jobName, data });
    } catch (err: any) {
      console.error('Trigger error:', err);
      setTestResult({ jobName, data: { error: err.message } });
    } finally {
      setRunningJob(null);
    }
  };

  const handleSendTestPartnerAlert = async () => {
    setTestAlertSending(true);
    setAlertSuccess(null);
    try {
      const res = await fetch('/api/ca/website-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Partner Alert Client',
          phone: '919876543210',
          message: 'URGENT: Need Immediate Company Incorporation & GST Registration for new startup!',
          source: 'Automation Diagnostic Test',
        }),
      });

      if (res.ok) {
        setAlertSuccess('🚀 Test Hot Lead generated and Partner Alert dispatched via Telegram/WhatsApp!');
        setTimeout(() => setAlertSuccess(null), 6000);
      }
    } catch (err: any) {
      console.error('Test alert error:', err);
    } finally {
      setTestAlertSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-slate-950 dark:via-indigo-950/80 dark:to-slate-950 text-white p-6 rounded-2xl shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <Bot className="w-4 h-4" /> Autonomous Background Schedulers
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">CA Automation & Cron Center</h2>
          <p className="text-slate-300 text-sm mt-0.5">
            4 daily autonomous engines running continuously in your backend to eliminate manual client chasing.
          </p>
        </div>
        <button
          onClick={handleSendTestPartnerAlert}
          disabled={testAlertSending}
          className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-rose-600/30 transition disabled:opacity-50"
        >
          <Bell className="w-4 h-4" />
          {testAlertSending ? 'Dispatching...' : 'Test Partner Alert'}
        </button>
      </div>

      {alertSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm font-medium rounded-2xl flex items-center justify-between shadow-sm">
          <span>{alertSuccess}</span>
          <button onClick={() => setAlertSuccess(null)} className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold text-xs">Dismiss</button>
        </div>
      )}

      {/* 4 Automated Engines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Engine 1 */}
        <div className="bg-white dark:bg-slate-900/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 transition-colors">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                <Clock className="w-4 h-4" /> 09:00 AM (Daily)
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                Active & Running
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Compliance Deadline Engine</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Scans all pending GST, ITR, TDS & ROC deadlines. Dispatches staged reminders at <b>7 days</b> (gentle), <b>3 days</b> (clear), <b>1 day</b> (urgent), <b>due today</b>, and <b>overdue</b>. Escalates to Partner if overdue &gt; 3 days.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">cron: 0 9 * * *</span>
            <button
              onClick={() => handleTriggerJob('compliance')}
              disabled={runningJob === 'compliance'}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 font-semibold rounded-xl text-xs transition disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${runningJob === 'compliance' ? 'animate-spin' : ''}`} />
              {runningJob === 'compliance' ? 'Executing...' : 'Run Test Now'}
            </button>
          </div>
        </div>

        {/* Engine 2 */}
        <div className="bg-white dark:bg-slate-900/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 transition-colors">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                <Clock className="w-4 h-4" /> 09:30 AM (Daily)
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                Active & Running
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Document Chasing Engine</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Scans <code>ca_documents_tracker</code> for pending document requests not updated in 3+ days. Drafts personalized follow-ups with escalating tone (Attempt 1 = Gentle, 2 = Clear, 3+ = Delay Warning & Partner Escalation).
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">cron: 30 9 * * *</span>
            <button
              onClick={() => handleTriggerJob('documents')}
              disabled={runningJob === 'documents'}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 font-semibold rounded-xl text-xs transition disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${runningJob === 'documents' ? 'animate-spin' : ''}`} />
              {runningJob === 'documents' ? 'Executing...' : 'Run Test Now'}
            </button>
          </div>
        </div>

        {/* Engine 3 */}
        <div className="bg-white dark:bg-slate-900/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 transition-colors">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                <Clock className="w-4 h-4" /> 10:00 AM (Daily)
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                Active & Running
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Lead Nurturing & Follow-up Engine</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Finds open leads whose follow-up date has arrived. Dispatches conversational WhatsApp check-ins every 3 days. Automatically sets status to <b>Cold-Closed</b> after 4 unsuccessful attempts.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">cron: 0 10 * * *</span>
            <button
              onClick={() => handleTriggerJob('leads')}
              disabled={runningJob === 'leads'}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 font-semibold rounded-xl text-xs transition disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${runningJob === 'leads' ? 'animate-spin' : ''}`} />
              {runningJob === 'leads' ? 'Executing...' : 'Run Test Now'}
            </button>
          </div>
        </div>

        {/* Engine 4 */}
        <div className="bg-white dark:bg-slate-900/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 transition-colors">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                <Clock className="w-4 h-4" /> 10:30 AM (Daily)
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                Active & Running
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Invoice Fee Recovery Engine</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Scans unpaid invoices for staged reminders (3d upcoming, due today, 1-7d mild, 8-15d moderate, &gt;15d severe). Automatically sets <code>escalated = &apos;Yes&apos;</code> and alerts the Partner for invoices &gt; 15 days overdue.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">cron: 30 10 * * *</span>
            <button
              onClick={() => handleTriggerJob('invoices')}
              disabled={runningJob === 'invoices'}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 font-semibold rounded-xl text-xs transition disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${runningJob === 'invoices' ? 'animate-spin' : ''}`} />
              {runningJob === 'invoices' ? 'Executing...' : 'Run Test Now'}
            </button>
          </div>
        </div>
      </div>

      {/* Execution Diagnostics Result Viewer */}
      {testResult && (
        <div className="bg-slate-900 dark:bg-slate-950 text-white p-5 rounded-2xl shadow-xl space-y-3 font-mono text-xs border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-indigo-400 font-bold uppercase">⚡ Execution Result: {testResult.jobName}</span>
            <button onClick={() => setTestResult(null)} className="text-slate-400 hover:text-white font-bold">✕</button>
          </div>
          <pre className="overflow-x-auto text-emerald-400 max-h-60">
            {JSON.stringify(testResult.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
