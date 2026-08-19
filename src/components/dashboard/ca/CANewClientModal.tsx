'use client';

import React, { useState } from 'react';
import { UserPlus, Building2, Phone, Mail, FileText, CheckCircle2, X } from 'lucide-react';
import type { CAEntityType } from '@/types';

interface CANewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientAdded?: () => void;
  businessId?: string;
  businessName?: string;
}

export default function CANewClientModal({
  isOpen,
  onClose,
  onClientAdded,
  businessId,
  businessName = 'Apex Tax & Financial Advisors',
}: CANewClientModalProps) {
  const [clientName, setClientName] = useState('');
  const [entityType, setEntityType] = useState<CAEntityType>('Private Limited' as any);
  const [pan, setPan] = useState('');
  const [gstin, setGstin] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([
    'GST Filing',
    'ITR Filing',
    'ROC / MCA Compliance',
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const SERVICES_LIST = [
    'GST Filing',
    'ITR Filing',
    'TDS Compliance',
    'ROC / MCA Compliance',
    'Statutory & Tax Audit',
    'Bookkeeping & Accounting',
    'Startup Registration',
    'Trademark & IP',
  ];

  const toggleService = (svc: string) => {
    if (selectedServices.includes(svc)) {
      setSelectedServices(selectedServices.filter((s) => s !== svc));
    } else {
      setSelectedServices([...selectedServices, svc]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !phone.trim()) {
      setErrorMsg('Client Name and WhatsApp Phone are required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/ca/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId,
          client_name: clientName.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          pan: pan.trim() || undefined,
          gstin: gstin.trim() || undefined,
          entity_type: entityType,
          requirement: selectedServices.join(', '),
          notes: `Registered via CRM Dashboard. Services: ${selectedServices.join(', ')}`,
          firm_name: businessName,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to add client');
      }

      if (onClientAdded) onClientAdded();
      onClose();
      // Reset form
      setClientName('');
      setPan('');
      setGstin('');
      setPhone('');
      setEmail('');
    } catch (err: any) {
      console.error('Error adding new client:', err);
      setErrorMsg(err.message || 'Failed to save client');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-indigo-600 dark:text-indigo-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">+ Onboard New Client Entity</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Register into Compliance Directory & activate WhatsApp AI automation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Client / Firm Legal Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Apex Enterprises Pvt Ltd"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Entity Structure *
              </label>
              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="Private Limited">Private Limited Company</option>
                <option value="Proprietorship">Proprietorship Firm</option>
                <option value="Partnership">Partnership Firm</option>
                <option value="LLP">Limited Liability Partnership (LLP)</option>
                <option value="Individual">Individual (Salaried / Professional)</option>
                <option value="Public Limited">Public Limited Company</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Permanent Account Number (PAN)
              </label>
              <input
                type="text"
                placeholder="e.g. AABCM1234F"
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                GSTIN (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 23AABCM1234F1Z5"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                WhatsApp Phone Number *
              </label>
              <input
                type="text"
                required
                placeholder="919876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Email Address (Optional)
              </label>
              <input
                type="email"
                placeholder="client@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-2">
              Statutory Services Required (Select all that apply)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SERVICES_LIST.map((svc) => {
                const isChecked = selectedServices.includes(svc);
                return (
                  <button
                    key={svc}
                    type="button"
                    onClick={() => toggleService(svc)}
                    className={`px-3 py-2 rounded-xl text-left font-medium border transition-all flex items-center justify-between ${
                      isChecked
                        ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-500/50 text-indigo-700 dark:text-indigo-300 font-semibold shadow-xs'
                        : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <span className="truncate pr-1">{svc}</span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      readOnly
                      className="rounded text-indigo-600 shrink-0"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 text-[11px] text-indigo-700 dark:text-indigo-300 flex items-center space-x-2">
            <span className="text-base shrink-0">🤖</span>
            <span>Registration automatically schedules statutory deadlines in your Compliance Calendar and delivers a formal WhatsApp Engagement Letter!</span>
          </div>

          <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Registering...' : '✓ Onboard Client Entity'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
