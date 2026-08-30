'use client';

import React, { useState } from 'react';
import { FileUp } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { Modal, Button, Input, Select, Textarea, Label, Checkbox } from '@/components/ui';

interface HospitalUploadReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  businessId?: string;
}

export default function HospitalUploadReportModal({
  isOpen,
  onClose,
  onSuccess,
  businessId,
}: HospitalUploadReportModalProps) {
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [doctorName, setDoctorName] = useState('Dr. Rajesh Gupta');
  const [reportType, setReportType] = useState('Complete Blood Count (CBC)');
  const [fileUrl, setFileUrl] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [isCritical, setIsCritical] = useState(false);
  const [loading, setLoading] = useState(false);

  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !patientPhone || !reportType) return;

    try {
      setLoading(true);
      const res = await fetch('/api/hospital/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId,
          patient_name: patientName,
          patient_phone: patientPhone,
          doctor_name: doctorName,
          report_type: reportType,
          file_url: fileUrl || `https://medicare.hospital/reports/REP-${Math.floor(1000 + Math.random() * 9000)}.pdf`,
          ai_summary: aiSummary,
          is_critical: isCritical,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast({
          title: isCritical ? '🚨 Critical Lab Report Dispatched!' : '📄 Lab Report Published!',
          message: `${reportType} sent to ${patientName} via WhatsApp with secure PDF token.`,
          type: isCritical ? 'error' : 'whatsapp',
        });
        onSuccess();
        onClose();
      } else {
        showToast({ title: 'Upload Failed', message: data.error || 'Could not publish report.', type: 'error' });
      }
    } catch (e: any) {
      console.error('Error uploading report:', e);
      showToast({ title: 'Upload Error', message: e.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Publish Diagnostic Lab Report"
      description="Generates AI OCR summary and delivers PDF to patient on WhatsApp"
      icon={<FileUp className="text-accent" />}
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
            Publish & Send WhatsApp PDF
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
              placeholder="e.g. Meenakshi Sundaram"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-1 block">Patient WhatsApp Mobile *</Label>
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
            <Label className="mb-1 block">Referring / Reviewing Doctor</Label>
            <Select
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
            >
              <option value="Dr. Rajesh Gupta">Dr. Rajesh Gupta (Cardiology)</option>
              <option value="Dr. Priya Sharma">Dr. Priya Sharma (General Medicine)</option>
              <option value="Dr. Vikram Patel">Dr. Vikram Patel (Orthopedics)</option>
              <option value="Dr. Anita Desai">Dr. Anita Desai (Gynecology)</option>
            </Select>
          </div>
          <div>
            <Label className="mb-1 block">Investigation / Report Category *</Label>
            <Select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="Complete Blood Count (CBC)">Complete Blood Count (CBC)</option>
              <option value="Lipid Profile">Lipid Profile</option>
              <option value="HbA1c / Blood Glucose">HbA1c / Blood Glucose</option>
              <option value="Thyroid Profile (T3, T4, TSH)">Thyroid Profile (T3, T4, TSH)</option>
              <option value="Liver Function Test (LFT)">Liver Function Test (LFT)</option>
              <option value="Kidney Function Test (KFT)">Kidney Function Test (KFT)</option>
              <option value="Chest X-Ray / CT Scan">Chest X-Ray / CT Scan</option>
              <option value="ECG / 2D Echocardiogram">ECG / 2D Echocardiogram</option>
            </Select>
          </div>
        </div>

        <div>
          <Label className="mb-1 block">Report PDF URL / Cloud Storage Path</Label>
          <Input
            type="url"
            placeholder="https://hospital-storage.com/reports/sample.pdf (Leave blank for mock link)"
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
          />
        </div>

        <div>
          <Label className="mb-1 block">AI Clinical Summary / Key Findings</Label>
          <Textarea
            rows={2}
            placeholder="e.g. All parameters within normal limits. Fasting blood sugar slightly elevated at 112 mg/dL."
            value={aiSummary}
            onChange={(e) => setAiSummary(e.target.value)}
          />
        </div>

        <div className="p-3 bg-danger-subtle rounded-md border border-danger-border flex items-center justify-between">
          <div>
            <div className="font-semibold text-danger text-xs">Flag as Critical / Urgent Attention Required</div>
            <div className="text-[11px] text-danger/80">Triggers an immediate high-priority alert to the patient and attending doctor</div>
          </div>
          <Checkbox
            checked={isCritical}
            onChange={(e) => setIsCritical(e.target.checked)}
          />
        </div>
      </form>
    </Modal>
  );
}
