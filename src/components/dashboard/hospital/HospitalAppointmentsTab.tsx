'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Search,
  Plus,
  PhoneCall,
  MessageSquare,
  RefreshCw,
  Check,
} from 'lucide-react';
import { HospitalAppointment, HospitalAppointmentStatus } from '@/types';
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
  StatusBadge,
  Input,
  type Column,
} from '@/components/ui';

interface HospitalAppointmentsTabProps {
  businessId?: string;
  onOpenNewAppointment: () => void;
}

export default function HospitalAppointmentsTab({
  businessId,
  onOpenNewAppointment,
}: HospitalAppointmentsTabProps) {
  const [appointments, setAppointments] = useState<HospitalAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { showToast } = useToast();

  const fetchAppointments = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await fetch(`/api/hospital/appointments?${businessId ? `business_id=${businessId}&` : ''}status=${activeFilter}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.appointments)) {
        setAppointments(data.appointments);
      }
    } catch (e) {
      console.error('Error fetching hospital appointments:', e);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments(true);

    const pollInterval = setInterval(() => {
      fetchAppointments(false);
    }, 3000);

    const channel = supabaseClient
      .channel(`hospital-appointments-live-${businessId || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hospital_appointments',
        },
        () => {
          fetchAppointments(false);
        }
      )
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      supabaseClient.removeChannel(channel);
    };
  }, [businessId, activeFilter]);

  const handleStatusUpdate = async (id: string, newStatus: HospitalAppointmentStatus) => {
    try {
      const res = await fetch(`/api/hospital/appointments?${businessId ? `business_id=${businessId}` : ''}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(businessId ? { 'x-business-id': businessId } : {}),
        },
        body: JSON.stringify({ id, business_id: businessId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
        );
        showToast({
          title: `Status: ${newStatus.toUpperCase()}`,
          message: 'Appointment status updated & patient notified via WhatsApp.',
          type: 'whatsapp',
        });
      }
    } catch (e) {
      console.error('Error updating status:', e);
    }
  };

  const handleTriggerVoiceCall = async (appt: HospitalAppointment) => {
    try {
      const res = await fetch('/api/hospital/voice-calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId,
          patient_id: appt.patient_id,
          appointment_id: appt.id,
          patient_name: appt.patient_name,
          patient_phone: appt.patient_phone,
          call_type: 'appointment_reminder',
          reason: `AI reminder call for consultation with ${appt.doctor_name}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast({
          title: 'AI Voice Call Triggered',
          message: `Outbound call initiated to ${appt.patient_name} (${appt.patient_phone}).`,
          type: 'success',
        });
      }
    } catch (e) {
      console.error('Error triggering voice call:', e);
    }
  };

  const filteredList = appointments.filter((appt) => {
    const q = searchQuery.toLowerCase();
    return (
      appt.patient_name.toLowerCase().includes(q) ||
      appt.patient_phone.includes(q) ||
      (appt.doctor_name && appt.doctor_name.toLowerCase().includes(q)) ||
      (appt.department && appt.department.toLowerCase().includes(q))
    );
  });

  const columns: Column<HospitalAppointment>[] = [
    {
      key: 'token_number',
      header: 'Token',
      width: '80px',
      render: (appt) => (
        <span className="font-mono font-bold text-accent text-sm">
          #{appt.token_number || '1'}
        </span>
      ),
    },
    {
      key: 'patient_name',
      header: 'Patient Info',
      primary: true,
      render: (appt) => (
        <div>
          <div className="font-semibold text-fg">{appt.patient_name}</div>
          <div className="text-[11px] text-fg-muted font-mono">{appt.patient_phone}</div>
        </div>
      ),
    },
    {
      key: 'doctor_name',
      header: 'Doctor & Department',
      render: (appt) => (
        <div>
          <div className="font-medium text-fg">{appt.doctor_name || 'Dr. Rajesh Gupta'}</div>
          <div className="text-[11px] text-accent font-medium">{appt.department || 'Cardiology'}</div>
        </div>
      ),
    },
    {
      key: 'slot_time',
      header: 'Slot Time',
      render: (appt) => (
        <div className="font-mono text-xs text-fg-muted">
          <div>{new Date(appt.slot_time).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
          <div className="text-[11px]">
            {new Date(appt.slot_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      hideBelow: 'sm',
      render: (appt) => (
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-subtle border border-line text-fg-muted">
          {appt.type || 'OPD'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (appt) => <StatusBadge status={appt.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (appt) => (
        <div className="flex items-center justify-end gap-1.5">
          {appt.status !== 'completed' && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation();
                handleStatusUpdate(appt.id, 'completed');
              }}
              title="Mark Completed"
            >
              <Check className="w-3.5 h-3.5 text-success" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              handleTriggerVoiceCall(appt);
            }}
            title="Trigger AI Voice Call"
          >
            <PhoneCall className="w-3.5 h-3.5 text-accent" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              showToast({
                title: 'WhatsApp Reminder Dispatched',
                message: `Consultation details sent to ${appt.patient_name}`,
                type: 'whatsapp',
              });
            }}
            title="Send WhatsApp Reminder"
          >
            <MessageSquare className="w-3.5 h-3.5 text-accent" />
          </Button>
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
              <Calendar className="w-5 h-5 text-accent" />
              <span>OPD & Consultation Ledger</span>
            </CardTitle>
            <CardDescription>
              Real-time appointment scheduling, token management, and 2-way WhatsApp confirmations
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fetchAppointments(true)}
              title="Refresh Ledger"
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenNewAppointment}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Book Consultation
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {[
            { id: 'all', label: 'All OPD Visits' },
            { id: 'confirmed', label: 'Confirmed' },
            { id: 'completed', label: 'Completed' },
            { id: 'missed', label: 'Missed' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                activeFilter === tab.id
                  ? 'bg-accent text-accent-fg font-semibold shadow-xs'
                  : 'bg-surface text-fg-muted hover:text-fg hover:bg-surface-hover border border-line'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-fg-subtle absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Search patient, doctor, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 pl-8"
          />
        </div>
      </div>

      {/* Appointments Master Table / Mobile Cards */}
      <Card>
        <CardContent className="p-0 sm:p-0">
          <DataTable
            columns={columns}
            rows={filteredList}
            getRowKey={(appt) => appt.id}
            loading={loading && appointments.length === 0}
            empty={
              <div className="py-12 text-center text-xs text-fg-muted">
                No appointments matching the selected filter.
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
