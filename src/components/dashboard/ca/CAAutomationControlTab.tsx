'use client';

import React, { useState } from 'react';
import { Bot, Play, Clock, CheckCircle2, AlertTriangle, RefreshCw, Send, Bell, Sparkles } from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui';

interface CAAutomationControlTabProps {
  businessId?: string;
  businessName?: string;
}

export default function CAAutomationControlTab({ businessId, businessName }: CAAutomationControlTabProps) {
  const [runningJob, setRunningJob] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ jobName: string; data: any } | null>(null);
  const [testAlertSending, setTestAlertSending] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null);

  const handleTriggerJob = async (jobName: string) => {
    setRunningJob(jobName);
    setTestResult(null);
    try {
      const res = await fetch(`/api/ca/cron/trigger/${jobName}`, {
        method: 'POST',
      });
      const data = await res.json();
      setTestResult({ jobName, data });
    } catch (err: any) {
      console.error('Trigger error:', err);
      setTestResult({ jobName, data: { error: err.message } });
    } finally {
      setRunningJob(null);
    }
  };

  const handleSendTestPartnerAlert = async () => {
    setTestAlertSending(true);
    setAlertSuccess(null);
    try {
      const res = await fetch('/api/ca/website-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Partner Alert Client',
          phone: '919876543210',
          message: 'URGENT: Need Immediate Company Incorporation & GST Registration for new startup!',
          source: 'Automation Diagnostic Test',
        }),
      });

      if (res.ok) {
        setAlertSuccess('🚀 Test Hot Lead generated and Partner Alert dispatched via Telegram/WhatsApp!');
        setTimeout(() => setAlertSuccess(null), 6000);
      }
    } catch (err: any) {
      console.error('Test alert error:', err);
    } finally {
      setTestAlertSending(false);
    }
  };

  const ENGINES = [
    {
      id: 'compliance',
      title: 'Staged Compliance Reminders Engine',
      schedule: 'Daily at 9:00 AM',
      description: 'Scans all GST, ITR, TDS, and MCA deadlines. Dispatches WhatsApp reminders at T-7, T-3, T-1, and Due Date.',
    },
    {
      id: 'documents',
      title: 'Document Follow-up Scanner',
      schedule: 'Daily at 11:00 AM',
      description: 'Finds pending document requests where clients have not uploaded invoices or bank statements. Sends polite follow-ups.',
    },
    {
      id: 'leads',
      title: 'Hot Lead Qualification Engine',
      schedule: 'Runs Hourly',
      description: 'Analyzes inbound client queries, calculates hot/warm lead scores, and alerts senior partners instantly.',
    },
    {
      id: 'invoices',
      title: 'Fee Recovery & Payment Reminder',
      schedule: 'Every 2 Days',
      description: 'Monitors unpaid invoices, sends staged payment links with instant UPI QR codes on WhatsApp.',
    },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Header Banner */}
      <Card>
        <CardHeader className="flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-accent text-xs font-semibold uppercase tracking-wider mb-1">
              <Bot className="w-4 h-4" /> Autonomous Background Schedulers
            </div>
            <CardTitle>CA Automation & Cron Center</CardTitle>
            <CardDescription>
              4 autonomous background engines running continuously in your backend to eliminate manual client chasing.
            </CardDescription>
          </div>

          <Button
            variant="danger"
            size="sm"
            onClick={handleSendTestPartnerAlert}
            loading={testAlertSending}
            leftIcon={<Bell className="w-4 h-4" />}
          >
            Test Partner Alert
          </Button>
        </CardHeader>
      </Card>

      {/* Alert Notification */}
      {alertSuccess && (
        <div className="p-3 bg-accent-subtle border border-accent-border rounded-md text-xs font-semibold text-accent flex items-center gap-2 animate-in fade-in duration-150">
          <Sparkles className="w-4 h-4" />
          <span>{alertSuccess}</span>
        </div>
      )}

      {/* Engine Execution Result Preview */}
      {testResult && (
        <Card className="bg-surface-subtle">
          <CardHeader>
            <CardTitle className="text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span>Result for: {testResult.jobName.toUpperCase()}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="p-3 bg-base rounded border border-line text-[11px] font-mono text-fg overflow-x-auto">
              {JSON.stringify(testResult.data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* 4 Background Engines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ENGINES.map((engine) => (
          <Card key={engine.id} className="flex flex-col justify-between">
            <CardContent className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-accent-subtle text-accent border border-accent-border">
                  {engine.schedule}
                </span>
                <span className="flex items-center text-xs text-success font-medium">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse mr-1.5" />
                  Active
                </span>
              </div>

              <div>
                <CardTitle className="text-sm">{engine.title}</CardTitle>
                <p className="text-xs text-fg-muted mt-1 leading-relaxed">
                  {engine.description}
                </p>
              </div>
            </CardContent>

            <CardFooter>
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                onClick={() => handleTriggerJob(engine.id)}
                loading={runningJob === engine.id}
                leftIcon={<Play className="w-3 h-3 fill-current" />}
              >
                Run Manual Test Trigger
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
