'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Send,
  ExternalLink,
  XCircle,
  Trash2,
  ChevronDown,
  Check,
  Sparkles,
} from 'lucide-react';
import type { CADocumentTracker, CADocStatus } from '@/types';
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

  // Preset dictionary
  const COMPLIANCE_DOC_PRESETS: Record<string, string[]> = {
    'GST-3B': [
      'Sales Register / Outward Invoices',
      'Purchase Register & ITC Invoices',
      'Bank Statements for the Period',
    ],
    'GSTR-1': [
      'B2B Sales Invoices with GSTIN',
      'B2C Summary Invoices',
      'Credit & Debit Notes',
    ],
    'ITR-1': [
      'Form 16 (Part A & B)',
      'Form 26AS & AIS/TIS Summary',
      'Bank Statements for FY',
      'Chapter VI-A Deductions Proofs (80C, 80D)',
    ],
    'ITR-4': [
      'Bank Statements for full FY',
      'Gross Receipts Calculation under 44AD/ADA',
      'Form 26AS & AIS Summary',
    ],
    'ROC-Filing': [
      'Audited Balance Sheet & P&L',
      'Directors Report & MGT-7 Details',
      'Bank Statements',
    ],
    'General': [
      'PAN & Aadhaar KYC',
      'Bank Statement (Last 6 Months)',
      'Entity Registration Certificate',
    ],
  };

  const [formClientId, setFormClientId] = useState('');
  const [manualClientName, setManualClientName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [formComplianceType, setFormComplianceType] = useState('GST-3B');
  const [docListInputs, setDocListInputs] = useState<string[]>(COMPLIANCE_DOC_PRESETS['GST-3B']);
  const [clients, setClients] = useState<any[]>([]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const bizParam = businessId ? `?businessId=${encodeURIComponent(businessId)}` : '';
      const res = await fetch(`/api/ca/documents${bizParam}`);
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
    fetchDocuments();
    fetchClients();
  }, [businessId]);

  const handleUpdateStatus = async (id: string, newStatus: CADocStatus) => {
    try {
      const res = await fetch('/api/ca/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: newStatus,
          verified_date: newStatus === 'Verified' ? new Date().toISOString() : undefined,
        }),
      });

      if (res.ok) {
        setActionMessage(`✅ Document marked as ${newStatus}!`);
        setTimeout(() => setActionMessage(null), 4000);
        fetchDocuments();
      }
    } catch (err) {
      console.error('Failed to update doc status:', err);
    }
  };

  const handleSendReminder = async (phone: string, clientName: string, docName: string) => {
    try {
      setActionMessage(`🚀 Sending WhatsApp reminder to ${clientName}...`);
      await fetch('/api/ca/request-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId,
          client_name: clientName,
          phone: phone,
          document_types: [docName],
          custom_note: 'Automated 1-click WhatsApp document collection reminder.',
        }),
      });
      setTimeout(() => {
        setActionMessage(`✅ WhatsApp reminder sent to ${clientName}!`);
        setTimeout(() => setActionMessage(null), 4000);
      }, 800);
    } catch (err) {
      console.error('Error sending reminder:', err);
      setActionMessage('❌ Failed to dispatch WhatsApp reminder.');
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document tracker record?')) return;
    try {
      const res = await fetch(`/api/ca/documents?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setActionMessage('🗑️ Document tracker deleted.');
        setTimeout(() => setActionMessage(null), 4000);
        fetchDocuments();
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualClientName || !manualPhone || docListInputs.length === 0) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/ca/request-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId,
          client_id: formClientId || undefined,
          client_name: manualClientName,
          phone: manualPhone,
          compliance_type: formComplianceType,
          document_types: docListInputs.filter((d) => d.trim()),
          firm_name: businessName,
        }),
      });

      if (res.ok) {
        setActionMessage(`✅ WhatsApp document checklist dispatched to ${manualClientName}!`);
        setTimeout(() => setActionMessage(null), 4000);
        setIsRequestModalOpen(false);
        setManualClientName('');
        setManualPhone('');
        fetchDocuments();
      }
    } catch (err) {
      console.error('Error requesting documents:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.phone.includes(searchQuery);

    const matchesStatus = statusFilter === 'All' || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = documents.filter((d) => d.status === 'Pending').length;
  const receivedCount = documents.filter((d) => d.status === 'Received').length;
  const verifiedCount = documents.filter((d) => d.status === 'Verified').length;

  const columns: Column<CADocumentTracker>[] = [
    {
      key: 'client_name',
      header: 'Client & Mobile',
      primary: true,
      render: (doc) => (
        <div>
          <div className="font-semibold text-fg">{doc.client_name}</div>
          <div className="text-[11px] text-fg-muted font-mono">{doc.phone}</div>
        </div>
      ),
    },
    {
      key: 'document_name',
      header: 'Document Name & Filing',
      render: (doc) => (
        <div>
          <div className="font-medium text-fg">{doc.document_name}</div>
          <div className="text-[10px] text-accent mt-0.5">{doc.compliance_type}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'OCR & Status',
      render: (doc) => <StatusBadge status={doc.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (doc) => (
        <div className="flex items-center justify-end gap-1.5">
          {doc.status === 'Pending' && (
            <Button
              variant="secondary"
              size="xs"
              onClick={() => handleSendReminder(doc.phone, doc.client_name, doc.document_name)}
              leftIcon={<Send className="w-3 h-3 text-accent" />}
            >
              Remind WA
            </Button>
          )}
          {doc.status === 'Received' && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleUpdateStatus(doc.id, 'Verified')}
              title="Verify Document"
            >
              <Check className="w-3.5 h-3.5 text-success" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleDeleteDocument(doc.id)}
            title="Delete Document Record"
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
              <FileText className="w-5 h-5 text-accent" />
              <span>Client Document Collection & OCR Verification Hub</span>
            </CardTitle>
            <CardDescription>
              WhatsApp automated checklists, OCR parsing for PAN/GST/bank statements, and 1-click reminders
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchDocuments}
              title="Refresh Documents"
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsRequestModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              + Request Documents
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Action Message Alert */}
      {actionMessage && (
        <div className="p-3 bg-accent-subtle border border-accent-border rounded-md text-xs font-semibold text-accent flex items-center gap-2 animate-in fade-in duration-150">
          <Sparkles className="w-4 h-4" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Awaiting Client Upload"
          value={pendingCount}
          deltaTone={pendingCount > 0 ? 'negative' : 'positive'}
          icon={<Clock className="text-warning" />}
          hint="Pending on client WhatsApp"
        />
        <StatCard
          label="Received (Pending Audit)"
          value={receivedCount}
          deltaTone="neutral"
          icon={<FileText className="text-info" />}
          hint="Uploaded by client, ready for review"
        />
        <StatCard
          label="Verified & Audit-Ready"
          value={verifiedCount}
          deltaTone="positive"
          icon={<CheckCircle2 className="text-success" />}
          hint="Verified by compliance team"
        />
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-fg-subtle absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search client, mobile, document..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8"
          />
        </div>

        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-40 text-xs"
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending Upload</option>
          <option value="Received">Received</option>
          <option value="Verified">Verified</option>
          <option value="Rejected">Rejected</option>
        </Select>
      </div>

      {/* Documents DataTable */}
      <Card>
        <CardContent className="p-0 sm:p-0">
          <DataTable
            columns={columns}
            rows={filteredDocs}
            getRowKey={(doc) => doc.id}
            loading={loading && documents.length === 0}
            empty={
              <div className="py-12 text-center text-xs text-fg-muted">
                No documents found matching your search.
              </div>
            }
          />
        </CardContent>
      </Card>

      {/* Request Documents Modal */}
      <Modal
        open={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="Dispatch WhatsApp Document Checklist"
        description="Send personalized document collection checklist with upload instructions directly to client WhatsApp"
        icon={<FileText className="text-accent" />}
        size="md"
        mobile="sheet"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsRequestModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRequestSubmit}
              loading={submitting}
              leftIcon={<Send className="w-4 h-4" />}
            >
              Send WhatsApp Request
            </Button>
          </>
        }
      >
        <form onSubmit={handleRequestSubmit} className="space-y-3.5 text-xs">
          <div>
            <Label className="mb-1 block">Select Client (Optional)</Label>
            <Select
              value={formClientId}
              onChange={(e) => {
                const cId = e.target.value;
                setFormClientId(cId);
                const found = clients.find((c) => c.id === cId);
                if (found) {
                  setManualClientName(found.client_name);
                  setManualPhone(found.phone);
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
                value={manualClientName}
                onChange={(e) => setManualClientName(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1 block">WhatsApp Mobile Number *</Label>
              <Input
                required
                placeholder="919876543210"
                value={manualPhone}
                onChange={(e) => setManualPhone(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label className="mb-1 block">Statutory Compliance Type</Label>
            <Select
              value={formComplianceType}
              onChange={(e) => {
                const newT = e.target.value;
                setFormComplianceType(newT);
                setDocListInputs(COMPLIANCE_DOC_PRESETS[newT] || COMPLIANCE_DOC_PRESETS['General']);
              }}
            >
              <option value="GST-3B">GST-3B Monthly Return</option>
              <option value="GSTR-1">GSTR-1 Outward Supplies</option>
              <option value="ITR-1">ITR-1 (Salaried Individual)</option>
              <option value="ITR-4">ITR-4 (Presumptive Business 44AD)</option>
              <option value="ROC-Filing">ROC Annual Filing</option>
              <option value="General">General KYC & Financials</option>
            </Select>
          </div>

          <div>
            <Label className="mb-1.5 block">Requested Documents Checklist</Label>
            <div className="space-y-1.5">
              {docListInputs.map((doc, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    value={doc}
                    onChange={(e) => {
                      const updated = [...docListInputs];
                      updated[idx] = e.target.value;
                      setDocListInputs(updated);
                    }}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => setDocListInputs(docListInputs.filter((_, i) => i !== idx))}
                  >
                    ✕
                  </Button>
                </div>
              ))}
              <Button
                variant="secondary"
                size="xs"
                type="button"
                onClick={() => setDocListInputs([...docListInputs, ''])}
              >
                + Add Another Document
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
