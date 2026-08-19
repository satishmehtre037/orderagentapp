'use client';

import React, { useState, useEffect } from 'react';
import { Users, Flame, Clock, CheckCircle2, MessageSquare, Search, Filter, RefreshCw, Phone, ArrowUpRight, FileText, Send, DollarSign, Trash2 } from 'lucide-react';
import type { CALead, CALeadScore, CALeadStatus, CALeadUrgency } from '@/types';

interface CALeadsTabProps {
  businessId?: string;
  businessName?: string;
}

export default function CALeadsTab({ businessId, businessName }: CALeadsTabProps) {
  const [leads, setLeads] = useState<CALead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [scoreFilter, setScoreFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Proposal & Quotation Modal State
  const [quoteModalLead, setQuoteModalLead] = useState<CALead | null>(null);
  const [quoteFee, setQuoteFee] = useState<string>('15000');
  const [quoteScope, setQuoteScope] = useState<string>('');
  const [isSendingQuote, setIsSendingQuote] = useState<boolean>(false);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ca/leads');
      const data = await res.json();
      if (data.leads) {
        setLeads(data.leads);
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleUpdateStatus = async (leadId: string, newStatus: CALeadStatus) => {
    try {
      const res = await fetch('/api/ca/leads/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, status: newStatus }),
      });

      if (res.ok) {
        setActionMessage(`✅ Lead marked as ${newStatus}!`);
        setTimeout(() => setActionMessage(null), 4000);
        fetchLeads();
      }
    } catch (err) {
      console.error('Lead update error:', err);
    }
  };

  const handleConvertLeadToClient = async (lead: CALead) => {
    try {
      // 1. Create client profile
      const res = await fetch('/api/ca/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId,
          client_name: lead.name,
          phone: lead.phone,
          email: lead.email,
          entity_type: lead.business_type || 'Proprietorship',
        }),
      });

      // 2. Mark lead converted
      await handleUpdateStatus(lead.id, 'Converted');
      setActionMessage(`🎉 "${lead.name}" onboarded as official Client and added to Directory & Tax Calendar!`);
      setTimeout(() => setActionMessage(null), 5000);
      fetchLeads();
    } catch (err) {
      console.error('Convert lead error:', err);
    }
  };

  const handleOpenQuoteModal = (lead: CALead) => {
    setQuoteModalLead(lead);
    setQuoteFee('15000');
    setQuoteScope(`• ${lead.requirement || 'Compliance & Advisory Services'}
• Verification of Financials & Portal Filing
• Dedicated Senior CA Review & Support`);
  };

  const handleSendQuotationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteModalLead || !quoteModalLead.phone) return;

    setIsSendingQuote(true);
    try {
      const res = await fetch('/api/ca/leads/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: quoteModalLead.id,
          phone: quoteModalLead.phone,
          client_name: quoteModalLead.name,
          fee_amount: quoteFee,
          service: quoteModalLead.requirement,
          firm_name: businessName,
          quotation_text: `📋 *Official Engagement Roadmap & Fee Quotation*
From: *${businessName || 'Apex Tax & Financial Advisors'}*

Dear *${quoteModalLead.name}*,
Thank you for discussing your requirements with our firm for *${quoteModalLead.requirement || 'Corporate Compliance & Tax Services'}*.

💼 *Scope of Work & Deliverables:*
${quoteScope}

💰 *Agreed Professional Fee:* *₹${Number(quoteFee).toLocaleString('en-IN')} (all-inclusive)*

To confirm engagement and initiate onboarding, please reply *"CONFIRM"* or *"PROCEED"* to this chat.

Best regards,
*Senior Partner | ${businessName || 'Apex Tax & Financial Advisors'}*`,
        }),
      });

      if (res.ok) {
        setActionMessage(`🚀 Official quotation of ₹${Number(quoteFee).toLocaleString('en-IN')} dispatched to ${quoteModalLead.name}'s WhatsApp!`);
        setTimeout(() => setActionMessage(null), 5000);
        setQuoteModalLead(null);
        fetchLeads();
      }
    } catch (err) {
      console.error('Quotation error:', err);
    } finally {
      setIsSendingQuote(false);
    }
  };

  const getScoreBadge = (score: CALeadScore) => {
    if (score === 'Hot') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <Flame className="w-3.5 h-3.5 fill-rose-500 text-rose-500" /> Hot Lead
        </span>
      );
    } else if (score === 'Warm') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          Warm
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
          Cold
        </span>
      );
    }
  };

  const getStatusBadge = (status: CALeadStatus) => {
    switch (status) {
      case 'Converted':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Converted</span>;
      case 'Hot':
      case 'In-Progress':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">In-Progress</span>;
      case 'Cold-Closed':
      case 'Lost':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">Closed</span>;
      case 'Qualifying':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">AI Qualifying</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">New Lead</span>;
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.phone && lead.phone.includes(searchQuery)) ||
      (lead.requirement && lead.requirement.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesScore = scoreFilter === 'All' || lead.qualification_score === scoreFilter;
    const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;

    return matchesSearch && matchesScore && matchesStatus;
  });

  const hotCount = leads.filter((l) => l.qualification_score === 'Hot').length;
  const inProgressCount = leads.filter((l) => l.status === 'In-Progress' || l.status === 'Qualifying' || l.status === 'New').length;
  const convertedCount = leads.filter((l) => l.status === 'Converted').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" /> Lead Intake & Qualification CRM
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">CA Lead Pipeline</h2>
          <p className="text-slate-300 text-sm mt-0.5">
            Auto-qualifies WhatsApp & Website inquiries, scores intent (Hot/Warm/Cold), and dispatches custom CA quotations.
          </p>
        </div>
        <button
          onClick={fetchLeads}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-xl transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
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
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">🔥 Hot High-Intent Leads</p>
            <h3 className="text-2xl font-bold text-rose-600 mt-1">{hotCount}</h3>
          </div>
          <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 border border-rose-100">
            <Flame className="w-6 h-6 fill-rose-500" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Pipeline</p>
            <h3 className="text-2xl font-bold text-indigo-600 mt-1">{inProgressCount}</h3>
          </div>
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Converted Clients</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{convertedCount}</h3>
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
            placeholder="Search prospect, phone, or service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={scoreFilter}
            onChange={(e) => setScoreFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="All">All Scores</option>
            <option value="Hot">🔥 Hot</option>
            <option value="Warm">Warm</option>
            <option value="Cold">Cold</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="New">New</option>
            <option value="Qualifying">Qualifying</option>
            <option value="In-Progress">In-Progress</option>
            <option value="Converted">Converted</option>
            <option value="Cold-Closed">Cold-Closed</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />
            <p className="text-sm">Loading lead pipeline...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-slate-700">No leads found</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Incoming WhatsApp inquiries from unknown numbers and website submissions will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Prospect Name</th>
                  <th className="py-3.5 px-4">Service Needed</th>
                  <th className="py-3.5 px-4">AI Score / Urgency</th>
                  <th className="py-3.5 px-4">Pipeline Status</th>
                  <th className="py-3.5 px-4">Follow-ups</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      <div>{lead.name}</div>
                      <div className="text-xs text-slate-400 font-normal">{lead.phone || lead.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 text-xs">{lead.requirement || 'General Inquiry'}</div>
                      <div className="text-[11px] text-slate-400">{lead.business_type || 'Unspecified Entity'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {getScoreBadge(lead.qualification_score)}
                        <span className="text-[11px] text-slate-500 font-medium">({lead.urgency})</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(lead.status)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      <div>{lead.followup_attempts || 0} attempts</div>
                      {lead.followup_date && (
                        <div className="text-[10px] text-indigo-600 font-semibold">
                          Next: {lead.followup_date}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {lead.phone && (
                          <a
                            href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition"
                            title="Open Direct WhatsApp Chat"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </a>
                        )}

                        <button
                          onClick={() => handleOpenQuoteModal(lead)}
                          title="Draft & Send Senior CA Fee Quotation & Roadmap on WhatsApp"
                          className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" /> Quote
                        </button>

                        {lead.status !== 'Converted' && (
                          <button
                            onClick={() => handleConvertLeadToClient(lead)}
                            title="Onboard Prospect as Official CA Client"
                            className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
                          >
                            Onboard
                          </button>
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

      {/* Senior CA Quotation & Roadmap Modal */}
      {quoteModalLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Send CA Quotation & Roadmap</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  To: <b>{quoteModalLead.name}</b> ({quoteModalLead.phone}) • {quoteModalLead.business_type || 'Entity'}
                </p>
              </div>
              <button
                onClick={() => setQuoteModalLead(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendQuotationSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Professional Fee Quotation (₹):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    value={quoteFee}
                    onChange={(e) => setQuoteFee(e.target.value)}
                    placeholder="15000"
                    required
                    className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Scope of Services & Engagement Deliverables:
                </label>
                <textarea
                  rows={4}
                  value={quoteScope}
                  onChange={(e) => setQuoteScope(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="p-3 bg-indigo-50 rounded-xl text-xs text-indigo-800 border border-indigo-100">
                🚀 <b>WhatsApp Dispatch:</b> Clicking &quot;Dispatch Quotation&quot; will immediately format a formal proposal and send it directly to <b>{quoteModalLead.name}</b> on WhatsApp with accept/confirm instructions.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setQuoteModalLead(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingQuote}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow transition flex items-center gap-1.5 text-xs disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSendingQuote ? 'Dispatching...' : 'Dispatch Quotation on WhatsApp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
