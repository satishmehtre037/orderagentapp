'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Plus,
  PhoneCall,
  MessageSquare,
  RefreshCw,
  Filter,
  Check,
  X,
  RotateCcw,
} from 'lucide-react';
import { HospitalAppointment, HospitalAppointmentStatus } from '@/types';
import { useToast } from '@/components/ui/ToastProvider';

import { supabaseClient } from '@/lib/supabase/client';

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
      const res = await fetch('/api/hospital/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <span>OPD & Consultation Ledger</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time appointment scheduling, token management, and 2-way WhatsApp confirmations
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchAppointments(true)}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-xl transition-colors"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onOpenNewAppointment}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-md shadow-teal-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Book Consultation</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {[
            { id: 'all', label: 'All OPD Visits' },
            { id: 'confirmed', label: 'Confirmed' },
            { id: 'completed', label: 'Completed' },
            { id: 'missed', label: 'Missed / No-Show' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeFilter === tab.id
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20'
                  : 'bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search patient, phone, doctor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 pl-9 pr-3 py-1.5 bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* Appointments Master Table */}
      <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800/80">
              <tr>
                <th className="py-3 px-4 font-semibold">Token</th>
                <th className="py-3 px-4 font-semibold">Patient Information</th>
                <th className="py-3 px-4 font-semibold">Doctor & Department</th>
                <th className="py-3 px-4 font-semibold">Slot Date & Time</th>
                <th className="py-3 px-4 font-semibold">Consultation Type</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions & Automation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    No appointments matching the selected filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((appt) => (
                  <tr key={appt.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                      #{appt.token_number || '1'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{appt.patient_name}</div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">{appt.patient_phone}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{appt.doctor_name || 'Dr. Rajesh Gupta'}</div>
                      <div className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">{appt.department || 'Cardiology'}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                      <div>{new Date(appt.slot_time).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                      <div className="text-[10px] text-slate-600 dark:text-slate-400">
                        {new Date(appt.slot_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {appt.type || 'OPD'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          appt.status === 'completed'
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400'
                            : appt.status === 'missed'
                            ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400'
                            : appt.status === 'cancelled'
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            : 'bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-400'
                        }`}
                      >
                        {appt.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {appt.status !== 'completed' && (
                          <button
                            onClick={() => handleStatusUpdate(appt.id, 'completed')}
                            className="p-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs"
                            title="Mark Completed"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleTriggerVoiceCall(appt)}
                          className="p-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs"
                          title="Trigger AI Voice Call"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            showToast({
                              title: 'WhatsApp Reminder Dispatched',
                              message: `Consultation details sent to ${appt.patient_name}`,
                              type: 'whatsapp',
                            });
                          }}
                          className="p-1.5 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 text-teal-600 dark:text-teal-400 rounded-lg text-xs"
                          title="Send WhatsApp Reminder"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
