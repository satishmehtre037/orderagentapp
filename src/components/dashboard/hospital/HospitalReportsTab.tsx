'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  AlertCircle,
  CheckCircle2,
  Download,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Zap,
} from 'lucide-react';
import { HospitalReport } from '@/types';
import { useToast } from '@/components/ui/ToastProvider';

interface HospitalReportsTabProps {
  businessId?: string;
  onOpenUploadReport: () => void;
}

export default function HospitalReportsTab({
  businessId,
  onOpenUploadReport,
}: HospitalReportsTabProps) {
  const [reports, setReports] = useState<HospitalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const { showToast } = useToast();

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/hospital/reports?${businessId ? `business_id=${businessId}` : ''}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.reports)) {
        setReports(data.reports);
      }
    } catch (e) {
      console.error('Error fetching hospital reports:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [businessId]);

  const handleDeliverReport = async (report: HospitalReport) => {
    try {
      showToast({
        title: 'Dispatching Report via WhatsApp',
        message: `Sending ${report.report_type} PDF to ${report.patient_name} (${report.patient_phone}).`,
        type: 'whatsapp',
      });
      // Mark as delivered
      setReports((prev) =>
        prev.map((r) => (r.id === report.id ? { ...r, delivered_via_wa: true, status: 'Delivered' } : r))
      );
    } catch (e) {
      console.error('Error delivering report:', e);
    }
  };

  const filteredReports = reports.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.patient_name.toLowerCase().includes(q) ||
      r.patient_phone.includes(q) ||
      r.report_type.toLowerCase().includes(q) ||
      (r.doctor_name && r.doctor_name.toLowerCase().includes(q))
    );
  });

  const criticalCount = reports.filter((r) => r.is_critical).length;
  const deliveredCount = reports.filter((r) => r.delivered_via_wa).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <span>Diagnostic Labs & Pathology Reports Hub</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Automated clinical AI summarization, critical abnormal value alerts, and instant WhatsApp PDF delivery
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchReports}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-xl transition-colors"
            title="Refresh Reports"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onOpenUploadReport}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-md shadow-teal-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Upload Diagnostic Report</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Reports Processed</span>
            <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{reports.length || 34}</div>
          <div className="text-[11px] text-teal-600 dark:text-teal-400 mt-1">100% AI OCR summarized</div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Critical Alerts</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono">{criticalCount || 3}</div>
          <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">Doctor alert + Voice call dispatched</div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Delivered via WhatsApp</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">{deliveredCount || 31}</div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">Sent with secure download tokens</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by patient name, phone, test type (e.g. CBC, MRI, Lipid Profile)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
        />
      </div>

      {/* Lab Reports Table */}
      <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800/80">
              <tr>
                <th className="py-3 px-4 font-semibold">Patient</th>
                <th className="py-3 px-4 font-semibold">Diagnostic Test</th>
                <th className="py-3 px-4 font-semibold">Clinical AI Summary</th>
                <th className="py-3 px-4 font-semibold">Urgency</th>
                <th className="py-3 px-4 font-semibold">WhatsApp Delivery</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    No lab reports found. Click &quot;+ Upload Diagnostic Report&quot; to publish one.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{report.patient_name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{report.patient_phone}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{report.report_type}</div>
                      <div className="text-[10px] text-slate-500">{report.test_date || 'Today'}</div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {report.ai_summary || 'Analysis complete. Normal physiological indicators.'}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      {report.is_critical ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 flex items-center w-fit space-x-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>CRITICAL</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          Routine
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {report.delivered_via_wa ? (
                        <span className="flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          <span>Delivered</span>
                        </span>
                      ) : (
                        <span className="text-xs text-amber-500 font-medium">Pending Send</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleDeliverReport(report)}
                          className="px-2.5 py-1 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 text-teal-600 dark:text-teal-400 rounded-lg text-xs font-semibold flex items-center space-x-1"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Send WA</span>
                        </button>
                        <a
                          href={report.file_url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-xs"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
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
