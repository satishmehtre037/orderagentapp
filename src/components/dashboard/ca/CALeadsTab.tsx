'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Flame,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
  Send,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import type { CALead, CALeadScore, CALeadStatus } from '@/types';
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
  Textarea,
  Label,
  type Column,
} from '@/components/ui';

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

  const handleSendQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteModalLead) return;

    setIsSendingQuote(true);
    try {
      const res = await fetch('/api/ca/send-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: quoteModalLead.id,
          lead_name: quoteModalLead.name,
          phone: quoteModalLead.phone,
          fee_amount: quoteFee,
          scope_of_work: quoteScope || quoteModalLead.requirement,
          firm_name: businessName,
        }),
      });

      if (res.ok) {
        setActionMessage(`🚀 Professional fee proposal dispatched to ${quoteModalLead.name} via WhatsApp!`);
        setTimeout(() => setActionMessage(null), 4000);
        setQuoteModalLead(null);
        fetchLeads();
      }
    } catch (err) {
      console.error('Error sending quote:', err);
    } finally {
      setIsSendingQuote(false);
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
  const inProgressCount = leads.filter((l) => l.status === 'In-Progress' || l.status === 'Qualifying').length;
  const convertedCount = leads.filter((l) => l.status === 'Converted').length;

  const columns: Column<CALead>[] = [
    {
      key: 'name',
      header: 'Prospective Client',
      primary: true,
      render: (lead) => (
        <div>
          <div className="font-semibold text-fg">{lead.name}</div>
          <div className="text-[11px] text-fg-muted font-mono">{lead.phone || 'No phone'}</div>
        </div>
      ),
    },
    {
      key: 'requirement',
      header: 'Service Required',
      render: (lead) => (
        <div>
          <div className="font-medium text-fg text-xs">{lead.requirement || 'General Advisory'}</div>
          <div className="text-[10px] text-fg-muted mt-0.5">{lead.business_type || 'Entity Unspecified'}</div>
        </div>
      ),
    },
    {
      key: 'qualification_score',
      header: 'AI Score',
      render: (lead) => (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
            lead.qualification_score === 'Hot'
              ? 'bg-danger-subtle text-danger border border-danger-border'
              : lead.qualification_score === 'Warm'
              ? 'bg-warning-subtle text-warning border border-warning-border'
              : 'bg-info-subtle text-info border border-info-border'
          }`}
        >
          {lead.qualification_score === 'Hot' && <Flame className="w-3 h-3" />}
          {lead.qualification_score}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Pipeline Stage',
      render: (lead) => <StatusBadge status={lead.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (lead) => (
        <div className="flex items-center justify-end gap-1.5">
          {lead.status !== 'Converted' && (
            <>
              <Button
                variant="secondary"
                size="xs"
                onClick={() => {
                  setQuoteModalLead(lead);
                  setQuoteScope(lead.requirement || '');
                }}
                leftIcon={<Send className="w-3 h-3 text-accent" />}
              >
                Send Quote
              </Button>
              <Button
                variant="primary"
                size="xs"
                onClick={() => handleConvertLeadToClient(lead)}
                leftIcon={<CheckCircle2 className="w-3 h-3" />}
              >
                Onboard
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
              <Users className="w-5 h-5 text-accent" />
              <span>Inbound Leads & Qualification Pipeline</span>
            </CardTitle>
            <CardDescription>
              Autonomous 24/7 AI qualification, instant engagement quotes, and 1-click client onboarding
            </CardDescription>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={fetchLeads}
            title="Refresh Leads"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        </CardHeader>
      </Card>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div className="p-3 bg-accent-subtle border border-accent-border rounded-md text-xs font-semibold text-accent flex items-center gap-2 animate-in fade-in duration-150">
          <Sparkles className="w-4 h-4" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* 4 Pipeline Stage KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Total Inbound Leads"
          value={leads.length}
          icon={<Users className="text-accent" />}
        />
        <StatCard
          label="High-Value (Hot)"
          value={hotCount}
          deltaTone="negative"
          icon={<Flame className="text-danger" />}
          hint="Ready for quote / closing"
        />
        <StatCard
          label="Active In-Progress"
          value={inProgressCount}
          deltaTone="neutral"
          icon={<Clock className="text-warning" />}
          hint="In qualification discussion"
        />
        <StatCard
          label="Converted Clients"
          value={convertedCount}
          deltaTone="positive"
          icon={<CheckCircle2 className="text-success" />}
          hint="Successfully onboarded"
        />
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-fg-subtle absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search prospective client, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Select
            value={scoreFilter}
            onChange={(e) => setScoreFilter(e.target.value)}
            className="w-full sm:w-36 text-xs"
          >
            <option value="All">All Scores</option>
            <option value="Hot">🔥 Hot</option>
            <option value="Warm">⚡ Warm</option>
            <option value="Cold">❄️ Cold</option>
          </Select>

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-36 text-xs"
          >
            <option value="All">All Stages</option>
            <option value="New">New</option>
            <option value="Qualifying">Qualifying</option>
            <option value="In-Progress">In-Progress</option>
            <option value="Converted">Converted</option>
          </Select>
        </div>
      </div>

      {/* Leads DataTable */}
      <Card>
        <CardContent className="p-0 sm:p-0">
          <DataTable
            columns={columns}
            rows={filteredLeads}
            getRowKey={(lead) => lead.id}
            loading={loading && leads.length === 0}
            empty={
              <div className="py-12 text-center text-xs text-fg-muted">
                No prospective leads found matching your criteria.
              </div>
            }
          />
        </CardContent>
      </Card>

      {/* Send Proposal / Quote Modal */}
      <Modal
        open={quoteModalLead !== null}
        onClose={() => setQuoteModalLead(null)}
        title={`Dispatch Fee Proposal to ${quoteModalLead?.name || 'Client'}`}
        description="Deliver formal CA engagement letter and fee schedule directly to client on WhatsApp"
        icon={<Send className="text-accent" />}
        size="md"
        mobile="sheet"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setQuoteModalLead(null)} disabled={isSendingQuote}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSendQuote}
              loading={isSendingQuote}
              leftIcon={<Send className="w-4 h-4" />}
            >
              Dispatch Proposal
            </Button>
          </>
        }
      >
        <form onSubmit={handleSendQuote} className="space-y-3.5 text-xs">
          <div>
            <Label className="mb-1 block">Proposed Professional Fee (INR) *</Label>
            <Input
              type="number"
              required
              value={quoteFee}
              onChange={(e) => setQuoteFee(e.target.value)}
            />
          </div>

          <div>
            <Label className="mb-1 block">Scope of Work & Statutory Inclusions *</Label>
            <Textarea
              rows={4}
              required
              placeholder="e.g. End-to-end Private Limited incorporation, name approval, MOA/AOA drafting, DIN/DSC, PAN/TAN, and GST registration."
              value={quoteScope}
              onChange={(e) => setQuoteScope(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
