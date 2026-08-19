'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, AlertTriangle, Clock, Plus, Search, Filter, Send, RefreshCw, FileText, Trash2, UserX } from 'lucide-react';
import type { CAComplianceRecord, CAComplianceType, CAComplianceStatus } from '@/types';

interface CAComplianceTabProps {
  businessId?: string;
  businessName?: string;
}

export default function CAComplianceTab({ businessId, businessName }: CAComplianceTabProps) {
  const [compliances, setCompliances] = useState<CAComplianceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Form State for Add Compliance
  const [formClientName, setFormClientName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formType, setFormType] = useState<CAComplianceType>('GST-3B');
  const [formDueDate, setFormDueDate] = useState('');

  const fetchCompliances = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ca/compliance');
      const data = await res.json();
      if (data.compliances) {
        setCompliances(data.compliances);
      }
    } catch (err) {
      console.error('Failed to fetch compliances:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCompliance = async (id: string) => {
    if (!confirm('Are you sure you want to delete this compliance record?')) return;
    try {
      const res = await fetch(`/api/ca/compliance?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setActionMessage('🗑️ Compliance record deleted.');
        setTimeout(() => setActionMessage(null), 4000);
        fetchCompliances();
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleDeleteClientComplete = async (clientId?: string, phone?: string, clientName?: string) => {
    if (!confirm(`⚠️ DELETE CLIENT AND ALL DATA?\n\nThis will permanently delete "${clientName || 'this client'}" and ALL their compliance records, uploaded documents, and chat history from the database.`)) {
      return;
    }

    try {
      const params = new URLSearchParams();
      if (clientId) params.set('clientId', clientId);
      if (phone) params.set('phone', phone);

      const res = await fetch(`/api/ca/clients?${params.toString()}`, { method: 'DELETE' });
      if (res.ok) {
        setActionMessage(`🗑️ Client "${clientName || 'Client'}" and all associated data deleted from database.`);
        setTimeout(() => setActionMessage(null), 5000);
        fetchCompliances();
      }
    } catch (err) {
      console.error('Client delete error:', err);
    }
  };

  useEffect(() => {
    fetchCompliances();
  }, []);

  const handleAddCompliance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClientName || !formPhone || !formDueDate) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/ca/compliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId,
          client_name: formClientName,
          phone: formPhone,
          email: formEmail,
          compliance_type: formType,
          due_date: formDueDate,
          status: 'Pending',
        }),
      });

      if (res.ok) {
        setIsAddModalOpen(false);
        setFormClientName('');
        setFormPhone('');
        setFormEmail('');
        setFormDueDate('');
        setActionMessage('✅ Compliance deadline added successfully!');
        setTimeout(() => setActionMessage(null), 4000);
        fetchCompliances();
      }
    } catch (err) {
      console.error('Error adding compliance:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkFiled = async (id: string, clientName: string, type: string) => {
    const ackNum = prompt(`Enter filing acknowledgement / ARN number for ${clientName} (${type}):`, 'ARN-' + Date.now());
    if (ackNum === null) return;

    try {
      const res = await fetch('/api/ca/compliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: 'Filed',
          acknowledgement_number: ackNum,
        }),
      });

      if (res.ok) {
        setActionMessage(`✅ ${clientName} (${type}) marked as FILED!`);
        setTimeout(() => setActionMessage(null), 4000);
        fetchCompliances();
      }
    } catch (err) {
      console.error('Error updating compliance:', err);
    }
  };

  const handleSendReminderNow = async (phone: string, clientName: string, type: string, dueDate: string) => {
    try {
      const res = await fetch('/api/ca/cron/trigger/compliance', { method: 'POST' });
      if (res.ok) {
        setActionMessage(`🚀 Staged WhatsApp reminder triggered for ${clientName}!`);
        setTimeout(() => setActionMessage(null), 4000);
        fetchCompliances();
      }
    } catch (err) {
      console.error('Reminder trigger error:', err);
    }
  };

  const getDaysBadge = (dueDateStr: string, status: string) => {
    if (status === 'Filed') {
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Filed</span>;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const today = new Date(todayStr + 'T00:00:00Z');
    const due = new Date(String(dueDateStr).slice(0, 10) + 'T00:00:00Z');
    const diffDays = Math.round((due.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));

    if (diffDays < 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle className="w-3 h-3" /> Overdue by {Math.abs(diffDays)}d
        </span>
      );
    } else if (diffDays === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
          <Clock className="w-3 h-3" /> Due Today!
        </span>
      );
    } else if (diffDays <= 3) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">
          <Clock className="w-3 h-3" /> Due in {diffDays}d
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <Clock className="w-3 h-3" /> {diffDays} days left
        </span>
      );
    }
  };

  const filteredCompliances = compliances.filter((item) => {
    const matchesSearch =
      item.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.phone.includes(searchQuery) ||
      item.compliance_type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    const matchesType = typeFilter === 'All' || item.compliance_type.toLowerCase().includes(typeFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesType;
  });

  const pendingCount = compliances.filter((c) => c.status === 'Pending').length;
  const overdueCount = compliances.filter((c) => {
    if (c.status === 'Filed') return false;
    const diff = Math.round((new Date(c.due_date).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    return diff < 0;
  }).length;
  const filedCount = compliances.filter((c) => c.status === 'Filed').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4" /> Compliance Management Suite
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Tax & Compliance Calendar</h2>
          <p className="text-slate-300 text-sm mt-0.5">
            Automated GST, ITR, TDS & ROC tracking with 7d, 3d, 1d, and overdue WhatsApp reminders.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchCompliances}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-xl transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl shadow transition"
          >
            <Plus className="w-4 h-4" /> Add Compliance
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium rounded-xl flex items-center justify-between shadow-sm">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-emerald-600 hover:text-emerald-900 text-xs font-bold">Dismiss</button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pending Filings</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{pendingCount}</h3>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-100">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Overdue Alerts</p>
            <h3 className="text-2xl font-bold text-rose-600 mt-1">{overdueCount}</h3>
          </div>
          <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 border border-rose-100">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Successfully Filed</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{filedCount}</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search client, phone, or filing..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="All">All Types</option>
            <option value="GST">GST Returns</option>
            <option value="ITR">Income Tax (ITR)</option>
            <option value="TDS">TDS Returns</option>
            <option value="ROC">ROC / MCA</option>
            <option value="Advance-Tax">Advance Tax</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Filed">Filed</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Compliance List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />
            <p className="text-sm">Loading compliance calendar...</p>
          </div>
        ) : filteredCompliances.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-slate-700">No compliance records found</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Add your first client compliance deadline using the &quot;Add Compliance&quot; button above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Client Name</th>
                  <th className="py-3.5 px-4">Compliance Type</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Countdown / Status</th>
                  <th className="py-3.5 px-4">Reminders</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {filteredCompliances.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      <div>{record.client_name}</div>
                      <div className="text-xs text-slate-400 font-normal">{record.phone}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {record.compliance_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                      {record.due_date}
                    </td>
                    <td className="py-3.5 px-4">
                      {getDaysBadge(record.due_date, record.status)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">{record.reminder_count || 0}</span> sent
                      {record.last_reminder_date && (
                        <div className="text-[10px] text-slate-400">
                          {new Date(record.last_reminder_date).toLocaleDateString('en-IN')}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {record.status !== 'Filed' && (
                          <>
                            <button
                              onClick={() => handleMarkFiled(record.id, record.client_name, record.compliance_type)}
                              className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
                            >
                              Mark Filed
                            </button>
                            <button
                              onClick={() => handleSendReminderNow(record.phone, record.client_name, record.compliance_type, record.due_date)}
                              title="Send WhatsApp reminder immediately"
                              className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {record.status === 'Filed' && record.acknowledgement_number && (
                          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {record.acknowledgement_number}
                          </span>
                        )}

                        <button
                          onClick={() => handleDeleteCompliance(record.id)}
                          title="Delete this compliance record"
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteClientComplete(record.client_id, record.phone, record.client_name)}
                          title={`Permanently delete client "${record.client_name}" and ALL records`}
                          className="p-1 text-slate-400 hover:text-rose-700 hover:bg-rose-100 rounded-lg transition"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Compliance Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Add New Compliance Deadline</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCompliance} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Client Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Enterprises / Rajesh Kumar"
                  value={formClientName}
                  onChange={(e) => setFormClientName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Phone (WhatsApp) *</label>
                  <input
                    type="text"
                    required
                    placeholder="919876543210"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="client@domain.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Compliance Type *</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as CAComplianceType)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="GST-3B">GST-3B (Monthly/Quarterly)</option>
                    <option value="GST-GSTR1">GST-GSTR1</option>
                    <option value="ITR-Individual">ITR - Individual</option>
                    <option value="ITR-Corporate">ITR - Corporate / Audit</option>
                    <option value="TDS-Return">TDS Return Filing</option>
                    <option value="ROC-Annual">ROC Annual Compliance</option>
                    <option value="Advance-Tax">Advance Tax Installment</option>
                    <option value="General">Other / General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Filing Due Date *</label>
                  <input
                    type="date"
                    required
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Add Deadline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
