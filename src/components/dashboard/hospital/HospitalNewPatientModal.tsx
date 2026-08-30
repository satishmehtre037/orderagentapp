'use client';

import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { Modal, Button, Input, Select, Textarea, Label } from '@/components/ui';

interface HospitalNewPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  businessId?: string;
}

export default function HospitalNewPatientModal({
  isOpen,
  onClose,
  onSuccess,
  businessId,
}: HospitalNewPatientModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [age, setAge] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [address, setAddress] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [loading, setLoading] = useState(false);

  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    try {
      setLoading(true);
      const res = await fetch('/api/hospital/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId,
          name,
          phone,
          email,
          gender,
          age,
          blood_group: bloodGroup,
          emergency_contact: emergencyContact,
          address,
          medical_history: medicalHistory,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast({
          title: 'Patient Registered!',
          message: `${name} has been enrolled & welcome message sent via WhatsApp.`,
          type: 'whatsapp',
        });
        onSuccess();
        onClose();
      } else {
        showToast({ title: 'Registration Failed', message: data.error || 'Could not register patient.', type: 'error' });
      }
    } catch (e: any) {
      console.error('Error registering patient:', e);
      showToast({ title: 'Registration Error', message: e.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Register New Patient Record"
      description="Creates electronic health record and connects WhatsApp assistant"
      icon={<UserPlus className="text-accent" />}
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
            Save & Enroll Patient
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="mb-1 block">Full Name *</Label>
            <Input
              required
              placeholder="e.g. Sumanth Varma"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-1 block">WhatsApp Mobile *</Label>
            <Input
              required
              placeholder="919876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Label className="mb-1 block">Gender</Label>
            <Select
              value={gender}
              onChange={(e) => setGender(e.target.value as any)}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </Select>
          </div>
          <div>
            <Label className="mb-1 block">Age (Years)</Label>
            <Input
              type="number"
              placeholder="42"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-1 block">Blood Group</Label>
            <Select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
            >
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="mb-1 block">Email (Optional)</Label>
            <Input
              type="email"
              placeholder="patient@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-1 block">Emergency Contact</Label>
            <Input
              placeholder="919876543211 (Spouse / Guardian)"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label className="mb-1 block">Residential Address</Label>
          <Input
            placeholder="e.g. 102, Green Avenue, Indiranagar, Bengaluru"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <div>
          <Label className="mb-1 block">Known Medical History / Allergies</Label>
          <Textarea
            rows={2}
            placeholder="e.g. Hypertension since 5 years, Penicillin allergy..."
            value={medicalHistory}
            onChange={(e) => setMedicalHistory(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}
