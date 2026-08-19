'use client';

import React, { useState, useEffect } from 'react';
import { Users, Flame, Clock, CheckCircle2, MessageSquare, Search, Filter, RefreshCw, Phone, ArrowUpRight } from 'lucide-react';
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
            Auto-qualifies WhatsApp & Website inquiries, scores intent (Hot/Warm/Cold), and manages 3-day follow-ups.
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
                      <div className="flex items-center justify-end gap-2">
                        {lead.phone && (
                          <a
                            href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition flex items-center gap-1 text-xs font-semibold"
                            title="Chat on WhatsApp"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </a>
                        )}

                        {lead.status !== 'Converted' && (
                          <button
                            onClick={() => handleUpdateStatus(lead.id, 'Converted')}
                            className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
                          >
                            Convert
                          </button>
                        )}

                        {lead.status === 'New' && (
                          <button
                            onClick={() => handleUpdateStatus(lead.id, 'In-Progress')}
                            className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition"
                          >
                            Take Up
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
    </div>
  );
}
