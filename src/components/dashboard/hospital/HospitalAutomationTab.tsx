'use client';

import React, { useState } from 'react';
import {
  Zap,
  Play,
  Calendar,
  Star,
  PhoneCall,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui';

interface HospitalAutomationTabProps {
  businessId?: string;
}

export default function HospitalAutomationTab({ businessId }: HospitalAutomationTabProps) {
  const [runningJob, setRunningJob] = useState<string | null>(null);
  const [lastResults, setLastResults] = useState<Record<string, any>>({});

  const { showToast } = useToast();

  const handleTriggerJob = async (jobName: string) => {
    try {
      setRunningJob(jobName);
      const res = await fetch(`/api/hospital/cron/trigger/${jobName}?${businessId ? `business_id=${businessId}` : ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(businessId ? { 'x-business-id': businessId } : {}),
        },
        body: JSON.stringify({ business_id: businessId }),
      });
      const data = await res.json();

      if (data.success) {
        setLastResults((prev) => ({ ...prev, [jobName]: data.result }));
        showToast({
          title: 'Engine Execution Succeeded',
          message: `${jobName.replace('_', ' ').toUpperCase()} processed ${data.result?.processed ?? 0} events successfully.`,
          type: 'success',
        });
      } else {
        showToast({
          title: 'Execution Failed',
          message: data.error || 'Could not complete automation job.',
          type: 'error',
        });
      }
    } catch (e: any) {
      console.error('Error triggering job:', e);
      showToast({ title: 'Trigger Error', message: e.message, type: 'error' });
    } finally {
      setRunningJob(null);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Header */}
      <Card>
        <CardHeader className="flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-accent" />
              <span>Hospital Background Cron & Webhook Engines</span>
            </CardTitle>
            <CardDescription>
              Automated schedulers matching Hospital n8n triggers for reminders, follow-ups, and surveys
            </CardDescription>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => handleTriggerJob('all')}
            loading={runningJob === 'all'}
            leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
          >
            Run All Automations
          </Button>
        </CardHeader>
      </Card>

      {/* 3 Core Cron Engines */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Engine 1: 24h & 2h Reminder Scanner */}
        <Card className="flex flex-col justify-between">
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-md bg-accent-subtle text-accent">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-accent bg-accent-subtle px-2 py-0.5 rounded border border-accent-border">
                Every 15 Mins
              </span>
            </div>

            <div>
              <CardTitle className="text-sm">Appointment Reminder Engine</CardTitle>
              <p className="text-xs text-fg-muted mt-1 leading-relaxed">
                Scans upcoming OPD visits at 24h and 2h horizons. Dispatches WhatsApp notifications with 1/2/3 action buttons.
              </p>
            </div>

            {lastResults['reminders'] && (
              <div className="p-2.5 bg-surface-subtle rounded-md border border-line text-[11px] font-mono text-fg">
                Processed: {lastResults['reminders'].processed || 0} reminders
              </div>
            )}
          </CardContent>

          <CardFooter>
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              onClick={() => handleTriggerJob('reminders')}
              loading={runningJob === 'reminders'}
              leftIcon={<Play className="w-3 h-3 fill-current" />}
            >
              Trigger Reminders Scan
            </Button>
          </CardFooter>
        </Card>

        {/* Engine 2: No-Show & Missed Visit Follow-up Engine */}
        <Card className="flex flex-col justify-between">
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-md bg-accent-subtle text-accent">
                <PhoneCall className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-accent bg-accent-subtle px-2 py-0.5 rounded border border-accent-border">
                Every 30 Mins
              </span>
            </div>

            <div>
              <CardTitle className="text-sm">Missed OPD & Follow-up Engine</CardTitle>
              <p className="text-xs text-fg-muted mt-1 leading-relaxed">
                Identifies missed slots, sends rescheduling options via WhatsApp, and schedules automated AI voice check-in calls.
              </p>
            </div>

            {lastResults['missed_followups'] && (
              <div className="p-2.5 bg-surface-subtle rounded-md border border-line text-[11px] font-mono text-fg">
                Processed: {lastResults['missed_followups'].processed || 0} no-shows
              </div>
            )}
          </CardContent>

          <CardFooter>
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              onClick={() => handleTriggerJob('missed_followups')}
              loading={runningJob === 'missed_followups'}
              leftIcon={<Play className="w-3 h-3 fill-current" />}
            >
              Trigger Missed Follow-up
            </Button>
          </CardFooter>
        </Card>

        {/* Engine 3: Post-Visit Feedback & Survey Scanner */}
        <Card className="flex flex-col justify-between">
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-md bg-accent-subtle text-accent">
                <Star className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-accent bg-accent-subtle px-2 py-0.5 rounded border border-accent-border">
                Hourly
              </span>
            </div>

            <div>
              <CardTitle className="text-sm">Post-Visit Survey Engine</CardTitle>
              <p className="text-xs text-fg-muted mt-1 leading-relaxed">
                Dispatches 5-star ratings survey 2 hours after completion. Routes happy patients to Google reviews.
              </p>
            </div>

            {lastResults['feedback_surveys'] && (
              <div className="p-2.5 bg-surface-subtle rounded-md border border-line text-[11px] font-mono text-fg">
                Processed: {lastResults['feedback_surveys'].processed || 0} surveys
              </div>
            )}
          </CardContent>

          <CardFooter>
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              onClick={() => handleTriggerJob('feedback_surveys')}
              loading={runningJob === 'feedback_surveys'}
              leftIcon={<Play className="w-3 h-3 fill-current" />}
            >
              Trigger Feedback Surveys
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
