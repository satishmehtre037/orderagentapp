'use client';

import React, { useState, useEffect } from 'react';
import {
  Receipt,
  IndianRupee,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Plus,
  Search,
  Check,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import type { CAClient } from '@/types';
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
  created_at?: string;
}

export default function CAInvoicesTab({
  businessId,
  businessName = 'Sharma & Associates',
}: CAInvoicesTabProps) {
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [clients, setClients] = useState<CAClient[]>([]);
  const [totalBilled, setTotalBilled] = useState(0);
  const [totalCollected, setTotalCollected] = useState(0);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [loading, setLoading] = useState(true);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Form State
  const [formClientId, setFormClientId] = useState('');
  const [formClient, setFormClient] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formService, setFormService] = useState('GST-3B Filing & Annual Compliance');
  const [formAmount, setFormAmount] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const bizParam = businessId ? `?businessId=${encodeURIComponent(businessId)}` : '';
      const [invRes, clientsRes] = await Promise.all([
        fetch(`/api/ca/invoices${bizParam}`),
        fetch(`/api/ca/clients${bizParam}`),
      ]);

      const invData = await invRes.json();
      const cData = await clientsRes.json();

      if (invData.invoices) {
        setInvoices(invData.invoices);
        setTotalBilled(invData.totalBilled || 0);
        setTotalCollected(invData.totalCollected || 0);
        setTotalOutstanding(invData.totalOutstanding || 0);
      }
      if (cData.clients) {
        setClients(cData.clients);
      }
    } catch (err) {
      console.error('Error loading invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [businessId]);

  const handleSendPaymentReminder = async (invoice: InvoiceItem) => {
    try {
      setActionMessage(`🚀 Dispatching WhatsApp Payment Reminder & UPI Link to ${invoice.clientName}...`);
      await fetch('/api/ca/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_reminder',
          invoice_id: invoice.id,
          phone: invoice.phone,
          client_name: invoice.clientName,
          amount: invoice.amount,
          invoice_no: invoice.invoiceNo,
          firm_name: businessName,
        }),
      });

      setTimeout(() => {
        setActionMessage(`✅ WhatsApp Payment Link sent to ${invoice.clientName}!`);
        setTimeout(() => setActionMessage(null), 4000);
        loadInvoices();
      }, 800);
    } catch (err) {
      console.error('Reminder error:', err);
      setActionMessage('❌ Failed to dispatch WhatsApp payment link.');
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleMarkPaid = async (id: string, clientName: string) => {
    try {
      await fetch('/api/ca/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_paid',
          id: id,
        }),
      });
      setActionMessage(`✅ Invoice for ${clientName} marked as PAID!`);
      setTimeout(() => setActionMessage(null), 4000);
      loadInvoices();
    } catch (err) {
      console.error('Mark paid error:', err);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClient || !formPhone || !formAmount) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/ca/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId,
          client_name: formClient,
          phone: formPhone,
          service: formService,
          amount: Number(formAmount),
          due_date: formDueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          firm_name: businessName,
        }),
      });

      if (res.ok) {
        setActionMessage(`✅ Invoice created and dispatched to ${formClient}!`);
        setTimeout(() => setActionMessage(null), 4000);
        setIsCreateModalOpen(false);
        setFormClient('');
        setFormPhone('');
        setFormAmount('');
        loadInvoices();
      }
    } catch (err) {
      console.error('Error creating invoice:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<InvoiceItem>[] = [
    {
      key: 'invoiceNo',
      header: 'Invoice #',
      width: '100px',
      render: (inv) => (
        <span className="font-mono font-bold text-accent text-xs">
          {inv.invoiceNo}
        </span>
      ),
    },
    {
      key: 'clientName',
      header: 'Client & Mobile',
      primary: true,
      render: (inv) => (
        <div>
          <div className="font-semibold text-fg">{inv.clientName}</div>
          <div className="text-[11px] text-fg-muted font-mono">{inv.phone}</div>
        </div>
      ),
    },
    {
      key: 'service',
      header: 'Service Rendered',
      render: (inv) => (
        <span className="text-xs text-fg">{inv.service}</span>
      ),
    },
    {
      key: 'amount',
      header: 'Fee (INR)',
      render: (inv) => (
        <span className="font-mono font-bold text-fg">
          ₹{inv.amount.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (inv) => (
        <span className="font-mono text-xs text-fg-muted">
          {inv.dueDate}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Payment Status',
      render: (inv) => <StatusBadge status={inv.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (inv) => (
        <div className="flex items-center justify-end gap-1.5">
          {inv.status !== 'Paid' && (
            <>
              <Button
                variant="secondary"
                size="xs"
                onClick={() => handleSendPaymentReminder(inv)}
                leftIcon={<Send className="w-3 h-3 text-accent" />}
              >
                Send UPI
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleMarkPaid(inv.id, inv.clientName)}
                title="Mark Paid"
              >
                <Check className="w-3.5 h-3.5 text-success" />
              </Button>
            </>
          )}
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
              <Receipt className="w-5 h-5 text-accent" />
              <span>Professional Fee Billing & UPI Recovery Desk</span>
            </CardTitle>
            <CardDescription>
              Autonomous fee invoicing, Razorpay/UPI payment links, and staged WhatsApp collection follow-ups
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={loadInvoices}
              title="Refresh Invoices"
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              + Generate Invoice
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

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Fee Invoiced"
          value={`₹${totalBilled.toLocaleString('en-IN')}`}
          icon={<IndianRupee className="text-accent" />}
          hint="Gross billed across active entities"
        />
        <StatCard
          label="Collected & Verified"
          value={`₹${totalCollected.toLocaleString('en-IN')}`}
          deltaTone="positive"
          icon={<CheckCircle2 className="text-success" />}
          hint="Received via UPI / Net Banking"
        />
        <StatCard
          label="Outstanding Fee Due"
          value={`₹${totalOutstanding.toLocaleString('en-IN')}`}
          deltaTone={totalOutstanding > 0 ? 'negative' : 'positive'}
          icon={<AlertTriangle className="text-danger" />}
          hint="Awaiting client settlement"
        />
      </div>

      {/* Invoices DataTable */}
      <Card>
        <CardContent className="p-0 sm:p-0">
          <DataTable
            columns={columns}
            rows={invoices}
            getRowKey={(inv) => inv.id}
            loading={loading && invoices.length === 0}
            empty={
              <div className="py-12 text-center text-xs text-fg-muted">
                No fee invoices generated yet.
              </div>
            }
          />
        </CardContent>
      </Card>

      {/* Create Invoice Modal */}
      <Modal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Generate CA Professional Fee Invoice"
        description="Creates official invoice record and delivers WhatsApp payment prompt with instant UPI link"
        icon={<Receipt className="text-accent" />}
        size="md"
        mobile="sheet"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsCreateModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateInvoice}
              loading={submitting}
              leftIcon={<Receipt className="w-4 h-4" />}
            >
              Issue Invoice & Send Link
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateInvoice} className="space-y-3.5 text-xs">
          <div>
            <Label className="mb-1 block">Select Client (Optional)</Label>
            <Select
              value={formClientId}
              onChange={(e) => {
                const cId = e.target.value;
                setFormClientId(cId);
                const found = clients.find((c) => c.id === cId);
                if (found) {
                  setFormClient(found.client_name);
                  setFormPhone(found.phone);
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">Client Legal Name *</Label>
              <Input
                required
                placeholder="e.g. Apex Enterprises Pvt Ltd"
                value={formClient}
                onChange={(e) => setFormClient(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1 block">WhatsApp Mobile *</Label>
              <Input
                required
                placeholder="919876543210"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label className="mb-1 block">Service Description *</Label>
            <Input
              required
              placeholder="e.g. GST-3B Filing & Annual Compliance"
              value={formService}
              onChange={(e) => setFormService(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">Professional Fee (INR) *</Label>
              <Input
                type="number"
                required
                placeholder="5000"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1 block">Payment Due Date</Label>
              <Input
                type="date"
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
