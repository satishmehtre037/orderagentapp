'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Calendar,
  HeartPulse,
  Droplet,
  ShieldAlert,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';
import { HospitalPatient } from '@/types';
import { useToast } from '@/components/ui/ToastProvider';

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

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/hospital/patients?${businessId ? `business_id=${businessId}&` : ''}search=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.patients)) {
        setPatients(data.patients);
      }
    } catch (e) {
      console.error('Error fetching patients:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [businessId, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Patient Health Directory</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Complete electronic medical records, blood profiles, and WhatsApp communication history
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchPatients}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-xl transition-colors"
            title="Refresh Directory"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onOpenNewPatient}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Register Patient</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 font-mono">
            {patients.length}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total Registered</div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
            {patients.filter((p) => p.status === 'Active' || !p.status).length}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Active Patients</div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-amber-500 font-mono">
            {patients.filter((p) => p.blood_group).length}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Blood Profile Logged</div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-teal-600 dark:text-teal-400 font-mono">
            {patients.filter((p) => p.phone).length}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">WhatsApp Connected</div>
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by patient name, phone number, or blood group (e.g. O+, B+)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Patient Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {patients.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl">
            No patient records found. Click &quot;+ Register Patient&quot; to add one.
          </div>
        ) : (
          patients.map((p) => (
            <div
              key={p.id}
              className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-indigo-500/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-teal-500 text-white font-bold flex items-center justify-center text-sm shadow-md">
                      {p.name ? p.name.charAt(0).toUpperCase() : 'P'}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{p.name}</h3>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{p.phone}</div>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400">
                    {p.status || 'Active'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                  <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-400">
                    <Droplet className="w-3.5 h-3.5 text-rose-500" />
                    <span>Blood: <strong className="text-slate-900 dark:text-white font-mono">{p.blood_group || 'O+'}</strong></span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-400">
                    <HeartPulse className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Age/Gender: <strong className="text-slate-900 dark:text-white">{p.age ? `${p.age}y` : 'Adult'} • {p.gender || 'Other'}</strong></span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-400 col-span-2">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                    <span>Emergency Contact: <strong className="text-slate-900 dark:text-white font-mono">{p.emergency_contact || 'None'}</strong></span>
                  </div>
                </div>

                {p.medical_history && (
                  <div className="mt-3 p-2 bg-slate-50 dark:bg-slate-950/60 rounded-xl text-[11px] text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-800/60">
                    <span className="font-semibold text-slate-900 dark:text-white">Medical Notes: </span>
                    {p.medical_history}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  Last visit: {p.last_visit ? new Date(p.last_visit).toLocaleDateString() : 'Recent'}
                </span>
                <button
                  onClick={() => {
                    showToast({
                      title: 'Opening WhatsApp Chat',
                      message: `Connecting with ${p.name} on ${p.phone}`,
                      type: 'whatsapp',
                    });
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 text-teal-600 dark:text-teal-400 rounded-xl text-xs font-semibold transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
