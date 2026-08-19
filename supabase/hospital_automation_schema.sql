-- ==============================================================================
-- HOSPITAL & CLINIC AI AUTOMATION SUITE — SUPABASE SQL SCHEMA
-- Matches HospitalMN8nWorkflow.json (Appointments, Patients, Doctors, Reports, Voice Calls, Feedback)
-- ==============================================================================

-- 0. Update Businesses category check constraint to support 'clinic' and 'hospital'
ALTER TABLE public.businesses DROP CONSTRAINT IF EXISTS businesses_category_check;
ALTER TABLE public.businesses ADD CONSTRAINT businesses_category_check CHECK (category IN ('bakery', 'cafe', 'salon', 'gym', 'tuition', 'clinic', 'hospital', 'real_estate', 'retail', 'ca_firm'));

-- 1. Hospital Patients Table
CREATE TABLE IF NOT EXISTS public.hospital_patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    gender TEXT DEFAULT 'Other', -- Male, Female, Other
    age INT,
    blood_group TEXT, -- A+, A-, B+, B-, O+, O-, AB+, AB-
    emergency_contact TEXT,
    address TEXT,
    medical_history TEXT,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    last_visit TIMESTAMPTZ,
    status TEXT DEFAULT 'Active', -- Active, Inactive
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hospital_patients_phone ON public.hospital_patients(phone);
CREATE INDEX IF NOT EXISTS idx_hospital_patients_business_id ON public.hospital_patients(business_id);

-- 2. Hospital Doctors Table
CREATE TABLE IF NOT EXISTS public.hospital_doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    department TEXT NOT NULL, -- Cardiology, Neurology, Orthopedics, Pediatrics, General Medicine, Dermatology, Gynecology, Oncology
    specialization TEXT,
    fee INT DEFAULT 500,
    available_days TEXT DEFAULT 'Mon,Tue,Wed,Thu,Fri,Sat',
    start_time TEXT DEFAULT '09:00',
    end_time TEXT DEFAULT '17:00',
    slot_duration_minutes INT DEFAULT 15,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hospital_doctors_business_id ON public.hospital_doctors(business_id);
CREATE INDEX IF NOT EXISTS idx_hospital_doctors_department ON public.hospital_doctors(department);

-- 3. Hospital Appointments Table
CREATE TABLE IF NOT EXISTS public.hospital_appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.hospital_patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.hospital_doctors(id) ON DELETE SET NULL,
    patient_name TEXT NOT NULL,
    patient_phone TEXT NOT NULL,
    doctor_name TEXT,
    department TEXT,
    slot_time TIMESTAMPTZ NOT NULL,
    token_number INT,
    status TEXT DEFAULT 'confirmed', -- confirmed, completed, cancelled, rescheduled, missed
    type TEXT DEFAULT 'OPD', -- OPD, Video Consult, Emergency, Follow-up
    source TEXT DEFAULT 'whatsapp', -- whatsapp, web, call, walk_in
    reminder_24h_sent BOOLEAN DEFAULT false,
    reminder_2h_sent BOOLEAN DEFAULT false,
    rescheduled BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hospital_appt_slot_time ON public.hospital_appointments(slot_time);
CREATE INDEX IF NOT EXISTS idx_hospital_appt_status ON public.hospital_appointments(status);
CREATE INDEX IF NOT EXISTS idx_hospital_appt_patient_id ON public.hospital_appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_hospital_appt_doctor_id ON public.hospital_appointments(doctor_id);

-- 4. Hospital Reports & Lab Diagnostics Table
CREATE TABLE IF NOT EXISTS public.hospital_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.hospital_patients(id) ON DELETE CASCADE,
    patient_name TEXT NOT NULL,
    patient_phone TEXT NOT NULL,
    doctor_name TEXT,
    report_type TEXT NOT NULL, -- Complete Blood Count (CBC), Lipid Profile, Chest X-Ray, Brain MRI, Liver Function Test (LFT), Kidney Function Test (KFT), COVID-19 RT-PCR, ECG
    file_url TEXT,
    ai_summary TEXT,
    is_critical BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'Ready', -- Pending, Ready, Delivered
    delivered_via_wa BOOLEAN DEFAULT false,
    delivered_at TIMESTAMPTZ,
    test_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hospital_reports_patient_id ON public.hospital_reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_hospital_reports_is_critical ON public.hospital_reports(is_critical);

-- 5. Hospital AI Voice Calls Table
CREATE TABLE IF NOT EXISTS public.hospital_voice_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.hospital_patients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.hospital_appointments(id) ON DELETE SET NULL,
    patient_name TEXT NOT NULL,
    patient_phone TEXT NOT NULL,
    call_type TEXT NOT NULL, -- appointment_reminder, missed_followup, critical_report_alert, patient_requested
    status TEXT DEFAULT 'completed', -- queued, in_progress, completed, failed, no_answer
    outcome TEXT DEFAULT 'confirmed', -- confirmed, reschedule_requested, cancelled, no_answer, failed
    duration_seconds INT DEFAULT 45,
    transcript_summary TEXT,
    recording_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hospital_voice_patient_id ON public.hospital_voice_calls(patient_id);
CREATE INDEX IF NOT EXISTS idx_hospital_voice_status ON public.hospital_voice_calls(status);

-- 6. Hospital Feedback & Reviews Table
CREATE TABLE IF NOT EXISTS public.hospital_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.hospital_patients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.hospital_appointments(id) ON DELETE SET NULL,
    patient_name TEXT NOT NULL,
    patient_phone TEXT NOT NULL,
    doctor_name TEXT,
    rating INT, -- 1, 2, 3, 4, 5
    comment TEXT,
    status TEXT DEFAULT 'pending', -- pending, responded, escalated
    google_review_requested BOOLEAN DEFAULT false,
    apology_sent BOOLEAN DEFAULT false,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_hospital_feedback_patient_phone ON public.hospital_feedback(patient_phone);
CREATE INDEX IF NOT EXISTS idx_hospital_feedback_rating ON public.hospital_feedback(rating);

-- 7. Hospital Escalations Table
CREATE TABLE IF NOT EXISTS public.hospital_escalations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    patient_phone TEXT NOT NULL,
    reason TEXT NOT NULL,
    urgency TEXT DEFAULT 'normal', -- normal, urgent, emergency
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.hospital_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_voice_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_escalations ENABLE ROW LEVEL SECURITY;

-- Allow public service role access & authenticated access
CREATE POLICY "Allow service role full access hospital_patients" ON public.hospital_patients FOR ALL USING (true);
CREATE POLICY "Allow service role full access hospital_doctors" ON public.hospital_doctors FOR ALL USING (true);
CREATE POLICY "Allow service role full access hospital_appointments" ON public.hospital_appointments FOR ALL USING (true);
CREATE POLICY "Allow service role full access hospital_reports" ON public.hospital_reports FOR ALL USING (true);
CREATE POLICY "Allow service role full access hospital_voice_calls" ON public.hospital_voice_calls FOR ALL USING (true);
CREATE POLICY "Allow service role full access hospital_feedback" ON public.hospital_feedback FOR ALL USING (true);
CREATE POLICY "Allow service role full access hospital_escalations" ON public.hospital_escalations FOR ALL USING (true);
