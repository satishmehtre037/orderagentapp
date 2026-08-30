'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  IndianRupee,
  AlertCircle,
  TrendingUp,
  FileCheck,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowUpRight,
  UserPlus,
  RefreshCw,
  FileText,
  Send,
} from 'lucide-react';
import type { CAComplianceRecord, CADocumentTracker, CALead, CAClient, DashboardTab } from '@/types';
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
  type Column,
} from '@/components/ui';

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

  const pendingDocs = docs.filter((d) => d.status === 'Pending');
  const urgentDeadlines = deadlines.filter((d) => d.status !== 'Filed').slice(0, 5);

  const pendingDocsColumns: Column<CADocumentTracker>[] = [
    {
      key: 'client_name',
      header: 'Client / Entity',
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
      header: 'Required Document',
      render: (doc) => (
        <span className="font-medium text-fg">{doc.document_name}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (doc) => <StatusBadge status={doc.status} />,
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (doc) => (
        <Button
          variant="secondary"
          size="xs"
          onClick={() => handleQuickRemind(doc.client_name, doc.phone, doc.document_name)}
          leftIcon={<Send className="w-3 h-3 text-accent" />}
        >
          Remind WA
        </Button>
      ),
    },
  ];

  const deadlineColumns: Column<CAComplianceRecord>[] = [
    {
      key: 'compliance_type',
      header: 'Filing & Deadline',
      primary: true,
      render: (item) => (
        <div>
          <div className="font-semibold text-fg">{item.compliance_type}</div>
          <div className="text-[11px] text-accent font-medium">Due: {item.due_date}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'right',
      render: (item) => <StatusBadge status={item.status} />,
    },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Top Banner */}
      <Card>
        <CardHeader className="flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-accent-subtle text-accent border border-accent-border">
                Chartered Accountant Practice OS
              </span>
              <span className="flex items-center text-xs text-success font-medium">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse mr-1.5" />
                Live Sync
              </span>
            </div>
            <h2 className="text-xl font-bold text-fg mt-1">
              {businessName}
            </h2>
            <CardDescription>
              Autonomous GST/ITR compliance tracking, client document pipeline, and WhatsApp billing
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={loadRealData}
              title="Refresh Practice Data"
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenNewClientModal}
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              + Onboard Client
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

      {/* 4 Core Financial & Practice KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Client Entities"
          value={clients.length}
          icon={<Users className="text-accent" />}
          hint={`${clients.length} corporate & LLP records`}
        />
        <StatCard
          label="Upcoming Deadlines"
          value={deadlines.filter((d) => d.status !== 'Filed').length}
          deltaTone="neutral"
          icon={<Calendar className="text-warning" />}
          hint="GST, ITR & TDS statutory dates"
        />
        <StatCard
          label="Pending Documents"
          value={pendingDocs.length}
          deltaTone={pendingDocs.length > 0 ? 'negative' : 'positive'}
          icon={<FileText className="text-danger" />}
          hint="Awaiting client WhatsApp upload"
        />
        <StatCard
          label="Fee Outstanding"
          value={`₹${totalOutstanding.toLocaleString('en-IN')}`}
          deltaTone={totalOutstanding > 0 ? 'negative' : 'positive'}
          icon={<IndianRupee className="text-success" />}
          hint={`Collected: ₹${totalCollected.toLocaleString('en-IN')}`}
        />
      </div>

      {/* Grid: Pending Documents Pipeline & Upcoming Compliance Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pending Client Documents */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-accent" />
              <span>Pending Client Documents</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onNavigateTab('ca_documents' as DashboardTab)}
              rightIcon={<ArrowUpRight className="w-3 h-3" />}
            >
              Doc Hub
            </Button>
          </CardHeader>
          <CardContent className="p-0 sm:p-0">
            <DataTable
              columns={pendingDocsColumns}
              rows={pendingDocs.slice(0, 5)}
              getRowKey={(d) => d.id}
              loading={loading && docs.length === 0}
              empty={
                <div className="py-8 text-center text-xs text-fg-muted">
                  All requested client documents collected & verified.
                </div>
              }
            />
          </CardContent>
        </Card>

        {/* Statutory Compliance Calendar Preview */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent" />
              <span>Statutory Compliance Schedule</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onNavigateTab('ca_compliance' as DashboardTab)}
              rightIcon={<ArrowUpRight className="w-3 h-3" />}
            >
              Compliance
            </Button>
          </CardHeader>
          <CardContent className="p-0 sm:p-0">
            <DataTable
              columns={deadlineColumns}
              rows={urgentDeadlines}
              getRowKey={(item) => item.id}
              loading={loading && deadlines.length === 0}
              empty={
                <div className="py-8 text-center text-xs text-fg-muted">
                  No statutory deadlines approaching this month.
                </div>
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
