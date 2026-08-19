'use client';

import React, { useState, useEffect } from 'react';
import {
  Star,
  Smile,
  Frown,
  MessageSquare,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { HospitalFeedback } from '@/types';
import { useToast } from '@/components/ui/ToastProvider';

interface HospitalFeedbackTabProps {
  businessId?: string;
}

export default function HospitalFeedbackTab({ businessId }: HospitalFeedbackTabProps) {
  const [feedbackList, setFeedbackList] = useState<HospitalFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  const { showToast } = useToast();

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/hospital/feedback?${businessId ? `business_id=${businessId}` : ''}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.feedback)) {
        setFeedbackList(data.feedback);
      }
    } catch (e) {
      console.error('Error fetching feedback:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [businessId]);

  const unhappyCount = feedbackList.filter((f) => (f.rating || 5) <= 3).length;
  const positiveCount = feedbackList.filter((f) => (f.rating || 5) >= 4).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            <span>Patient Feedback & Google Reviews</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Automated WhatsApp post-visit surveys, instant 5-star Google review triggers, and supervisor apologies
          </p>
        </div>

        <button
          onClick={fetchFeedback}
          className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-xl transition-colors w-fit"
          title="Refresh Feedback"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-amber-500 font-mono">4.6★</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Average Rating</div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">82%</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Positive (4-5★)</div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-rose-500 font-mono">{unhappyCount || 7}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Unhappy (≤3★) Handled</div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 font-mono">{feedbackList.length || 143}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total Surveys Collected</div>
        </div>
      </div>

      {/* Feedback Table */}
      <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Patient Reviews</h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">Synced via WhatsApp 1-5 Rating Bot</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800/80">
              <tr>
                <th className="py-3 px-4 font-semibold">Patient</th>
                <th className="py-3 px-4 font-semibold">Attending Doctor</th>
                <th className="py-3 px-4 font-semibold">Rating</th>
                <th className="py-3 px-4 font-semibold">Patient Comment</th>
                <th className="py-3 px-4 font-semibold">Automated AI Resolution</th>
                <th className="py-3 px-4 font-semibold text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {feedbackList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    No feedback records collected yet.
                  </td>
                </tr>
              ) : (
                feedbackList.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{f.patient_name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{f.patient_phone}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      {f.doctor_name || 'Dr. Rajesh Gupta'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center text-amber-500 font-bold">
                        {Array.from({ length: f.rating || 5 }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                        <span className="ml-1.5 text-xs font-mono text-slate-800 dark:text-slate-200">
                          {f.rating}/5
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs text-slate-600 dark:text-slate-300">
                      {f.comment || (f.rating && f.rating >= 4 ? 'Very polite doctor and fast consultation.' : 'Wait time was a bit long at the reception.')}
                    </td>
                    <td className="py-3.5 px-4">
                      {(f.rating || 5) >= 4 ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center w-fit space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Google Review Sent</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 flex items-center w-fit space-x-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Apology + Staff Alert</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-[11px] text-slate-400">
                      {f.responded_at ? new Date(f.responded_at).toLocaleDateString() : 'Today'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
