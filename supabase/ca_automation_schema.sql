-- ==============================================================================
-- CA FIRM AUTOMATION SUITE — SUPABASE SQL SCHEMA
-- Replaces n8n Google Sheets (Clients, Compliance_Calendar, Documents_Tracker, Leads, Query_Log)
-- ==============================================================================

-- 0. Update Businesses category check constraint to support 'ca_firm'
ALTER TABLE public.businesses DROP CONSTRAINT IF EXISTS businesses_category_check;
ALTER TABLE public.businesses ADD CONSTRAINT businesses_category_check CHECK (category IN ('bakery', 'cafe', 'salon', 'gym', 'tuition', 'clinic', 'real_estate', 'retail', 'ca_firm'));

-- 1. CA Clients Table
CREATE TABLE IF NOT EXISTS public.ca_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    pan_gstin TEXT,
    entity_type TEXT DEFAULT 'Proprietorship', -- Individual, Proprietorship, Partnership, Company, LLP
    partner_assigned TEXT,
    status TEXT DEFAULT 'Active', -- Active, Inactive, Suspended
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for instant phone and email lookup
CREATE INDEX IF NOT EXISTS idx_ca_clients_phone ON public.ca_clients(phone);
CREATE INDEX IF NOT EXISTS idx_ca_clients_email ON public.ca_clients(email);
CREATE INDEX IF NOT EXISTS idx_ca_clients_business_id ON public.ca_clients(business_id);

-- 2. Compliance Calendar Table
CREATE TABLE IF NOT EXISTS public.ca_compliance_calendar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.ca_clients(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    compliance_type TEXT NOT NULL, -- GST-GSTR1, GST-3B, ITR-Individual, ITR-Corporate, TDS-Return, ROC-Annual, Advance-Tax
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'Pending', -- Pending, Filed, Overdue
    reminder_count INT DEFAULT 0,
    last_reminder_date TIMESTAMPTZ,
    filed_date TIMESTAMPTZ,
    acknowledgement_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ca_compliance_due_date ON public.ca_compliance_calendar(due_date);
CREATE INDEX IF NOT EXISTS idx_ca_compliance_status ON public.ca_compliance_calendar(status);
CREATE INDEX IF NOT EXISTS idx_ca_compliance_client_id ON public.ca_compliance_calendar(client_id);

-- 3. Documents Tracker Table
CREATE TABLE IF NOT EXISTS public.ca_documents_tracker (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.ca_clients(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    compliance_type TEXT NOT NULL,
    document_name TEXT NOT NULL, -- Bank Statement, Form 26AS, Purchase Invoices, Sales Register, etc.
    status TEXT DEFAULT 'Pending', -- Pending, Received, Verified, Rejected
    storage_url TEXT,
    requested_date TIMESTAMPTZ DEFAULT NOW(),
    received_date TIMESTAMPTZ,
    verified_date TIMESTAMPTZ,
    followup_count INT DEFAULT 0,
    last_followup_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ca_docs_status ON public.ca_documents_tracker(status);
CREATE INDEX IF NOT EXISTS idx_ca_docs_client_id ON public.ca_documents_tracker(client_id);
CREATE INDEX IF NOT EXISTS idx_ca_docs_phone ON public.ca_documents_tracker(phone);

-- 4. Leads Table
CREATE TABLE IF NOT EXISTS public.ca_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    source TEXT DEFAULT 'WhatsApp', -- WhatsApp, Website, Email, Referral
    requirement TEXT, -- GST Registration, ITR Filing, Company Incorporation, Tax Audit, Bookkeeping, ROC Compliance
    business_type TEXT, -- Individual, Proprietorship, Partnership, Company, Unclear
    urgency TEXT DEFAULT 'Unclear', -- High, Medium, Low, Unclear
    qualification_score TEXT DEFAULT 'Warm', -- Hot, Warm, Cold
    status TEXT DEFAULT 'New', -- New, Qualifying, Hot, In-Progress, Converted, Lost, Cold-Closed
    followup_date DATE,
    followup_attempts INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ca_leads_phone ON public.ca_leads(phone);
CREATE INDEX IF NOT EXISTS idx_ca_leads_score ON public.ca_leads(qualification_score);
CREATE INDEX IF NOT EXISTS idx_ca_leads_status ON public.ca_leads(status);
CREATE INDEX IF NOT EXISTS idx_ca_leads_followup ON public.ca_leads(followup_date);

-- 5. Query Logs Table (Multi-Channel Inquiries & AI Responses)
CREATE TABLE IF NOT EXISTS public.ca_query_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    client_id UUID,
    phone TEXT,
    email TEXT,
    channel TEXT NOT NULL, -- whatsapp, email, web
    query_text TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ca_query_logs_phone ON public.ca_query_logs(phone);
CREATE INDEX IF NOT EXISTS idx_ca_query_logs_email ON public.ca_query_logs(email);

-- Enable RLS
ALTER TABLE public.ca_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ca_compliance_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ca_documents_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ca_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ca_query_logs ENABLE ROW LEVEL SECURITY;

-- Allow public service role access & authenticated access
CREATE POLICY "Allow service role full access ca_clients" ON public.ca_clients FOR ALL USING (true);
CREATE POLICY "Allow service role full access ca_compliance_calendar" ON public.ca_compliance_calendar FOR ALL USING (true);
CREATE POLICY "Allow service role full access ca_documents_tracker" ON public.ca_documents_tracker FOR ALL USING (true);
CREATE POLICY "Allow service role full access ca_leads" ON public.ca_leads FOR ALL USING (true);
CREATE POLICY "Allow service role full access ca_query_logs" ON public.ca_query_logs FOR ALL USING (true);
