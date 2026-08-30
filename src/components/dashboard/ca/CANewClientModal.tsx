'use client';

import React, { useState } from 'react';
import { UserPlus, CheckCircle2 } from 'lucide-react';
import type { CAEntityType } from '@/types';
import { Modal, Button, Input, Select, Label } from '@/components/ui';

interface CANewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientAdded?: () => void;
  businessId?: string;
  businessName?: string;
}

export default function CANewClientModal({
  isOpen,
  onClose,
  onClientAdded,
  businessId,
  businessName = 'Apex Tax & Financial Advisors',
}: CANewClientModalProps) {
  const [clientName, setClientName] = useState('');
  const [entityType, setEntityType] = useState<CAEntityType>('Private Limited' as any);
  const [pan, setPan] = useState('');
  const [gstin, setGstin] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([
    'GST Filing',
    'ITR Filing',
    'ROC / MCA Compliance',
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const SERVICES_LIST = [
    'GST Filing',
    'ITR Filing',
    'TDS Compliance',
    'ROC / MCA Compliance',
    'Statutory & Tax Audit',
    'Bookkeeping & Accounting',
    'Startup Registration',
    'Trademark & IP',
  ];

  const toggleService = (svc: string) => {
    if (selectedServices.includes(svc)) {
      setSelectedServices(selectedServices.filter((s) => s !== svc));
    } else {
      setSelectedServices([...selectedServices, svc]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !phone.trim()) {
      setErrorMsg('Client Name and WhatsApp Phone are required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/ca/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId,
          client_name: clientName.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          pan: pan.trim() || undefined,
          gstin: gstin.trim() || undefined,
          entity_type: entityType,
          requirement: selectedServices.join(', '),
          notes: `Registered via CRM Dashboard. Services: ${selectedServices.join(', ')}`,
          firm_name: businessName,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to add client');
      }

      if (onClientAdded) onClientAdded();
      onClose();
      // Reset form
      setClientName('');
      setPan('');
      setGstin('');
      setPhone('');
      setEmail('');
    } catch (err: any) {
      console.error('Error adding new client:', err);
      setErrorMsg(err.message || 'Failed to save client');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="+ Onboard New Client Entity"
      description="Register into Compliance Directory & activate WhatsApp AI automation"
      icon={<UserPlus className="text-accent" />}
      size="lg"
      mobile="sheet"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            loading={submitting}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            Onboard Client Entity
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errorMsg && (
          <div className="p-3 bg-danger-subtle border border-danger-border rounded-md text-xs text-danger font-medium">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="mb-1 block">Client / Firm Legal Name *</Label>
            <Input
              required
              placeholder="e.g. Apex Enterprises Pvt Ltd"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-1 block">Entity Structure *</Label>
            <Select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value as any)}
            >
              <option value="Private Limited">Private Limited Company</option>
              <option value="Proprietorship">Proprietorship Firm</option>
              <option value="Partnership">Partnership Firm</option>
              <option value="LLP">Limited Liability Partnership (LLP)</option>
              <option value="Individual">Individual (Salaried / Professional)</option>
              <option value="Public Limited">Public Limited Company</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="mb-1 block">Permanent Account Number (PAN)</Label>
            <Input
              placeholder="e.g. AABCM1234F"
              value={pan}
              onChange={(e) => setPan(e.target.value.toUpperCase())}
              className="uppercase font-mono"
            />
          </div>
          <div>
            <Label className="mb-1 block">GSTIN (Optional)</Label>
            <Input
              placeholder="e.g. 23AABCM1234F1Z5"
              value={gstin}
              onChange={(e) => setGstin(e.target.value.toUpperCase())}
              className="uppercase font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="mb-1 block">WhatsApp Phone Number *</Label>
            <Input
              required
              placeholder="919876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-1 block">Email Address (Optional)</Label>
            <Input
              type="email"
              placeholder="client@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label className="mb-2 block">Statutory Services Required</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SERVICES_LIST.map((svc) => {
              const isChecked = selectedServices.includes(svc);
              return (
                <button
                  key={svc}
                  type="button"
                  onClick={() => toggleService(svc)}
                  className={`px-3 py-2 rounded-md text-left font-medium border transition-colors flex items-center justify-between text-xs ${
                    isChecked
                      ? 'bg-accent-subtle border-accent-border text-accent font-semibold shadow-xs'
                      : 'bg-surface border-line text-fg hover:border-line-strong'
                  }`}
                >
                  <span className="truncate pr-1">{svc}</span>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    readOnly
                    className="rounded text-accent shrink-0"
                  />
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-3 bg-accent-subtle rounded-md border border-accent-border text-xs text-accent flex items-center space-x-2">
          <span className="text-base shrink-0">🤖</span>
          <span>Registration automatically schedules statutory deadlines in your Compliance Calendar and delivers a formal WhatsApp Engagement Letter!</span>
        </div>
      </form>
    </Modal>
  );
}
