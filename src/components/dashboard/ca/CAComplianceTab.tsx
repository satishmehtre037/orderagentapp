import React, { useState, useEffect, useRef } from 'react';
import { Calendar, CheckCircle2, AlertTriangle, Clock, Plus, Search, Filter, Send, RefreshCw, FileText, Trash2, UserX, ChevronDown, Check, Sparkles } from 'lucide-react';
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

  // Structured Compliance Groups
  const COMPLIANCE_GROUPS = [
    {
      group: '🧾 GST Returns & Compliance',
      items: [
        { id: 'GST-3B', label: 'GST-3B Monthly Return & ITC' },
        { id: 'GSTR-1', label: 'GSTR-1 Outward Supplies' },
        { id: 'GSTR-9', label: 'GSTR-9 Annual Return & 9C' },
        { id: 'GST-Registration', label: 'New GST Registration' },
        { id: 'GST-LUT', label: 'GST LUT Filing' },
        { id: 'GST-Notice', label: 'GST Notice Reply' },
      ],
    },
    {
      group: '📊 Income Tax & ITR Filings',
      items: [
        { id: 'ITR-1', label: 'ITR-1 Sahaj (Salaried)' },
        { id: 'ITR-2', label: 'ITR-2 (Capital Gains)' },
        { id: 'ITR-3', label: 'ITR-3 (Business & Profession)' },
        { id: 'ITR-4', label: 'ITR-4 Sugam (Presumptive)' },
        { id: 'ITR-5', label: 'ITR-5 (Firms & LLPs)' },
        { id: 'ITR-6', label: 'ITR-6 (Companies / Pvt Ltd)' },
        { id: 'ITR-7', label: 'ITR-7 (Trusts & NGOs)' },
        { id: 'Advance-Tax-Q1', label: 'Advance Tax Q1 (June 15)' },
        { id: 'Advance-Tax-Q2', label: 'Advance Tax Q2 (Sept 15)' },
        { id: 'Advance-Tax-Q3', label: 'Advance Tax Q3 (Dec 15)' },
        { id: 'Advance-Tax-Q4', label: 'Advance Tax Q4 (March 15)' },
        { id: 'IT-Notice', label: 'Income Tax Notice Reply' },
      ],
    },
    {
      group: '💸 TDS & Withholding Tax',
      items: [
        { id: 'TDS-26Q', label: 'TDS Return (26Q - Vendors)' },
        { id: 'TDS-24Q', label: 'TDS Salary (24Q - Payroll)' },
        { id: 'TDS-27Q', label: 'TDS Foreign (27Q - NRI)' },
        { id: 'TCS-27EQ', label: 'TCS Return (27EQ)' },
      ],
    },
    {
      group: '🏛️ MCA / ROC & Corporate Secretarial',
      items: [
        { id: 'ROC-AOC4', label: 'ROC AOC-4 (Financials Filing)' },
        { id: 'ROC-MGT7', label: 'ROC MGT-7 (Annual Return)' },
        { id: 'Company-Incorporation', label: 'Company Incorporation (SPICe+)' },
        { id: 'LLP-Incorporation', label: 'LLP Incorporation & Annual Filing' },
        { id: 'DIR-3-KYC', label: 'Director Annual KYC (DIR-3)' },
        { id: 'DPT-3', label: 'DPT-3 Return of Deposits' },
        { id: 'MSME-Form-1', label: 'MSME Form 1' },
        { id: 'ROC-Change', label: 'Director / Office Change' },
      ],
    },
    {
      group: '💼 Audit & Assurance',
      items: [
        { id: 'Tax-Audit', label: 'Tax Audit (Sec 44AB & 3CD)' },
        { id: 'Statutory-Audit', label: 'Statutory Company Audit' },
        { id: 'Internal-Audit', label: 'Internal Audit & System Review' },
        { id: 'Stock-Audit', label: 'Stock Audit & Inventory' },
      ],
    },
    {
      group: '🚀 Startup, Licensing & Advisory',
      items: [
        { id: 'Startup-India', label: 'Startup India (DPIIT) & 80-IAC' },
        { id: 'MSME-Udyam', label: 'MSME / Udyam Registration' },
        { id: 'IEC-License', label: 'Import Export Code (IEC)' },
        { id: 'FSSAI-License', label: 'FSSAI Food License' },
        { id: 'Trademark', label: 'Trademark & IP Filing' },
        { id: 'Virtual-CFO', label: 'Virtual CFO & Monthly MIS' },
      ],
    },
  ];

  // Form State for Add Compliance
  const [selectedClientId, setSelectedClientId] = useState('');
  const [formClientName, setFormClientName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formType, setFormType] = useState<CAComplianceType>('GST-3B');
  const [formDueDate, setFormDueDate] = useState('');
  const [clients, setClients] = useState<Array<{ id: string; client_name: string; phone: string; email?: string; entity_type?: string; requirement?: string }>>([]);
  const [isComplianceDropdownOpen, setIsComplianceDropdownOpen] = useState(false);
  const [autoCategorizedReason, setAutoCategorizedReason] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-categorization algorithm based on Client Requirement / Inquiry
  const detectComplianceCategory = (reqText = '', entityType = ''): { category: string; reason: string } => {
    const text = (reqText + ' ' + entityType).toLowerCase();

    // 1. ROC / MCA & Secretarial
    if (text.includes('roc') || text.includes('aoc-4') || text.includes('aoc4') || text.includes('mgt-7') || text.includes('annual filing') || text.includes('mca') || text.includes('agm')) {
      return { category: 'ROC-AOC4', reason: 'ROC Annual Compliance & Financials' };
    }
    if (text.includes('incorporat') || text.includes('pvt ltd') || text.includes('private limited') || text.includes('company formation') || text.includes('opc') || text.includes('start company') || text.includes('register company')) {
      return { category: 'Company-Incorporation', reason: 'Company / Pvt Ltd Incorporation' };
    }
    if (text.includes('llp') || text.includes('limited liability')) {
      return { category: 'LLP-Incorporation', reason: 'LLP Incorporation & Annual Filing' };
    }
    if (text.includes('dir-3') || text.includes('dir3') || text.includes('director kyc')) {
      return { category: 'DIR-3-KYC', reason: 'Annual Director KYC' };
    }
    if (text.includes('dpt-3') || text.includes('dpt3') || text.includes('deposit')) {
      return { category: 'DPT-3', reason: 'Return of Deposits' };
    }

    // 2. GST Suite
    if (text.includes('gst reg') || text.includes('new gst') || text.includes('apply gst') || text.includes('gst number')) {
      return { category: 'GST-Registration', reason: 'New GST Registration' };
    }
    if (text.includes('gstr-9') || text.includes('gstr9') || text.includes('9c') || text.includes('gst audit')) {
      return { category: 'GSTR-9', reason: 'GSTR-9 Annual Return & 9C Audit' };
    }
    if (text.includes('gstr-1') || text.includes('gstr1') || text.includes('outward')) {
      return { category: 'GSTR-1', reason: 'GSTR-1 Outward Supplies' };
    }
    if (text.includes('lut') || text.includes('export')) {
      return { category: 'GST-LUT', reason: 'GST LUT for Export' };
    }
    if (text.includes('gst notice') || text.includes('drc-01') || text.includes('asmt')) {
      return { category: 'GST-Notice', reason: 'GST Department Notice Reply' };
    }
    if (text.includes('gst') || text.includes('3b') || text.includes('monthly return')) {
      return { category: 'GST-3B', reason: 'Monthly GST-3B Return & ITC' };
    }

    // 3. Tax Audit & Statutory Audits
    if (text.includes('tax audit') || text.includes('44ab') || text.includes('3cd') || text.includes('3ca')) {
      return { category: 'Tax-Audit', reason: 'Tax Audit (Section 44AB)' };
    }
    if (text.includes('statutory audit') || text.includes('company audit')) {
      return { category: 'Statutory-Audit', reason: 'Statutory Company Audit' };
    }
    if (text.includes('internal audit') || text.includes('sop')) {
      return { category: 'Internal-Audit', reason: 'Internal SOP & Process Audit' };
    }
    if (text.includes('stock audit') || text.includes('inventory audit')) {
      return { category: 'Stock-Audit', reason: 'Physical Stock Audit' };
    }

    // 4. TDS / TCS
    if (text.includes('tds 24q') || text.includes('salary tds') || text.includes('payroll') || text.includes('form 16')) {
      return { category: 'TDS-24Q', reason: 'Payroll TDS Form 24Q' };
    }
    if (text.includes('tds 27q') || text.includes('nri') || text.includes('foreign remittance') || text.includes('15ca')) {
      return { category: 'TDS-27Q', reason: 'Foreign Remittance TDS (27Q)' };
    }
    if (text.includes('tcs') || text.includes('27eq')) {
      return { category: 'TCS-27EQ', reason: 'TCS Form 27EQ' };
    }
    if (text.includes('tds') || text.includes('26q') || text.includes('contractor') || text.includes('vendor')) {
      return { category: 'TDS-26Q', reason: 'Vendor TDS Form 26Q' };
    }

    // 5. Income Tax & ITR
    if (text.includes('itr-6') || text.includes('corporate tax') || text.includes('company itr')) {
      return { category: 'ITR-6', reason: 'Corporate Income Tax (ITR-6)' };
    }
    if (text.includes('itr-5') || text.includes('firm itr') || text.includes('partnership tax')) {
      return { category: 'ITR-5', reason: 'Partnership / LLP Tax (ITR-5)' };
    }
    if (text.includes('itr-4') || text.includes('44ad') || text.includes('44ada') || text.includes('presumptive') || text.includes('sugam')) {
      return { category: 'ITR-4', reason: 'Presumptive Business Tax (ITR-4)' };
    }
    if (text.includes('itr-3') || text.includes('proprietor tax') || text.includes('business itr')) {
      return { category: 'ITR-3', reason: 'Individual Business Tax (ITR-3)' };
    }
    if (text.includes('itr-2') || text.includes('capital gain') || text.includes('crypto') || text.includes('stock market')) {
      return { category: 'ITR-2', reason: 'Capital Gains & House Property (ITR-2)' };
    }
    if (text.includes('itr-7') || text.includes('trust') || text.includes('ngo') || text.includes('12a') || text.includes('80g')) {
      return { category: 'ITR-7', reason: 'Trust & NGO Tax (ITR-7)' };
    }
    if (text.includes('advance tax q1')) return { category: 'Advance-Tax-Q1', reason: 'Advance Tax Q1' };
    if (text.includes('advance tax q2')) return { category: 'Advance-Tax-Q2', reason: 'Advance Tax Q2' };
    if (text.includes('advance tax q3')) return { category: 'Advance-Tax-Q3', reason: 'Advance Tax Q3' };
    if (text.includes('advance tax q4') || text.includes('advance tax')) return { category: 'Advance-Tax-Q4', reason: 'Advance Tax Q4' };
    if (text.includes('income tax notice') || text.includes('143') || text.includes('148') || text.includes('defective return')) {
      return { category: 'IT-Notice', reason: 'Income Tax Notice Reply' };
    }
    if (text.includes('itr') || text.includes('income tax') || text.includes('salary') || text.includes('sahaj')) {
      return { category: 'ITR-1', reason: 'Salaried Individual Tax (ITR-1)' };
    }

    // 6. Startup & Licensing
    if (text.includes('startup') || text.includes('dpiit') || text.includes('80iac') || text.includes('seed')) {
      return { category: 'Startup-India', reason: 'Startup India DPIIT Recognition' };
    }
    if (text.includes('msme') || text.includes('udyam')) {
      return { category: 'MSME-Udyam', reason: 'MSME Udyam Registration' };
    }
    if (text.includes('iec') || text.includes('import export')) {
      return { category: 'IEC-License', reason: 'Import Export Code (IEC)' };
    }
    if (text.includes('fssai') || text.includes('food')) {
      return { category: 'FSSAI-License', reason: 'FSSAI Food License' };
    }
    if (text.includes('trademark') || text.includes('brand') || text.includes('tm')) {
      return { category: 'Trademark', reason: 'Trademark & IP Filing' };
    }
    if (text.includes('cfo') || text.includes('mis') || text.includes('accounting') || text.includes('bookkeeping')) {
      return { category: 'Virtual-CFO', reason: 'Virtual CFO Advisory' };
    }

    return { category: 'GST-3B', reason: 'Standard GST-3B Filing' };
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsComplianceDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSelectedComplianceLabel = () => {
    for (const group of COMPLIANCE_GROUPS) {
      const found = group.items.find((it) => it.id === formType);
      if (found) return found.label;
    }
    return formType;
  };

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

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/ca/clients');
      const data = await res.json();
      if (data.clients) {
        setClients(data.clients);
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    }
  };

  useEffect(() => {
    fetchCompliances();
    fetchClients();
  }, []);

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
        fetchClients();
      }
    } catch (err) {
      console.error('Client delete error:', err);
    }
  };

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
          client_id: selectedClientId || undefined,
          client_name: formClientName,
          phone: formPhone,
          email: formEmail,
          compliance_type: formType,
          due_date: formDueDate,
          status: 'Pending',
        }),
      });

      if (res.ok) {
        setActionMessage(`✅ Added ${formType} deadline for ${formClientName}!`);
        setTimeout(() => setActionMessage(null), 4000);
        setIsAddModalOpen(false);
        setFormClientName('');
        setFormPhone('');
        setFormEmail('');
        setFormDueDate('');
        fetchCompliances();
      }
    } catch (err) {
      console.error('Error adding compliance:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkFiled = async (id: string, clientName: string, type: string) => {
    const ackNum = 'ARN-' + Date.now().toString().slice(-12);
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
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
          <CheckCircle2 className="w-3 h-3" /> Filed
        </span>
      );
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const today = new Date(todayStr + 'T00:00:00Z');
    const due = new Date(String(dueDateStr).slice(0, 10) + 'T00:00:00Z');
    const diffDays = Math.round((due.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));

    if (diffDays < 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
          <AlertTriangle className="w-3 h-3" /> Overdue by {Math.abs(diffDays)}d
        </span>
      );
    } else if (diffDays === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 animate-pulse">
          <Clock className="w-3 h-3" /> Due Today!
        </span>
      );
    } else if (diffDays <= 3) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
          <Clock className="w-3 h-3" /> Due in {diffDays}d
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50">
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
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-slate-950 dark:via-indigo-950/80 dark:to-slate-950 text-white p-6 rounded-2xl shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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
            onClick={() => {
              fetchClients();
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/30 transition"
          >
            <Plus className="w-4 h-4" /> Add Compliance
          </button>
        </div>
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
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending Filings</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{pendingCount}</h3>
          </div>
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/40 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/60">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Overdue Alerts</p>
            <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{overdueCount}</h3>
          </div>
          <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/40 rounded-2xl flex items-center justify-center text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/60">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Successfully Filed</p>
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{filedCount}</h3>
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
            placeholder="Search client, phone, or filing..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
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
            className="px-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Filed">Filed</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Compliance List Table */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        {loading ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />
            <p className="text-sm">Loading compliance calendar...</p>
          </div>
        ) : filteredCompliances.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-slate-700 dark:text-slate-200">No compliance records found</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
              Add your first client compliance deadline using the &quot;Add Compliance&quot; button above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-950/60 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Client Name</th>
                  <th className="py-3.5 px-4">Compliance Type</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Countdown / Status</th>
                  <th className="py-3.5 px-4">Reminders</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm text-slate-700 dark:text-slate-200">
                {filteredCompliances.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                      <div>{record.client_name}</div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 font-normal">{record.phone}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60">
                        {record.compliance_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                      {record.due_date}
                    </td>
                    <td className="py-3.5 px-4">
                      {getDaysBadge(record.due_date, record.status)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{record.reminder_count || 0}</span> sent
                      {record.last_reminder_date && (
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">
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
                              className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/60 rounded-lg transition"
                            >
                              Mark Filed
                            </button>
                            <button
                              onClick={() => handleSendReminderNow(record.phone, record.client_name, record.compliance_type, record.due_date)}
                              title="Send WhatsApp reminder immediately"
                              className="p-1 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {record.status === 'Filed' && record.acknowledgement_number && (
                          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            {record.acknowledgement_number}
                          </span>
                        )}

                        <button
                          onClick={() => handleDeleteCompliance(record.id)}
                          title="Delete this compliance record"
                          className="p-1 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteClientComplete(record.client_id, record.phone, record.client_name)}
                          title={`Permanently delete client "${record.client_name}" and ALL records`}
                          className="p-1 text-slate-400 dark:text-slate-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-lg transition"
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Add New Compliance Deadline</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCompliance} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Select Client {clients.length > 0 ? `(${clients.length} available)` : ''}
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => {
                    const selId = e.target.value;
                    setSelectedClientId(selId);
                    const found = clients.find((c) => c.id === selId);
                    if (found) {
                      setFormClientName(found.client_name);
                      setFormPhone(found.phone);
                      setFormEmail(found.email || '');

                      // Intelligent auto-categorization
                      const detected = detectComplianceCategory(found.requirement, found.entity_type);
                      setFormType(detected.category as any);
                      setAutoCategorizedReason(`⚡ Auto-categorized: ${detected.reason}`);
                    } else {
                      setFormClientName('');
                      setFormPhone('');
                      setFormEmail('');
                      setAutoCategorizedReason(null);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2 text-xs font-medium"
                >
                  <option value="">-- Choose from Registered Clients & Leads --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      👤 {c.client_name} ({c.phone}) {c.entity_type ? `• ${c.entity_type}` : ''}
                    </option>
                  ))}
                </select>

                {autoCategorizedReason && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/80 rounded-xl text-indigo-700 dark:text-indigo-300 text-xs font-medium animate-in fade-in slide-in-from-top-1 duration-200">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>{autoCategorizedReason}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Client Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Enterprises / Rajesh Kumar"
                  value={formClientName}
                  onChange={(e) => setFormClientName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Phone (WhatsApp) *</label>
                  <input
                    type="text"
                    required
                    placeholder="919876543210"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="client@company.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative" ref={dropdownRef}>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Compliance Area *</label>
                  
                  {/* Trigger Button with Smooth Rounded Edges */}
                  <button
                    type="button"
                    onClick={() => setIsComplianceDropdownOpen(!isComplianceDropdownOpen)}
                    className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/90 border ${
                      isComplianceDropdownOpen
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    } text-slate-900 dark:text-slate-100 rounded-2xl flex items-center justify-between transition-all duration-200 shadow-sm text-xs font-medium text-left`}
                  >
                    <span className="truncate pr-2">{getSelectedComplianceLabel()}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 shrink-0 ${
                        isComplianceDropdownOpen ? 'rotate-180 text-indigo-500' : ''
                      }`}
                    />
                  </button>

                  {/* Smooth Rounded Dropdown Popover */}
                  {isComplianceDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-2xl z-50 max-h-64 overflow-y-auto p-2 space-y-2.5 transition-all animate-in fade-in zoom-in-95 duration-150 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
                      {COMPLIANCE_GROUPS.map((grp) => (
                        <div key={grp.group} className="space-y-1">
                          <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            {grp.group}
                          </div>
                          <div className="space-y-0.5">
                            {grp.items.map((item) => {
                              const isSelected = formType === item.id;
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => {
                                    setFormType(item.id as any);
                                    setIsComplianceDropdownOpen(false);
                                  }}
                                  className={`w-full px-3 py-2 text-xs rounded-xl flex items-center justify-between transition-colors text-left ${
                                    isSelected
                                      ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-semibold'
                                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                                  }`}
                                >
                                  <span>{item.label}</span>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 ml-2" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 text-xs"
                >
                  {submitting ? 'Adding...' : 'Save Deadline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
