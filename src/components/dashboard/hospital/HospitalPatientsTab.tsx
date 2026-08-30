'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Droplet,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';
import { HospitalPatient } from '@/types';
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
  Input,
  type Column,
} from '@/components/ui';

interface HospitalPatientsTabProps {
  businessId?: string;
  onOpenNewPatient: () => void;
}

export default function HospitalPatientsTab({
  businessId,
  onOpenNewPatient,
}: HospitalPatientsTabProps) {
  const [patients, setPatients] = useState<HospitalPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const { showToast } = useToast();

  const fetchPatients = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await fetch(`/api/hospital/patients?${businessId ? `business_id=${businessId}&` : ''}search=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.patients)) {
        setPatients(data.patients);
      }
    } catch (e) {
      console.error('Error fetching patients:', e);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients(true);

    const pollInterval = setInterval(() => {
      fetchPatients(false);
    }, 3000);

    const channel = supabaseClient
      .channel(`hospital-patients-live-${businessId || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hospital_patients',
        },
        () => {
          fetchPatients(false);
        }
      )
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      supabaseClient.removeChannel(channel);
    };
  }, [businessId, searchQuery]);

  const columns: Column<HospitalPatient>[] = [
    {
      key: 'name',
      header: 'Patient Name & Contact',
      primary: true,
      render: (patient) => (
        <div>
          <div className="font-semibold text-fg">{patient.name}</div>
          <div className="text-[11px] text-fg-muted font-mono">{patient.phone}</div>
          {patient.email && <div className="text-[10px] text-fg-subtle">{patient.email}</div>}
        </div>
      ),
    },
    {
      key: 'demographics',
      header: 'Demographics',
      render: (patient) => (
        <div className="text-xs text-fg">
          <span>{patient.gender || 'Unknown'}</span>
          {patient.age && <span className="text-fg-muted"> • {patient.age} yrs</span>}
        </div>
      ),
    },
    {
      key: 'blood_group',
      header: 'Blood Group',
      render: (patient) => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-bold bg-danger-subtle text-danger border border-danger-border">
          <Droplet className="w-3 h-3" />
          {patient.blood_group || 'O+'}
        </span>
      ),
    },
    {
      key: 'medical_history',
      header: 'Clinical Summary & Allergies',
      hideBelow: 'sm',
      render: (patient) => (
        <div className="max-w-xs truncate text-xs text-fg-muted" title={patient.medical_history || 'No recorded allergies'}>
          {patient.medical_history || <span className="text-fg-subtle">No allergies recorded</span>}
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Registered',
      hideBelow: 'md',
      render: (patient) => (
        <span className="text-xs font-mono text-fg-muted">
          {new Date(patient.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (patient) => (
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              showToast({
                title: 'WhatsApp Portal Opened',
                message: `Connecting to ${patient.name} on WhatsApp...`,
                type: 'whatsapp',
              });
            }}
            title="Open WhatsApp Chat"
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
              <Users className="w-5 h-5 text-accent" />
              <span>Patient Health Directory</span>
            </CardTitle>
            <CardDescription>
              Complete electronic medical records, blood profiles, and WhatsApp communication history
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fetchPatients(true)}
              title="Refresh Directory"
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenNewPatient}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              + Register Patient
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-3.5 h-3.5 text-fg-subtle absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          type="text"
          placeholder="Search by patient name, mobile, email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8"
        />
      </div>

      {/* Patients Table / Mobile Cards */}
      <Card>
        <CardContent className="p-0 sm:p-0">
          <DataTable
            columns={columns}
            rows={patients}
            getRowKey={(patient) => patient.id}
            loading={loading && patients.length === 0}
            empty={
              <div className="py-12 text-center text-xs text-fg-muted">
                No patients found in directory.
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
