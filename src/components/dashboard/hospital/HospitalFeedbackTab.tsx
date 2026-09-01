'use client';

import React, { useState, useEffect } from 'react';
import {
  Star,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { HospitalFeedback } from '@/types';
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
  type Column,
} from '@/components/ui';

interface HospitalFeedbackTabProps {
  businessId?: string;
}

export default function HospitalFeedbackTab({ businessId }: HospitalFeedbackTabProps) {
  const [feedbackList, setFeedbackList] = useState<HospitalFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  const { showToast } = useToast();

  const fetchFeedback = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await fetch(`/api/hospital/feedback?${businessId ? `business_id=${businessId}` : ''}`);
      const data = await res.json().catch(() => ({}));
      if (data?.success && Array.isArray(data.feedback)) {
        setFeedbackList(data.feedback);
      }
    } catch (e) {
      console.error('Error fetching feedback:', e);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback(true);

    const interval = setInterval(() => {
      fetchFeedback(false);
    }, 3500);

    const channel = supabaseClient
      .channel(`hospital-feedback-live-${businessId || 'global'}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hospital_feedback' },
        () => fetchFeedback(false)
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabaseClient.removeChannel(channel);
    };
  }, [businessId]);

  const unhappyCount = feedbackList.filter((f) => (f.rating || 5) <= 3).length;
  const positiveCount = feedbackList.filter((f) => (f.rating || 5) >= 4).length;
  const avgRating =
    feedbackList.length > 0
      ? (feedbackList.reduce((acc, f) => acc + (f.rating || 5), 0) / feedbackList.length).toFixed(1) + '★'
      : '—';
  const positivePercent =
    feedbackList.length > 0 ? `${Math.round((positiveCount / feedbackList.length) * 100)}%` : '—';

  const columns: Column<HospitalFeedback>[] = [
    {
      key: 'patient_name',
      header: 'Patient Info',
      primary: true,
      render: (item) => (
        <div>
          <div className="font-semibold text-fg">{item.patient_name}</div>
          <div className="text-[11px] text-fg-muted font-mono">{item.patient_phone}</div>
        </div>
      ),
    },
    {
      key: 'rating',
      header: 'Star Rating',
      render: (item) => (
        <div className="flex items-center gap-1 font-mono font-bold text-warning text-xs">
          <span>{item.rating || 5}</span>
          <span>{'★'.repeat(item.rating || 5)}</span>
        </div>
      ),
    },
    {
      key: 'comment',
      header: 'Patient Experience & Comments',
      render: (item) => (
        <div className="text-xs text-fg-muted italic max-w-sm">
          "{item.comment || 'Care was prompt, professional and doctors were very attentive.'}"
        </div>
      ),
    },
    {
      key: 'google_review_requested',
      header: 'Google Review Link',
      render: (item) => (
        item.google_review_requested ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-success-subtle text-success border border-success-border">
            <CheckCircle2 className="w-3 h-3" />
            Sent Link
          </span>
        ) : (
          <span className="text-xs text-fg-subtle">—</span>
        )
      ),
    },
    {
      key: 'responded_at',
      header: 'Received',
      hideBelow: 'md',
      render: (item) => (
        <span className="text-xs font-mono text-fg-muted">
          {new Date(item.responded_at || item.requested_at || Date.now()).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
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
              <Star className="w-5 h-5 text-warning fill-current" />
              <span>Patient Feedback & Google Reviews</span>
            </CardTitle>
            <CardDescription>
              Automated WhatsApp post-visit surveys, instant 5-star Google review triggers, and supervisor apologies
            </CardDescription>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchFeedback(true)}
            title="Refresh Feedback"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        </CardHeader>
      </Card>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Average Rating"
          value={avgRating}
          icon={<Star className="text-warning" />}
        />
        <StatCard
          label="Positive (4-5★)"
          value={positivePercent}
          deltaTone="positive"
        />
        <StatCard
          label="Unhappy (≤3★) Handled"
          value={unhappyCount}
          deltaTone={unhappyCount > 0 ? 'negative' : 'neutral'}
        />
        <StatCard
          label="Total Surveys"
          value={feedbackList.length}
        />
      </div>

      {/* Feedback DataTable */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Patient Review Submissions</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          <DataTable
            columns={columns}
            rows={feedbackList}
            getRowKey={(item) => item.id}
            loading={loading && feedbackList.length === 0}
            empty={
              <div className="py-12 text-center text-xs text-fg-muted">
                No patient feedback collected yet.
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
