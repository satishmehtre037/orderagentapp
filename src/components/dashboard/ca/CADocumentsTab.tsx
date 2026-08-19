'use client';

import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle2, Clock, Plus, Search, Filter, RefreshCw, Send, ExternalLink, XCircle, Trash2 } from 'lucide-react';
import type { CADocumentTracker, CADocStatus } from '@/types';

interface CADocumentsTabProps {
  businessId?: string;
  businessName?: string;
}

export default function CADocumentsTab({ businessId, businessName }: CADocumentsTabProps) {
  const [documents, setDocuments] = useState<CADocumentTracker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Form State for Requesting Documents
  const [formClientId, setFormClientId] = useState('');
  const [formComplianceType, setFormComplianceType] = useState('GST-3B');
  const [docListInputs, setDocListInputs] = useState<string[]>([
    'Bank Statement (Last 6 Months)',
    'Purchase Invoices & Bills',
    'Form 26AS / AIS',
  ]);
  const [clients, setClients] = useState<Array<{ id: string; client_name: string; phone: string }>>([]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ca/documents');
      const data = await res.json();
      if (data.documents) {
        setDocuments(data.documents);
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/ca/clients');
      const data = await res.json();
      if (data.clients) {
        setClients(data.clients);
        if (data.clients.length > 0 && !formClientId) {
          setFormClientId(data.clients[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchClients();
  }, []);

  const handleAddDocInput = () => {
    setDocListInputs([...docListInputs, '']);
  };

  const handleRemoveDocInput = (idx: number) => {
    setDocListInputs(docListInputs.filter((_, i) => i !== idx));
  };

  const handleDocInputChange = (idx: number, val: string) => {
    const next = [...docListInputs];
    next[idx] = val;
    setDocListInputs(next);
  };

  const handleSendDocRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const validDocs = docListInputs.filter((d) => d.trim().length > 0);
    if (!formClientId || validDocs.length === 0) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/ca/request-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId,
          client_id: formClientId,
          compliance_type: formComplianceType,
          documents: validDocs,
          firm_name: businessName,
        }),
      });

      if (res.ok) {
        setIsRequestModalOpen(false);
        setActionMessage(`🚀 Document checklist dispatched via WhatsApp for ${validDocs.length} items!`);
        setTimeout(() => setActionMessage(null), 5000);
        fetchDocuments();
      }
    } catch (err) {
      console.error('Error sending doc request:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (docId: string, newStatus: CADocStatus) => {
    try {
      const res = await fetch('/api/ca/documents/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doc_id: docId, status: newStatus }),
      });

      if (res.ok) {
        setActionMessage(`✅ Document marked as ${newStatus}!`);
        setTimeout(() => setActionMessage(null), 4000);
        fetchDocuments();
      }
    } catch (err) {
      console.error('Status update error:', err);
    }
  };

  const getStatusBadge = (status: CADocStatus) => {
    if (status === 'Verified') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3" /> Verified
        </span>
      );
    } else if (status === 'Received') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
          <FileText className="w-3 h-3" /> Received (Pending Review)
        </span>
      );
    } else if (status === 'Rejected') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3 h-3" /> Rejected
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3" /> Requested (Pending)
        </span>
      );
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.compliance_type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = documents.filter((d) => d.status === 'Pending').length;
  const receivedCount = documents.filter((d) => d.status === 'Received').length;
  const verifiedCount = documents.filter((d) => d.status === 'Verified').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" /> Document Tracker & Media Inbox
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Client Document Inbox</h2>
          <p className="text-slate-300 text-sm mt-0.5">
            Auto-matches inbound WhatsApp PDF uploads, statement receipts, and 3-day chasing reminders.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDocuments}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-xl transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={() => setIsRequestModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl shadow transition"
          >
            <Plus className="w-4 h-4" /> Request Documents
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
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Awaiting Client Upload</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</h3>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-100">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Received (Need Review)</p>
            <h3 className="text-2xl font-bold text-blue-600 mt-1">{receivedCount}</h3>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Verified Documents</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{verifiedCount}</h3>
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
            placeholder="Search client, document, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending (Requested)</option>
          <option value="Received">Received</option>
          <option value="Verified">Verified</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Document List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />
            <p className="text-sm">Loading document tracker...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-slate-700">No document records found</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Request documents from clients to track pending uploads and auto-chasing reminders.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Client Name</th>
                  <th className="py-3.5 px-4">Document Requested</th>
                  <th className="py-3.5 px-4">Compliance Area</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Requested / Received</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      <div>{doc.client_name}</div>
                      <div className="text-xs text-slate-400 font-normal">{doc.phone}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-slate-400" />
                        {doc.document_name}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {doc.compliance_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(doc.status)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      <div>Req: {new Date(doc.requested_date).toLocaleDateString('en-IN')}</div>
                      {doc.received_date && (
                        <div className="text-emerald-600 font-semibold text-[11px]">
                          Rec: {new Date(doc.received_date).toLocaleDateString('en-IN')}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {doc.storage_url && (
                          <a
                            href={doc.storage_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition"
                            title="View / Download Document"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}

                        {doc.status === 'Received' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(doc.id, 'Verified')}
                              className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
                            >
                              Verify
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(doc.id, 'Rejected')}
                              className="px-2.5 py-1 text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg transition"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {doc.status === 'Pending' && (
                          <span className="text-xs text-slate-400 font-mono">
                            {doc.followup_count || 0} nudges sent
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Request Documents Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Request Client Documents</h3>
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendDocRequest} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Select Client *</label>
                {clients.length > 0 ? (
                  <select
                    value={formClientId}
                    onChange={(e) => setFormClientId(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.client_name} ({c.phone})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="Enter Client ID or Phone"
                    value={formClientId}
                    onChange={(e) => setFormClientId(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Compliance Area *</label>
                <select
                  value={formComplianceType}
                  onChange={(e) => setFormComplianceType(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="GST-3B">GST-3B Filing</option>
                  <option value="GST-GSTR1">GST-GSTR1 Filing</option>
                  <option value="ITR-Individual">Income Tax Return (ITR)</option>
                  <option value="ITR-Corporate">Corporate Tax Audit</option>
                  <option value="TDS-Return">TDS Return</option>
                  <option value="ROC-Annual">ROC Annual Compliance</option>
                  <option value="General">General Documentation</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-600">Document Checklist Items *</label>
                  <button
                    type="button"
                    onClick={handleAddDocInput}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    + Add Item
                  </button>
                </div>
                <div className="space-y-2">
                  {docListInputs.map((doc, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        placeholder={`e.g. Bank Statement #${idx + 1}`}
                        value={doc}
                        onChange={(e) => handleDocInputChange(idx, e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      {docListInputs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveDocInput(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-indigo-50 rounded-xl text-xs text-indigo-800 border border-indigo-100">
                💡 <b>AI Automation:</b> Submitting this will automatically draft a polite WhatsApp checklist message and send it directly to the client&apos;s phone.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submitting ? 'Dispatching...' : 'Dispatch Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
