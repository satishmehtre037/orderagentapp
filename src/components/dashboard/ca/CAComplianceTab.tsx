'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  Search,
  Filter,
  Send,
  RefreshCw,
  FileText,
  Trash2,
  UserX,
  ChevronDown,
  Check,
  Sparkles,
} from 'lucide-react';
import type { CAComplianceRecord, CAComplianceType, CAComplianceStatus } from '@/types';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  DataTable,
  StatCard,
  StatusBadge,
  Modal,
  Input,
  Select,
  Label,
  type Column,
} from '@/components/ui';

interface CAComplianceTabProps {
  businessId?: string;
  businessName?: string;
}

export default function CAComplianceTab({ businessId, businessName }: CAComplianceTabProps) {
  const [compliances, setCompliances] = useState<CAComplianceRecord[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Form State for Add Compliance
  const [selectedClientId, setSelectedClientId] = useState('');
  const [formClientName, setFormClientName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formType, setFormType] = useState<CAComplianceType>('GST-3B');
  const [formDueDate, setFormDueDate] = useState('');

  const fetchCompliances = async () => {
    setLoading(true);
    try {
      const bizParam = businessId ? `?businessId=${encodeURIComponent(businessId)}` : '';
      const res = await fetch(`/api/ca/compliance${bizParam}`);
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
      const bizParam = businessId ? `?businessId=${encodeURIComponent(businessId)}` : '';
      const res = await fetch(`/api/ca/clients${bizParam}`);
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
  }, [businessId]);

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

  const getDaysBadge = (dueDateStr: string, status: string) => {
    if (status === 'Filed') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-success-subtle text-success border border-success-border">
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
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-danger-subtle text-danger border border-danger-border">
          <AlertTriangle className="w-3 h-3" /> Overdue by {Math.abs(diffDays)}d
        </span>
      );
    } else if (diffDays === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-warning-subtle text-warning border border-warning-border animate-pulse">
          <Clock className="w-3 h-3" /> Due Today!
        </span>
      );
    } else if (diffDays <= 3) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-warning-subtle text-warning border border-warning-border">
          <Clock className="w-3 h-3" /> Due in {diffDays}d
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-info-subtle text-info border border-info-border">
          <Clock className="w-3 h-3" /> {diffDays}d left
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

  const columns: Column<CAComplianceRecord>[] = [
    {
      key: 'client_name',
      header: 'Client & Entity',
      primary: true,
      render: (item) => (
        <div>
          <div className="font-semibold text-fg">{item.client_name}</div>
          <div className="text-[11px] text-fg-muted font-mono">{item.phone}</div>
        </div>
      ),
    },
    {
      key: 'compliance_type',
      header: 'Statutory Filing',
      render: (item) => (
        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-surface-subtle border border-line text-fg">
          {item.compliance_type}
        </span>
      ),
    },
    {
      key: 'due_date',
      header: 'Due Date',
      render: (item) => (
        <div>
          <div className="font-mono text-xs font-medium text-fg">{item.due_date}</div>
          <div className="mt-0.5">{getDaysBadge(item.due_date, item.status)}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          {item.status !== 'Filed' && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleMarkFiled(item.id, item.client_name, item.compliance_type)}
              title="Mark Filed"
            >
              <Check className="w-3.5 h-3.5 text-success" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleDeleteCompliance(item.id)}
            title="Delete Record"
          >
            <Trash2 className="w-3.5 h-3.5 text-danger" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Header */}
      <Card>
        <CardHeader className="flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent" />
              <span>Statutory Compliance Calendar & Filing Schedulers</span>
            </CardTitle>
            <CardDescription>
              GST, Income Tax ITR, TDS, MCA/ROC corporate filings, and automated staged WhatsApp reminders
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchCompliances}
              title="Refresh Deadlines"
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              + Add Deadline
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div className="p-3 bg-accent-subtle border border-accent-border rounded-md text-xs font-semibold text-accent flex items-center gap-2 animate-in fade-in duration-150">
          <Sparkles className="w-4 h-4" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Pending Filings"
          value={pendingCount}
          deltaTone="neutral"
          icon={<Clock className="text-warning" />}
          hint="Upcoming statutory deadlines"
        />
        <StatCard
          label="Overdue Filings"
          value={overdueCount}
          deltaTone={overdueCount > 0 ? 'negative' : 'positive'}
          icon={<AlertTriangle className="text-danger" />}
          hint="Statutory penalty risk"
        />
        <StatCard
          label="Successfully Filed"
          value={filedCount}
          deltaTone="positive"
          icon={<CheckCircle2 className="text-success" />}
          hint="Filed with ARN acknowledgment"
        />
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-fg-subtle absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search client, mobile, filing type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-36 text-xs"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Filed">Filed</option>
            <option value="Overdue">Overdue</option>
          </Select>

          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full sm:w-36 text-xs"
          >
            <option value="All">All Categories</option>
            <option value="GST">GST Returns</option>
            <option value="ITR">ITR & Tax</option>
            <option value="TDS">TDS & TCS</option>
            <option value="ROC">MCA / ROC</option>
          </Select>
        </div>
      </div>

      {/* Compliances DataTable */}
      <Card>
        <CardContent className="p-0 sm:p-0">
          <DataTable
            columns={columns}
            rows={filteredCompliances}
            getRowKey={(item) => item.id}
            loading={loading && compliances.length === 0}
            empty={
              <div className="py-12 text-center text-xs text-fg-muted">
                No statutory compliance records match your filters.
              </div>
            }
          />
        </CardContent>
      </Card>

      {/* Add Compliance Modal */}
      <Modal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Schedule Statutory Compliance Deadline"
        description="Add statutory filing record to schedule automated WhatsApp reminder triggers"
        icon={<Calendar className="text-accent" />}
        size="md"
        mobile="sheet"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsAddModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddCompliance}
              loading={submitting}
            >
              Schedule Deadline
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddCompliance} className="space-y-3.5 text-xs">
          <div>
            <Label className="mb-1 block">Select Existing Client (Optional)</Label>
            <Select
              value={selectedClientId}
              onChange={(e) => {
                const cId = e.target.value;
                setSelectedClientId(cId);
                const found = clients.find((c) => c.id === cId);
                if (found) {
                  setFormClientName(found.client_name);
                  setFormPhone(found.phone);
                  setFormEmail(found.email || '');
                }
              }}
            >
              <option value="">-- Choose registered entity --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.client_name} ({c.phone})
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label className="mb-1 block">Client Legal Name *</Label>
            <Input
              required
              placeholder="e.g. Apex Enterprises Pvt Ltd"
              value={formClientName}
              onChange={(e) => setFormClientName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">WhatsApp Mobile *</Label>
              <Input
                required
                placeholder="919876543210"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1 block">Email (Optional)</Label>
              <Input
                type="email"
                placeholder="accounts@company.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">Compliance Type</Label>
              <Select
                value={formType}
                onChange={(e) => setFormType(e.target.value as any)}
              >
                <option value="GST-3B">GST-3B Monthly Return</option>
                <option value="GST-GSTR1">GSTR-1 Outward Supplies</option>
                <option value="ITR-Individual">ITR (Individual)</option>
                <option value="ITR-Corporate">ITR (Corporate / Pvt Ltd)</option>
                <option value="TDS-Return">TDS Quarterly Return</option>
                <option value="ROC-Annual">ROC Annual Filing</option>
                <option value="Advance-Tax">Advance Tax Installment</option>
                <option value="General">Other Statutory Task</option>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block">Statutory Due Date *</Label>
              <Input
                type="date"
                required
                value={formDueDate}
                onChange={(e) => setFormDueDate(e.target.value)}
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
