'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  IndianRupee,
  AlertCircle,
  TrendingUp,
  Bot,
  Send,
  FileCheck,
  CheckCircle2,
  Calendar,
  Sparkles,
  Search,
  ExternalLink,
  ChevronRight,
  UserPlus,
  RefreshCw,
  FileText,
} from 'lucide-react';
import type { CAComplianceRecord, CADocumentTracker, CALead, CAClient, DashboardTab } from '@/types';

interface CADashboardOverviewTabProps {
  businessId?: string;
  businessName?: string;
  onNavigateTab: (tab: DashboardTab) => void;
  onOpenNewClientModal: () => void;
}

export default function CADashboardOverviewTab({
  businessId,
  businessName = 'Sharma & Associates',
  onNavigateTab,
  onOpenNewClientModal,
}: CADashboardOverviewTabProps) {
  const [clients, setClients] = useState<CAClient[]>([]);
  const [deadlines, setDeadlines] = useState<CAComplianceRecord[]>([]);
  const [docs, setDocs] = useState<CADocumentTracker[]>([]);
  const [leads, setLeads] = useState<CALead[]>([]);
  const [totalBilled, setTotalBilled] = useState(0);
  const [totalCollected, setTotalCollected] = useState(0);
  const [totalOutstanding, setTotalOutstanding] = useState(0);

  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadRealData = async () => {
    try {
      setLoading(true);
      const bizParam = businessId ? `?businessId=${encodeURIComponent(businessId)}` : '';

      // Parallel fetch from all live database endpoints
      const [clientsRes, complianceRes, docsRes, leadsRes, invoicesRes] = await Promise.all([
        fetch(`/api/ca/clients${bizParam}`),
        fetch(`/api/ca/compliance${bizParam}`),
        fetch(`/api/ca/documents${bizParam}`),
        fetch(`/api/ca/leads${bizParam}`),
        fetch(`/api/ca/invoices${bizParam}`),
      ]);

      const [cData, compData, dData, lData, invData] = await Promise.all([
        clientsRes.json(),
        complianceRes.json(),
        docsRes.json(),
        leadsRes.json(),
        invoicesRes.json(),
      ]);

      if (cData.clients) setClients(cData.clients);
      if (compData.compliances) setDeadlines(compData.compliances);
      if (dData.documents) setDocs(dData.documents);
      if (lData.leads) setLeads(lData.leads);

      if (invData) {
        setTotalBilled(invData.totalBilled || 0);
        setTotalCollected(invData.totalCollected || 0);
        setTotalOutstanding(invData.totalOutstanding || 0);
      }
    } catch (err) {
      console.error('Error loading live dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRealData();
  }, [businessId]);

  const handleQuickRemind = async (clientName: string, phone: string, docName: string) => {
    try {
      setActionMessage(`🚀 Dispatching WhatsApp document reminder to ${clientName}...`);
      await fetch('/api/ca/request-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId,
          client_name: clientName,
          phone: phone,
          documents: [docName],
          firm_name: businessName,
        }),
      });
      setActionMessage(`✅ WhatsApp reminder sent to ${clientName} for ${docName}!`);
      setTimeout(() => setActionMessage(null), 4000);
    } catch (e) {
      console.error('Error dispatching reminder:', e);
    }
  };

  const pendingDeadlines = deadlines.filter((d) => d.status !== 'Filed');
  const urgentDeadlines = pendingDeadlines.filter((d) => {
    const diff = new Date(d.due_date).getTime() - Date.now();
    return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000;
  });

  const activeLeadsCount = leads.filter((l) => l.status !== 'Converted' && l.status !== 'Lost').length;
  const verifiedDocsCount = docs.filter((d) => d.status === 'Verified' || d.status === 'Received').length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Notification Toast */}
      {actionMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-2xl flex items-center space-x-2 animate-in fade-in slide-in-from-top-1 duration-200 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Top Stats Grid (4 Cards) with Real DB Data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Clients */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 relative overflow-hidden shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Clients</span>
            <div className="p-2.5 bg-teal-500/10 text-teal-400 rounded-2xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black font-mono text-white tracking-tight">{clients.length}</div>
            <div className="text-xs font-medium text-emerald-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{clients.length > 0 ? `${clients.length} Active in Database` : 'Ready to add clients'}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Pending Deadlines */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 relative overflow-hidden shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Deadlines</span>
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-2xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black font-mono text-white tracking-tight">{pendingDeadlines.length}</div>
            <div className="text-xs font-medium text-rose-400 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{urgentDeadlines.length} urgent (&lt;7 days)</span>
            </div>
          </div>
        </div>

        {/* Card 3: Fees Collected */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 relative overflow-hidden shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Fees Collected</span>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-2xl">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black font-mono text-emerald-400 tracking-tight">
              ₹{totalCollected.toLocaleString('en-IN')}
            </div>
            <div className="text-xs font-medium text-emerald-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Verified Collections</span>
            </div>
          </div>
        </div>

        {/* Card 4: Outstanding Fees */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 relative overflow-hidden shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Fees</span>
            <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-2xl">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black font-mono text-rose-400 tracking-tight">
              ₹{totalOutstanding.toLocaleString('en-IN')}
            </div>
            <div className="text-xs font-medium text-rose-400 mt-1 flex items-center gap-1">
              <span>Outstanding balance</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upcoming Compliance Deadlines (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2.5">
              <span className="text-lg">🔥</span>
              <div>
                <h3 className="text-sm font-bold text-white">Upcoming Statutory Deadlines</h3>
                <p className="text-xs text-slate-400">Live compliance filing ledger from database</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('ca_compliance')}
              className="text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1 hover:underline"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-800/80">
            {deadlines.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 space-y-2">
                <Calendar className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
                <p>No statutory compliance deadlines added yet.</p>
                <button
                  onClick={() => onNavigateTab('ca_compliance')}
                  className="text-xs text-teal-400 font-semibold underline hover:text-teal-300"
                >
                  + Add First Compliance Deadline
                </button>
              </div>
            ) : (
              deadlines.slice(0, 5).map((d) => {
                const diffDays = Math.ceil(
                  (new Date(d.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                );
                const isUrgent = diffDays <= 7 && d.status !== 'Filed';

                return (
                  <div key={d.id} className="py-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          d.status === 'Filed'
                            ? 'bg-emerald-500'
                            : isUrgent
                            ? 'bg-rose-500'
                            : 'bg-amber-500'
                        }`}
                      ></div>
                      <div>
                        <div className="text-xs font-bold text-white">
                          {d.compliance_type} • {d.client_name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          📱 {d.phone} • {d.status === 'Filed' ? 'Filed on Portal' : 'Pending Filing'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-xs font-bold font-mono ${
                          d.status === 'Filed'
                            ? 'text-emerald-400'
                            : isUrgent
                            ? 'text-rose-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {d.due_date}
                      </div>
                      <div
                        className={`text-[10px] font-semibold ${
                          d.status === 'Filed'
                            ? 'text-emerald-400'
                            : isUrgent
                            ? 'text-rose-500'
                            : 'text-slate-400'
                        }`}
                      >
                        {d.status === 'Filed'
                          ? 'Completed ✓'
                          : diffDays <= 0
                          ? 'Overdue!'
                          : `${diffDays} days left`}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: AI Activity & Lead Pipeline (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: AI Agent Activity */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🤖</span>
                <h3 className="text-sm font-bold text-white">AI Agent Practice Metrics</h3>
              </div>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Active 24/7
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <span className="text-slate-400">Registered CA Clients</span>
                <span className="font-bold text-teal-400 font-mono text-sm">{clients.length}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <span className="text-slate-400">Documents Tracked & Verified</span>
                <span className="font-bold text-emerald-400 font-mono text-sm">{docs.length}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <span className="text-slate-400">Active Leads in Pipeline</span>
                <span className="font-bold text-indigo-400 font-mono text-sm">{activeLeadsCount}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-950/30 border border-emerald-900/50">
                <span className="text-emerald-300 font-medium">Fees Collected</span>
                <span className="font-bold text-emerald-400 font-mono text-sm">
                  ₹{totalCollected.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Lead Pipeline Mini Widget */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-lg">📊</span>
                <h3 className="text-sm font-bold text-white">Lead Pipeline</h3>
              </div>
              <button
                onClick={() => onNavigateTab('ca_leads')}
                className="text-xs text-teal-400 hover:text-teal-300 font-semibold hover:underline"
              >
                Open CRM →
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-center">
                <div className="text-2xl font-bold font-mono text-teal-400">{activeLeadsCount}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Active Prospects</div>
              </div>
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-center">
                <div className="text-2xl font-bold font-mono text-emerald-400">
                  ₹{(activeLeadsCount * 15000).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Estimated Pipeline</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Card: Recent Client Activity Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <span className="text-lg">👥</span>
            <div>
              <h3 className="text-sm font-bold text-white">Live Client Directory & Activity</h3>
              <p className="text-xs text-slate-400">Directly connected to your live Supabase ca_clients database</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenNewClientModal}
              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center space-x-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ New Client</span>
            </button>
            <button
              onClick={() => onNavigateTab('ca_documents')}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
            >
              View Document Hub →
            </button>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          {clients.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 space-y-3">
              <Users className="w-10 h-10 mx-auto text-slate-600 opacity-60" />
              <p className="text-sm font-medium text-slate-400">No clients registered yet in your CA directory.</p>
              <button
                onClick={onOpenNewClientModal}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow"
              >
                + Add Your First Client Now
              </button>
            </div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Client Name</th>
                  <th className="px-4 py-3">Entity Type</th>
                  <th className="px-4 py-3">Phone (WhatsApp)</th>
                  <th className="px-4 py-3">Services Required</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {clients.map((client) => {
                  const matchingDoc = docs.find((d) => d.client_id === client.id || d.phone === client.phone);
                  const isPendingDoc = matchingDoc && matchingDoc.status === 'Pending';

                  return (
                    <tr key={client.id} className="hover:bg-slate-800/30 transition">
                      <td className="px-4 py-3">
                        <div className="font-bold text-white">{client.client_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {client.pan_gstin || 'Registered Client'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-lg text-[10px] font-semibold">
                          {client.entity_type || 'Private Limited'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-mono">{client.phone}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {(client.notes || 'GST, ITR, ROC')
                            .replace('Registered via CRM Dashboard. Services: ', '')
                            .split(',')
                            .map((svc, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-teal-500/10 text-teal-300 border border-teal-500/30 rounded-lg text-[10px] font-semibold"
                              >
                                {svc.trim()}
                              </span>
                            ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-semibold">
                          ✓ {client.status || 'Active'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center space-x-1.5">
                          {isPendingDoc && matchingDoc ? (
                            <button
                              onClick={() => handleQuickRemind(client.client_name, client.phone, matchingDoc.document_name)}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition shadow-xs inline-flex items-center gap-1"
                            >
                              <Send className="w-3 h-3" />
                              <span>Remind</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => onNavigateTab('ca_documents')}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg transition border border-slate-700 inline-flex items-center gap-1"
                            >
                              <span>Docs Hub</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
