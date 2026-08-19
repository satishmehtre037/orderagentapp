'use client';

import React, { useState, useEffect } from 'react';
import { Users, Flame, CheckCircle2, Clock, Search, Filter, RefreshCw, Send, MessageSquare, FileText, ChevronRight } from 'lucide-react';
import type { CALead, CALeadScore, CALeadStatus } from '@/types';

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

  // Proposal / Quotation Modal State
  const [quoteModalLead, setQuoteModalLead] = useState<CALead | null>(null);
  const [quoteFee, setQuoteFee] = useState('15000');
  const [quoteScope, setQuoteScope] = useState('');
  const [isSendingQuote, setIsSendingQuote] = useState(false);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const bizParam = businessId ? `?businessId=${encodeURIComponent(businessId)}` : '';
      const res = await fetch(`/api/ca/leads${bizParam}`);
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
  }, [businessId]);

  const handleConvertLeadToClient = async (lead: CALead) => {
    try {
      const res = await fetch('/api/ca/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId,
          client_name: lead.name,
          phone: lead.phone,
          email: lead.email,
          entity_type: lead.business_type || 'Private Limited',
          partner_assigned: 'Senior CA Partner',
          status: 'Active',
        }),
      });

      if (res.ok) {
        // Also update lead status to Converted in ca_leads
        await fetch('/api/ca/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: lead.id,
            status: 'Converted',
          }),
        });

        setActionMessage(`🎉 ${lead.name} onboarded as an official CA Client!`);
        setTimeout(() => setActionMessage(null), 5000);
        fetchLeads();
      }
    } catch (err) {
      console.error('Error converting lead:', err);
    }
  };

  const handleOpenQuoteModal = (lead: CALead) => {
    setQuoteModalLead(lead);
    setQuoteFee('15000');
    setQuoteScope(
      `1. Comprehensive ${lead.requirement || 'GST & Corporate Tax'} Advisory\n` +
      `2. Verification of books, ledger reconciliations, and input tax credit (ITC)\n` +
      `3. Timely statutory e-filing with official ARN acknowledgement receipt\n` +
      `4. 24/7 Priority WhatsApp query support with assigned Senior Partner`
    );
  };

  const handleSendQuotationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteModalLead) return;

    setIsSendingQuote(true);
    try {
      const res = await fetch('/api/ca/leads/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: quoteModalLead.id,
          phone: quoteModalLead.phone,
          client_name: quoteModalLead.name,
          requirement: quoteModalLead.requirement,
          fee: quoteFee,
          scope: quoteScope,
          firm_name: businessName || 'Apex Tax & Financial Advisors',
        }),
      });

      if (res.ok) {
        setActionMessage(`🚀 Official CA Fee Quotation & Roadmap sent to ${quoteModalLead.name} on WhatsApp!`);
        setTimeout(() => setActionMessage(null), 5000);
        setQuoteModalLead(null);
        fetchLeads();
      }
    } catch (err) {
      console.error('Quotation dispatch error:', err);
    } finally {
      setIsSendingQuote(false);
    }
  };

  const getScoreBadge = (score?: CALeadScore) => {
    if (score === 'Hot') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 animate-pulse">
          <Flame className="w-3 h-3 fill-rose-500" /> Hot Lead
        </span>
      );
    } else if (score === 'Warm') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
          Warm
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
          Cold
        </span>
      );
    }
  };

  const getStatusBadge = (status: CALeadStatus) => {
    switch (status) {
      case 'New':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50">New Lead</span>;
      case 'Qualifying':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50">AI Qualifying</span>;
      case 'In-Progress':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">In Discussion</span>;
      case 'Converted':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">Converted Client</span>;
      case 'Cold-Closed':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">Closed / Lost</span>;
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
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-slate-950 dark:via-indigo-950/80 dark:to-slate-950 text-white p-6 rounded-2xl shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm font-medium rounded-xl flex items-center justify-between shadow-sm">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-emerald-600 dark:text-emerald-400 hover:underline text-xs font-bold">Dismiss</button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">🔥 Hot High-Intent Leads</p>
            <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{hotCount}</h3>
          </div>
          <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/40 rounded-2xl flex items-center justify-center text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/60">
            <Flame className="w-6 h-6 fill-rose-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Pipeline</p>
            <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{inProgressCount}</h3>
          </div>
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Converted Clients</p>
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{convertedCount}</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/60">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 transition-colors">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search prospect, phone, or service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={scoreFilter}
            onChange={(e) => setScoreFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="All">All Scores</option>
            <option value="Hot">🔥 Hot</option>
            <option value="Warm">Warm</option>
            <option value="Cold">Cold</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="New">New</option>
            <option value="Qualifying">Qualifying</option>
            <option value="In-Progress">In Discussion</option>
            <option value="Converted">Converted</option>
            <option value="Cold-Closed">Closed / Lost</option>
          </select>
        </div>
      </div>

      {/* Lead Pipeline Table */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        {loading ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />
            <p className="text-sm">Loading lead pipeline...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-slate-700 dark:text-slate-200">No leads found</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
              Incoming WhatsApp inquiries from unknown numbers and website submissions will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-950/60 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Prospect Name</th>
                  <th className="py-3.5 px-4">Service Needed</th>
                  <th className="py-3.5 px-4">AI Score / Urgency</th>
                  <th className="py-3.5 px-4">Pipeline Status</th>
                  <th className="py-3.5 px-4">Follow-ups</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm text-slate-700 dark:text-slate-200">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                      <div>{lead.name}</div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 font-normal">{lead.phone || lead.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{lead.requirement || 'General Inquiry'}</div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">{lead.business_type || 'Unspecified Entity'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {getScoreBadge(lead.qualification_score)}
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">({lead.urgency})</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(lead.status)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                      <div>{lead.followup_attempts || 0} attempts</div>
                      {lead.followup_date && (
                        <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
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
                            className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition"
                            title="Open Direct WhatsApp Chat"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </a>
                        )}

                        <button
                          onClick={() => handleOpenQuoteModal(lead)}
                          title="Draft & Send Senior CA Fee Quotation & Roadmap on WhatsApp"
                          className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800/60 rounded-lg transition flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" /> Quote
                        </button>

                        <button
                          onClick={() => handleConvertLeadToClient(lead)}
                          title="Onboard Prospect as Official CA Client in Directory"
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                            lead.status === 'Converted'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800/60'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                          }`}
                        >
                          {lead.status === 'Converted' ? 'Onboarded ✓' : 'Onboard Client'}
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

      {/* Senior CA Quotation & Roadmap Modal */}
      {quoteModalLead && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Send CA Quotation & Roadmap</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  To: <b>{quoteModalLead.name}</b> ({quoteModalLead.phone}) • {quoteModalLead.business_type || 'Entity'}
                </p>
              </div>
              <button
                onClick={() => setQuoteModalLead(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendQuotationSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Professional Fee Quotation (₹):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    value={quoteFee}
                    onChange={(e) => setQuoteFee(e.target.value)}
                    placeholder="15000"
                    required
                    className="w-full pl-8 pr-4 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Scope of Services & Engagement Deliverables:
                </label>
                <textarea
                  rows={4}
                  value={quoteScope}
                  onChange={(e) => setQuoteScope(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-xs text-indigo-800 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/60">
                🚀 <b>WhatsApp Dispatch:</b> Clicking &quot;Dispatch Quotation&quot; will immediately format a formal proposal and send it directly to <b>{quoteModalLead.name}</b> on WhatsApp with accept/confirm instructions.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setQuoteModalLead(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingQuote}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5 text-xs disabled:opacity-50"
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
