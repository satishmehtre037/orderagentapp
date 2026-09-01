'use client';

import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  PhoneForwarded,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  Clock,
  Play,
  Plus,
} from 'lucide-react';
import { HospitalVoiceCall } from '@/types';
import { useToast } from '@/components/ui/ToastProvider';
import { supabaseClient } from '@/lib/supabase/client';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  SectionHeader,
  DataTable,
  StatusBadge,
  Input,
  Label,
  type Column,
} from '@/components/ui';

interface HospitalVoiceCallsTabProps {
  businessId?: string;
}

export default function HospitalVoiceCallsTab({ businessId }: HospitalVoiceCallsTabProps) {
  const [calls, setCalls] = useState<HospitalVoiceCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [manualPhone, setManualPhone] = useState('');
  const [manualName, setManualName] = useState('');
  const [isCalling, setIsCalling] = useState(false);

  const { showToast } = useToast();

  const fetchCalls = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await fetch(`/api/hospital/voice-calls?${businessId ? `business_id=${businessId}` : ''}`);
      const data = await res.json().catch(() => ({}));
      if (data?.success && Array.isArray(data.calls)) {
        setCalls(data.calls);
      }
    } catch (e) {
      console.error('Error fetching voice calls:', e);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls(true);

    const interval = setInterval(() => {
      fetchCalls(false);
    }, 3500);

    const channel = supabaseClient
      .channel(`hospital-voice-live-${businessId || 'global'}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hospital_voice_calls' },
        () => fetchCalls(false)
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabaseClient.removeChannel(channel);
    };
  }, [businessId]);

  const handleTriggerManualCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName || !manualPhone) return;

    try {
      setIsCalling(true);
      const res = await fetch('/api/hospital/voice-calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId,
          patient_name: manualName,
          patient_phone: manualPhone,
          call_type: 'patient_requested',
          reason: 'Manual patient consultation call initiated via Hospital Voice Desk.',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast({
          title: 'AI Voice Call Initiated',
          message: `Dialing ${manualName} (${manualPhone}) via Voice AI Server.`,
          type: 'success',
        });
        setCalls((prev) => [data.call, ...prev]);
        setManualName('');
        setManualPhone('');
      }
    } catch (e) {
      console.error('Error initiating manual voice call:', e);
    } finally {
      setIsCalling(false);
    }
  };

  const columns: Column<HospitalVoiceCall>[] = [
    {
      key: 'patient_name',
      header: 'Patient Info',
      primary: true,
      render: (call) => (
        <div>
          <div className="font-semibold text-fg">{call.patient_name}</div>
          <div className="text-[11px] text-fg-muted font-mono">{call.patient_phone}</div>
        </div>
      ),
    },
    {
      key: 'call_type',
      header: 'Call Purpose & Trigger',
      render: (call) => (
        <div>
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-subtle border border-line text-fg-muted uppercase">
            {call.call_type?.replace('_', ' ') || 'OUTBOUND'}
          </span>
          <div className="text-[11px] text-fg-muted mt-0.5 max-w-xs truncate" title={call.transcript_summary}>
            {call.transcript_summary || 'Routine follow-up call'}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Call Status',
      render: (call) => <StatusBadge status={call.status} />,
    },
    {
      key: 'duration_seconds',
      header: 'Duration',
      render: (call) => (
        <span className="font-mono text-xs text-fg-muted">
          {call.duration_seconds ? `${call.duration_seconds}s` : '—'}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Time',
      hideBelow: 'md',
      render: (call) => (
        <span className="text-xs font-mono text-fg-muted">
          {new Date(call.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
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
              <PhoneCall className="w-5 h-5 text-accent" />
              <span>AI Voice Calling & Patient Follow-up Desk</span>
            </CardTitle>
            <CardDescription>
              Automated speech synthesis voice calling for appointment reminders, no-show follow-ups, and urgent lab alerts
            </CardDescription>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchCalls(true)}
            title="Refresh Call Log"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        </CardHeader>
      </Card>

      {/* Manual Call Launcher Box */}
      <Card>
        <CardContent>
          <SectionHeader
            icon={<PhoneForwarded />}
            title="Initiate Instant Outbound Voice Call"
            description="Launch an automated AI phone call to any patient for appointments, instructions or lab alerts."
          />
          <form onSubmit={handleTriggerManualCall} className="mt-4 flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Label className="mb-1 block">Patient Name</Label>
              <Input
                required
                placeholder="e.g. Sumanth Varma"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label className="mb-1 block">Mobile Number (with country code)</Label>
              <Input
                required
                placeholder="919876543210"
                value={manualPhone}
                onChange={(e) => setManualPhone(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="primary"
                type="submit"
                loading={isCalling}
                leftIcon={<Play className="w-4 h-4 fill-current" />}
              >
                Dial Now
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Voice Call History DataTable */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Outbound Voice Calls Ledger</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          <DataTable
            columns={columns}
            rows={calls}
            getRowKey={(call) => call.id}
            loading={loading && calls.length === 0}
            empty={
              <div className="py-12 text-center text-xs text-fg-muted">
                No voice calls recorded yet.
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
