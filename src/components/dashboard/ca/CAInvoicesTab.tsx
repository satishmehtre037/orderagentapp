'use client';

import React, { useState } from 'react';
import {
  Receipt,
  IndianRupee,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Phone,
  Mail,
  Plus,
  Search,
  Filter,
  Check,
  Building2,
  Sparkles,
} from 'lucide-react';

interface CAInvoicesTabProps {
  businessId?: string;
  businessName?: string;
}

interface InvoiceItem {
  id: string;
  clientName: string;
  phone: string;
  invoiceNo: string;
  service: string;
  amount: number;
  dueDate: string;
  overdueDays: number;
  status: 'Overdue' | 'Due Soon' | 'Reminder Sent' | 'Legal Notice' | 'Paid';
}

export default function CAInvoicesTab({
  businessId,
  businessName = 'Sharma & Associates',
}: CAInvoicesTabProps) {
  const [invoices, setInvoices] = useState<InvoiceItem[]>([
    {
      id: '1',
      clientName: 'Kumar Constructions',
      phone: '919876543210',
      invoiceNo: 'INV-2026-089',
      service: 'GST Filing & ROC Annual',
      amount: 75000,
      dueDate: '01 Aug 2026',
      overdueDays: 18,
      status: 'Overdue',
    },
    {
      id: '2',
      clientName: 'Mehta Textiles Pvt Ltd',
      phone: '919012345678',
      invoiceNo: 'INV-2026-091',
      service: 'GSTR-3B & TDS Return',
      amount: 48000,
      dueDate: '10 Aug 2026',
      overdueDays: 9,
      status: 'Due Soon',
    },
    {
      id: '3',
      clientName: 'Priya Sharma',
      phone: '919345678901',
      invoiceNo: 'INV-2026-094',
      service: 'Individual ITR Filing',
      amount: 12000,
      dueDate: '20 Aug 2026',
      overdueDays: 0,
      status: 'Reminder Sent',
    },
    {
      id: '4',
      clientName: 'Verma Transport Co.',
      phone: '919456789012',
      invoiceNo: 'INV-2026-082',
      service: 'GST Audit & TDS Q4',
      amount: 78000,
      dueDate: '15 Jul 2026',
      overdueDays: 35,
      status: 'Legal Notice',
    },
  ]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Form State
  const [formClient, setFormClient] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formService, setFormService] = useState('GST-3B & Compliance');
  const [formAmount, setFormAmount] = useState('');
  const [formDueDate, setFormDueDate] = useState('');

  const totalBilled = 1054500;
  const totalCollected = 841500;
  const totalOutstanding = 213000;

  const handleSendWhatsAppReminder = (inv: InvoiceItem) => {
    setActionMessage(`📱 WhatsApp payment reminder & UPI link sent to ${inv.clientName}!`);
    setInvoices((prev) =>
      prev.map((item) => (item.id === inv.id ? { ...item, status: 'Reminder Sent' } : item))
    );
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleMarkPaid = (invId: string) => {
    setInvoices((prev) =>
      prev.map((item) => (item.id === invId ? { ...item, status: 'Paid' } : item))
    );
    setActionMessage(`✅ Invoice marked as Paid! Receipt dispatched via WhatsApp.`);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleSendAllReminders = () => {
    setActionMessage(`🚀 Dispatched automated WhatsApp fee reminders to all 4 outstanding clients!`);
    setTimeout(() => setActionMessage(null), 5000);
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClient || !formAmount) return;

    const newInv: InvoiceItem = {
      id: String(Date.now()),
      clientName: formClient,
      phone: formPhone || '919876543210',
      invoiceNo: `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
      service: formService,
      amount: parseFloat(formAmount),
      dueDate: formDueDate || new Date().toISOString().slice(0, 10),
      overdueDays: 0,
      status: 'Due Soon',
    };

    setInvoices([newInv, ...invoices]);
    setIsCreateModalOpen(false);
    setActionMessage(`🎉 Created invoice ${newInv.invoiceNo} for ${formClient}!`);
    setTimeout(() => setActionMessage(null), 4000);
    setFormClient('');
    setFormAmount('');
    setFormPhone('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>🧾</span>
            <span>Invoice & Fee Management</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Identify pending professional fees, send 1-click WhatsApp payment reminders, and track collections.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleSendAllReminders}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center space-x-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Bulk WA Reminders</span>
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Create Invoice</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-2xl flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Top 3 Fee Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 text-center shadow-sm">
          <div className="text-2xl sm:text-3xl font-black font-mono text-white">
            ₹{totalBilled.toLocaleString('en-IN')}
          </div>
          <div className="text-xs font-semibold text-slate-400 mt-1">Total Billed (Current Month)</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 text-center shadow-sm">
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
            ₹{totalCollected.toLocaleString('en-IN')}
          </div>
          <div className="text-xs font-semibold text-emerald-400/80 mt-1 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Total Fees Collected (80%)</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 text-center shadow-sm">
          <div className="text-2xl sm:text-3xl font-black font-mono text-rose-400">
            ₹{totalOutstanding.toLocaleString('en-IN')}
          </div>
          <div className="text-xs font-semibold text-rose-400/80 mt-1 flex items-center justify-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Outstanding Fees (4 Clients)</span>
          </div>
        </div>
      </div>

      {/* Outstanding Invoices Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <span className="text-lg">💸</span>
            <div>
              <h3 className="text-sm font-bold text-white">Outstanding Client Invoices</h3>
              <p className="text-xs text-slate-400">Automated WhatsApp payment requests with UPI QR support</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Overdue</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-800/30 transition">
                  <td className="px-4 py-3">
                    <div className="font-bold text-white">{inv.clientName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">📱 {inv.phone}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400">{inv.invoiceNo}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-teal-500/10 text-teal-300 border border-teal-500/30 rounded-lg text-[10px] font-semibold">
                      {inv.service}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-white">
                    ₹{inv.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{inv.dueDate}</td>
                  <td className="px-4 py-3">
                    {inv.overdueDays > 0 ? (
                      <span className="font-bold text-rose-400 font-mono">{inv.overdueDays} days</span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {inv.status === 'Overdue' && (
                      <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-full text-[10px] font-semibold">
                        🚨 Overdue
                      </span>
                    )}
                    {inv.status === 'Due Soon' && (
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-[10px] font-semibold">
                        ⚠️ Due Soon
                      </span>
                    )}
                    {inv.status === 'Reminder Sent' && (
                      <span className="px-2 py-0.5 bg-teal-500/10 text-teal-400 border border-teal-500/30 rounded-full text-[10px] font-semibold">
                        📨 WA Sent
                      </span>
                    )}
                    {inv.status === 'Legal Notice' && (
                      <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-full text-[10px] font-semibold">
                        🚨 Final Notice
                      </span>
                    )}
                    {inv.status === 'Paid' && (
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-semibold">
                        ✓ Paid
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center space-x-1.5">
                      {inv.status !== 'Paid' ? (
                        <>
                          <button
                            onClick={() => handleSendWhatsAppReminder(inv)}
                            title="Send WhatsApp Payment Link"
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition shadow-xs inline-flex items-center gap-1"
                          >
                            <span>📱 WA</span>
                          </button>
                          <a
                            href={`tel:${inv.phone}`}
                            title="Call Client"
                            className="p-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg transition border border-slate-700"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => handleMarkPaid(inv.id)}
                            title="Mark as Paid"
                            className="p-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg transition border border-slate-700"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <span className="text-emerald-400 font-semibold text-[11px]">Completed ✓</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Auto-Reminder Schedule Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-3.5 shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="text-lg">🤖</span>
          <h3 className="text-sm font-bold text-white">AI Fee Recovery Automation Schedule</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="border border-slate-800 rounded-2xl p-3.5 text-center bg-slate-950/60">
            <div className="text-xl mb-1">7️⃣</div>
            <div className="font-bold text-white">7 Days Before Due Date</div>
            <div className="text-[11px] text-slate-400 mt-1">Polite WhatsApp invoice summary with UPI QR</div>
          </div>
          <div className="border border-slate-800 rounded-2xl p-3.5 text-center bg-slate-950/60">
            <div className="text-xl mb-1">3️⃣</div>
            <div className="font-bold text-white">3 Days Before Due Date</div>
            <div className="text-[11px] text-slate-400 mt-1">Priority WhatsApp reminder & payment confirmation link</div>
          </div>
          <div className="border border-rose-900/50 rounded-2xl p-3.5 text-center bg-rose-950/20">
            <div className="text-xl mb-1">🚨</div>
            <div className="font-bold text-rose-300">Overdue (&gt;15 Days)</div>
            <div className="text-[11px] text-rose-400/80 mt-1">Direct escalation alert to Senior CA Partner</div>
          </div>
        </div>
      </div>

      {/* Create Invoice Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4 text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">+ Create Fee Invoice</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Client Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mehta Textiles Pvt Ltd"
                  value={formClient}
                  onChange={(e) => setFormClient(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">WhatsApp Phone *</label>
                <input
                  type="text"
                  placeholder="919876543210"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Service / Compliance *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GST-3B Filing & Annual Audit"
                  value={formService}
                  onChange={(e) => setFormService(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="25000"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">Payment Due Date</label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow"
                >
                  Create & Send Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
