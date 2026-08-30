'use client';

import React, { useState } from 'react';
import { Calendar, Stethoscope } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { Modal, Button, Input, Select, Textarea, Label } from '@/components/ui';

interface HospitalNewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  businessId?: string;
}

export default function HospitalNewAppointmentModal({
  isOpen,
  onClose,
  onSuccess,
  businessId,
}: HospitalNewAppointmentModalProps) {
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [doctorName, setDoctorName] = useState('Dr. Rajesh Gupta');
  const [department, setDepartment] = useState('Cardiology');
  const [slotDate, setSlotDate] = useState(new Date().toISOString().split('T')[0]);
  const [slotTime, setSlotTime] = useState('10:30');
  const [consultType, setConsultType] = useState('OPD');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !patientPhone) return;

    try {
      setLoading(true);
      const combinedSlot = `${slotDate}T${slotTime}:00`;

      const res = await fetch('/api/hospital/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId,
          patient_name: patientName,
          patient_phone: patientPhone,
          doctor_name: doctorName,
          department: department,
          slot_time: combinedSlot,
          type: consultType,
          notes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast({
          title: 'Appointment Scheduled!',
          message: `Token #${data.appointment?.token_number || 1} assigned & confirmation sent via WhatsApp.`,
          type: 'whatsapp',
        });
        onSuccess();
        onClose();
      } else {
        showToast({ title: 'Booking Failed', message: data.error || 'Failed to book appointment.', type: 'error' });
      }
    } catch (e: any) {
      console.error('Error creating appointment:', e);
      showToast({ title: 'Booking Error', message: e.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Book Consultation & Token"
      description="Schedules OPD visit and dispatches token via WhatsApp"
      icon={<Calendar className="text-accent" />}
      size="lg"
      mobile="sheet"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            loading={loading}
          >
            Confirm & Send WhatsApp
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="mb-1 block">Patient Full Name *</Label>
            <Input
              required
              placeholder="e.g. Ramesh Kumar"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-1 block">WhatsApp Mobile Number *</Label>
            <Input
              required
              placeholder="919876543210"
              value={patientPhone}
              onChange={(e) => setPatientPhone(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="mb-1 block">Consulting Doctor</Label>
            <Select
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
            >
              <option value="Dr. Rajesh Gupta">Dr. Rajesh Gupta (Cardiology)</option>
              <option value="Dr. Priya Sharma">Dr. Priya Sharma (General Medicine)</option>
              <option value="Dr. Vikram Patel">Dr. Vikram Patel (Orthopedics)</option>
              <option value="Dr. Anita Desai">Dr. Anita Desai (Gynecology)</option>
              <option value="Dr. Sunita Rao">Dr. Sunita Rao (Pediatrics)</option>
            </Select>
          </div>
          <div>
            <Label className="mb-1 block">Department / Specialty</Label>
            <Select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="Cardiology">Cardiology</option>
              <option value="General Medicine">General Medicine</option>
              <option value="Orthopedics">Orthopedics</option>
              <option value="Gynecology">Gynecology</option>
              <option value="Pediatrics">Pediatrics</option>
              <option value="ENT">ENT</option>
              <option value="Dermatology">Dermatology</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Label className="mb-1 block">Slot Date</Label>
            <Input
              type="date"
              value={slotDate}
              onChange={(e) => setSlotDate(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-1 block">Slot Time</Label>
            <Input
              type="time"
              value={slotTime}
              onChange={(e) => setSlotTime(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-1 block">Visit Type</Label>
            <Select
              value={consultType}
              onChange={(e) => setConsultType(e.target.value)}
            >
              <option value="OPD">OPD Consultation</option>
              <option value="Follow-up">Follow-up Visit</option>
              <option value="Emergency">Emergency</option>
              <option value="Teleconsultation">Teleconsultation</option>
            </Select>
          </div>
        </div>

        <div>
          <Label className="mb-1 block">Chief Complaints / Clinical Notes</Label>
          <Textarea
            rows={3}
            placeholder="e.g. Chest discomfort since 2 days, previous ECG normal..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}
