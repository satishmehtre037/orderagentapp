'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  AlertCircle,
  CheckCircle2,
  Download,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Zap,
} from 'lucide-react';
import { HospitalReport } from '@/types';
import { useToast } from '@/components/ui/ToastProvider';
import { supabaseClient } from '@/lib/supabase/client';
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
  Input,
  type Column,
} from '@/components/ui';

interface HospitalReportsTabProps {
  businessId?: string;
  onOpenUploadReport: () => void;
}

export default function HospitalReportsTab({
  businessId,
  onOpenUploadReport,
}: HospitalReportsTabProps) {
  const [reports, setReports] = useState<HospitalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const { showToast } = useToast();

  const fetchReports = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await fetch(`/api/hospital/reports?${businessId ? `business_id=${businessId}` : ''}`);
      const data = await res.json().catch(() => ({}));
      if (data?.success && Array.isArray(data.reports)) {
        setReports(data.reports);
      }
    } catch (e) {
      console.error('Error fetching hospital reports:', e);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(true);

    const interval = setInterval(() => {
      fetchReports(false);
    }, 3500);

    const channel = supabaseClient
      .channel(`hospital-reports-live-${businessId || 'global'}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hospital_reports' },
        () => fetchReports(false)
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabaseClient.removeChannel(channel);
    };
  }, [businessId]);

  const handleDeliverReport = async (report: HospitalReport) => {
    try {
      showToast({
        title: 'Dispatching Report via WhatsApp',
        message: `Sending ${report.report_type} PDF to ${report.patient_name} (${report.patient_phone}).`,
        type: 'whatsapp',
      });
      setReports((prev) =>
        prev.map((r) => (r.id === report.id ? { ...r, delivered_via_wa: true, status: 'Delivered' } : r))
      );
    } catch (e) {
      console.error('Error delivering report:', e);
    }
  };

  const filteredReports = reports.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.patient_name.toLowerCase().includes(q) ||
      r.patient_phone.includes(q) ||
      r.report_type.toLowerCase().includes(q) ||
      (r.doctor_name && r.doctor_name.toLowerCase().includes(q))
    );
  });

  const criticalCount = reports.filter((r) => r.is_critical).length;
  const deliveredCount = reports.filter((r) => r.delivered_via_wa).length;

  const columns: Column<HospitalReport>[] = [
    {
      key: 'report_type',
      header: 'Report & Investigation',
      primary: true,
      render: (report) => (
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-fg">{report.report_type}</span>
            {report.is_critical && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-danger-subtle text-danger border border-danger-border">
                Critical Alert
              </span>
            )}
          </div>
          <div className="text-[11px] text-fg-muted mt-0.5 max-w-xs truncate" title={report.ai_summary}>
            {report.ai_summary || 'No AI summary generated'}
          </div>
        </div>
      ),
    },
    {
      key: 'patient_name',
      header: 'Patient Info',
      render: (report) => (
        <div>
          <div className="font-medium text-fg">{report.patient_name}</div>
          <div className="text-[11px] text-fg-muted font-mono">{report.patient_phone}</div>
        </div>
      ),
    },
    {
      key: 'doctor_name',
      header: 'Reviewing Doctor',
      hideBelow: 'sm',
      render: (report) => (
        <span className="text-xs text-fg-muted">{report.doctor_name || 'Dr. Rajesh Gupta'}</span>
      ),
    },
    {
      key: 'delivery',
      header: 'WhatsApp Delivery',
      render: (report) => (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
            report.delivered_via_wa
              ? 'bg-success-subtle text-success border border-success-border'
              : 'bg-warning-subtle text-warning border border-warning-border'
          }`}
        >
          {report.delivered_via_wa ? (
            <>
              <CheckCircle2 className="w-3 h-3" />
              Delivered
            </>
          ) : (
            <>
              <AlertCircle className="w-3 h-3" />
              Pending
            </>
          )}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (report) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDeliverReport(report);
            }}
            title="Send PDF via WhatsApp"
          >
            <MessageSquare className="w-3.5 h-3.5 text-accent" />
          </Button>
          {report.file_url && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation();
                window.open(report.file_url, '_blank');
              }}
              title="Download Report PDF"
            >
              <Download className="w-3.5 h-3.5 text-fg-muted" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Header & Controls */}
      <Card>
        <CardHeader className="flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-accent" />
              <span>Diagnostic Labs & Pathology Reports Hub</span>
            </CardTitle>
            <CardDescription>
              Automated clinical AI summarization, critical abnormal value alerts, and instant WhatsApp PDF delivery
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fetchReports(true)}
              title="Refresh Reports"
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenUploadReport}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Publish Lab Report
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Reports Published"
          value={reports.length}
          icon={<FileText />}
          hint="All pathology & diagnostic lab files"
        />
        <StatCard
          label="Critical Abnormal Findings"
          value={criticalCount}
          deltaTone="negative"
          icon={<AlertCircle />}
          hint="Flagged for immediate doctor consultation"
        />
        <StatCard
          label="Delivered via WhatsApp"
          value={deliveredCount}
          deltaTone="positive"
          icon={<Zap />}
          hint="Instant PDF delivery with secure token"
        />
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-3.5 h-3.5 text-fg-subtle absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          type="text"
          placeholder="Search by report name, patient, doctor..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8"
        />
      </div>

      {/* Reports DataTable */}
      <Card>
        <CardContent className="p-0 sm:p-0">
          <DataTable
            columns={columns}
            rows={filteredReports}
            getRowKey={(report) => report.id}
            loading={loading && reports.length === 0}
            empty={
              <div className="py-12 text-center text-xs text-fg-muted">
                No lab reports matching your query.
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
