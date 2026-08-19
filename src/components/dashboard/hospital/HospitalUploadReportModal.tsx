'use client';

import React, { useState } from 'react';
import { X, FileUp, User, Phone, Stethoscope, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

interface HospitalUploadReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  businessId?: string;
}

export default function HospitalUploadReportModal({
  isOpen,
  onClose,
  onSuccess,
  businessId,
}: HospitalUploadReportModalProps) {
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [doctorName, setDoctorName] = useState('Dr. Rajesh Gupta');
  const [reportType, setReportType] = useState('Complete Blood Count (CBC)');
  const [fileUrl, setFileUrl] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [isCritical, setIsCritical] = useState(false);
  const [loading, setLoading] = useState(false);

  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !patientPhone || !reportType) return;

    try {
      setLoading(true);
      const res = await fetch('/api/hospital/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId,
          patient_name: patientName,
          patient_phone: patientPhone,
          doctor_name: doctorName,
          report_type: reportType,
          file_url: fileUrl || `https://medicare.hospital/reports/REP-${Math.floor(1000 + Math.random() * 9000)}.pdf`,
          ai_summary: aiSummary,
          is_critical: isCritical,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast({
          title: isCritical ? '🚨 Critical Lab Report Dispatched!' : '📄 Lab Report Published!',
          message: `${reportType} sent to ${patientName} via WhatsApp with secure PDF token.`,
          type: isCritical ? 'error' : 'whatsapp',
        });
        onSuccess();
        onClose();
      } else {
        showToast({ title: 'Upload Failed', message: data.error || 'Could not publish report.', type: 'error' });
      }
    } catch (e: any) {
      console.error('Error uploading report:', e);
      showToast({ title: 'Upload Error', message: e.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-teal-500/10 to-indigo-500/10">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-400">
              <FileUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Publish Diagnostic Lab Report
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generates AI OCR summary and delivers PDF to patient on WhatsApp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Patient Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Priya Verma"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                WhatsApp Phone *
              </label>
              <input
                type="tel"
                required
                placeholder="+91 98765 43210"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Diagnostic Test Category
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              >
                <option value="Complete Blood Count (CBC)">Complete Blood Count (CBC)</option>
                <option value="Lipid Profile">Lipid Profile</option>
                <option value="Chest X-Ray">Chest X-Ray</option>
                <option value="Brain MRI">Brain MRI</option>
                <option value="Liver Function Test (LFT)">Liver Function Test (LFT)</option>
                <option value="Kidney Function Test (KFT)">Kidney Function Test (KFT)</option>
                <option value="COVID-19 RT-PCR">COVID-19 RT-PCR</option>
                <option value="12-Lead ECG">12-Lead ECG</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Attending Physician
              </label>
              <select
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              >
                <option value="Dr. Rajesh Gupta">Dr. Rajesh Gupta</option>
                <option value="Dr. Ananya Iyer">Dr. Ananya Iyer</option>
                <option value="Dr. Vikramaditya Rao">Dr. Vikramaditya Rao</option>
                <option value="Dr. Priya Sharma">Dr. Priya Sharma</option>
                <option value="Dr. Sameer Deshmukh">Dr. Sameer Deshmukh</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Report PDF Document Link
            </label>
            <input
              type="url"
              placeholder="https://medicare.hospital/reports/REP-8492.pdf"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Clinical AI Finding Summary
            </label>
            <textarea
              rows={2}
              placeholder="e.g. All lipid parameters within normal biological limits. HDL: 52 mg/dL, LDL: 98 mg/dL..."
              value={aiSummary}
              onChange={(e) => setAiSummary(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl flex items-center space-x-3">
            <input
              type="checkbox"
              id="criticalCheck"
              checked={isCritical}
              onChange={(e) => setIsCritical(e.target.checked)}
              className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500 border-slate-300"
            />
            <label htmlFor="criticalCheck" className="text-xs text-rose-800 dark:text-rose-300 font-bold cursor-pointer">
              Mark as Critical Abnormal Alert (Triggers urgent voice call + doctor notification)
            </label>
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? 'Publishing...' : '✓ Publish & Send via WhatsApp'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
