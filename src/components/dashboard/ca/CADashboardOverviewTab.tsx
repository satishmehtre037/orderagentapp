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
} from 'lucide-react';
import type { CAComplianceRecord, CADocumentTracker, CALead, DashboardTab } from '@/types';

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
  const [clientsCount, setClientsCount] = useState(247);
  const [deadlinesCount, setDeadlinesCount] = useState(18);
  const [feesCollected, setFeesCollected] = useState('₹8.4L');
  const [pendingFees, setPendingFees] = useState('₹2.1L');
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const [recentClients, setRecentClients] = useState([
    {
      id: '1',
      name: 'Mehta Textiles Pvt Ltd',
      gstin: '23AABCM1234F1Z5',
      phone: '919876543210',
      services: ['GST', 'TDS'],
      lastActivity: '2 hours ago',
      pendingDoc: 'Bank Stmt',
      status: 'Active',
    },
    {
      id: '2',
      name: 'Priya Sharma (Individual)',
      gstin: 'PAN: ABCPS1234D',
      phone: '919876543211',
      services: ['ITR'],
      lastActivity: 'Yesterday',
      pendingDoc: 'Form 16',
      status: 'Doc Pending',
    },
    {
      id: '3',
      name: 'Gupta Hardware Store',
      gstin: '23AACPG5678K1Z2',
      phone: '919876543212',
      services: ['GST', 'Bookkeeping'],
      lastActivity: '3 days ago',
      pendingDoc: null,
      status: 'Active',
    },
    {
      id: '4',
      name: 'Kumar Constructions',
      gstin: '23AACKC9012J1Z8',
      phone: '919876543213',
      services: ['GST', 'ROC', 'Audit'],
      lastActivity: '1 week ago',
      pendingDoc: 'P&L Statement',
      status: 'Overdue',
    },
    {
      id: '5',
      name: 'Satish',
      gstin: '918779841346',
      phone: '918779841346',
      services: ['ROC', 'ITR'],
      lastActivity: 'Just now',
      pendingDoc: 'Audited Financials',
      status: 'Active',
    },
  ]);

  const handleQuickRemind = (clientName: string, phone: string, doc: string | null) => {
    setActionMessage(`🚀 Dispatched automated WhatsApp reminder to ${clientName}!`);
    setTimeout(() => setActionMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Notification Toast */}
      {actionMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-2xl flex items-center space-x-2 animate-in fade-in slide-in-from-top-1 duration-200 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Top Stats Grid (4 Cards) */}
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
            <div className="text-3xl font-black font-mono text-white tracking-tight">{clientsCount}</div>
            <div className="text-xs font-medium text-emerald-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>↑ 12 this month</span>
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
            <div className="text-3xl font-black font-mono text-white tracking-tight">{deadlinesCount}</div>
            <div className="text-xs font-medium text-rose-400 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>3 urgent (&lt;7 days)</span>
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
            <div className="text-3xl font-black font-mono text-emerald-400 tracking-tight">{feesCollected}</div>
            <div className="text-xs font-medium text-emerald-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>↑ 23% vs last month</span>
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
            <div className="text-3xl font-black font-mono text-rose-400 tracking-tight">{pendingFees}</div>
            <div className="text-xs font-medium text-rose-400 mt-1 flex items-center gap-1">
              <span>4 clients overdue</span>
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
                <p className="text-xs text-slate-400">Track filing dates with auto-reminders</p>
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
            {/* Item 1 */}
            <div className="py-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></div>
                <div>
                  <div className="text-xs font-bold text-white">GSTR-3B Monthly Filing</div>
                  <div className="text-[11px] text-slate-400">14 clients pending • GST Department</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-rose-400 font-mono">20 Aug 2026</div>
                <div className="text-[10px] text-rose-500 font-semibold">2 days left!</div>
              </div>
            </div>

            {/* Item 2 */}
            <div className="py-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></div>
                <div>
                  <div className="text-xs font-bold text-white">TDS Return Q1 (Form 26Q/24Q)</div>
                  <div className="text-[11px] text-slate-400">8 clients pending • Income Tax Dept</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-rose-400 font-mono">31 Aug 2026</div>
                <div className="text-[10px] text-rose-400 font-semibold">13 days left</div>
              </div>
            </div>

            {/* Item 3 */}
            <div className="py-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></div>
                <div>
                  <div className="text-xs font-bold text-white">ITR Filing (Individuals & Salaried)</div>
                  <div className="text-[11px] text-slate-400">31 clients pending • Sahaj / Sugam</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-amber-400 font-mono">31 Aug 2026</div>
                <div className="text-[10px] text-amber-400 font-semibold">13 days left</div>
              </div>
            </div>

            {/* Item 4 */}
            <div className="py-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></div>
                <div>
                  <div className="text-xs font-bold text-white">GSTR-1 Monthly Outward Supplies</div>
                  <div className="text-[11px] text-slate-400">22 clients pending • GST Portal</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-amber-400 font-mono">11 Sep 2026</div>
                <div className="text-[10px] text-slate-400">24 days left</div>
              </div>
            </div>

            {/* Item 5 */}
            <div className="py-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></div>
                <div>
                  <div className="text-xs font-bold text-white">ROC Annual Return (AOC-4 / MGT-7)</div>
                  <div className="text-[11px] text-slate-400">5 companies pending • MCA Portal</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-emerald-400 font-mono">30 Sep 2026</div>
                <div className="text-[10px] text-emerald-400">43 days left</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Activity & Lead Pipeline (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: AI Agent Activity */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🤖</span>
                <h3 className="text-sm font-bold text-white">AI Agent Activity</h3>
              </div>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Live 24/7
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <span className="text-slate-400">Queries Handled Today</span>
                <span className="font-bold text-teal-400 font-mono text-sm">34</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <span className="text-slate-400">WhatsApp Reminders Sent</span>
                <span className="font-bold text-amber-400 font-mono text-sm">87</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <span className="text-slate-400">Docs Auto-Verified</span>
                <span className="font-bold text-emerald-400 font-mono text-sm">12</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <span className="text-slate-400">Leads Qualified by AI</span>
                <span className="font-bold text-indigo-400 font-mono text-sm">7</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-950/30 border border-emerald-900/50">
                <span className="text-emerald-300 font-medium">Fees Collected (AI Follow-up)</span>
                <span className="font-bold text-emerald-400 font-mono text-sm">₹45,000</span>
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
                <div className="text-2xl font-bold font-mono text-teal-400">12</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Active Prospects</div>
              </div>
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-center">
                <div className="text-2xl font-bold font-mono text-emerald-400">₹3.8L</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Pipeline Value</div>
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
              <h3 className="text-sm font-bold text-white">Recent Client Activity</h3>
              <p className="text-xs text-slate-400">Monitor filings, pending documents, and direct triggers</p>
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
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Client Name</th>
                <th className="px-4 py-3">Services</th>
                <th className="px-4 py-3">Last Activity</th>
                <th className="px-4 py-3">Pending Doc</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {recentClients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-800/30 transition">
                  <td className="px-4 py-3">
                    <div className="font-bold text-white">{client.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{client.gstin}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {client.services.map((svc) => (
                        <span
                          key={svc}
                          className="px-2 py-0.5 bg-teal-500/10 text-teal-300 border border-teal-500/30 rounded-lg text-[10px] font-semibold"
                        >
                          {svc}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{client.lastActivity}</td>
                  <td className="px-4 py-3">
                    {client.pendingDoc ? (
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-lg text-[10px] font-semibold">
                        {client.pendingDoc}
                      </span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {client.status === 'Active' && (
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-semibold">
                        ✓ Active
                      </span>
                    )}
                    {client.status === 'Doc Pending' && (
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-[10px] font-semibold">
                        ⚠️ Doc Pending
                      </span>
                    )}
                    {client.status === 'Overdue' && (
                      <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-full text-[10px] font-semibold">
                        🚨 Overdue
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {client.pendingDoc ? (
                      <button
                        onClick={() => handleQuickRemind(client.name, client.phone, client.pendingDoc)}
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
                        <span>View</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
