-- ============================================================================
-- Supabase Security & Multi-Tenant Hardening Migration
-- ============================================================================

-- 1. HOSPITAL AUTOMATION TABLES: Restrict RLS to service_role & authenticated tenant owners
DROP POLICY IF EXISTS "Allow service role full access hospital_patients" ON public.hospital_patients;
DROP POLICY IF EXISTS "Allow service role full access hospital_doctors" ON public.hospital_doctors;
DROP POLICY IF EXISTS "Allow service role full access hospital_appointments" ON public.hospital_appointments;
DROP POLICY IF EXISTS "Allow service role full access hospital_reports" ON public.hospital_reports;
DROP POLICY IF EXISTS "Allow service role full access hospital_voice_calls" ON public.hospital_voice_calls;
DROP POLICY IF EXISTS "Allow service role full access hospital_feedback" ON public.hospital_feedback;
DROP POLICY IF EXISTS "Allow service role full access hospital_escalations" ON public.hospital_escalations;

-- Service role full access
CREATE POLICY "service_role_full_access_hospital_patients" ON public.hospital_patients TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access_hospital_doctors" ON public.hospital_doctors TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access_hospital_appointments" ON public.hospital_appointments TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access_hospital_reports" ON public.hospital_reports TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access_hospital_voice_calls" ON public.hospital_voice_calls TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access_hospital_feedback" ON public.hospital_feedback TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access_hospital_escalations" ON public.hospital_escalations TO service_role USING (true) WITH CHECK (true);

-- Authenticated tenant user access (Scoped by business owner)
CREATE POLICY "authenticated_tenant_access_hospital_patients" ON public.hospital_patients
  FOR ALL TO authenticated
  USING (business_id IN (SELECT id FROM public.businesses WHERE owner_email = auth.jwt() ->> 'email'))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_email = auth.jwt() ->> 'email'));

CREATE POLICY "authenticated_tenant_access_hospital_doctors" ON public.hospital_doctors
  FOR ALL TO authenticated
  USING (business_id IN (SELECT id FROM public.businesses WHERE owner_email = auth.jwt() ->> 'email'))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_email = auth.jwt() ->> 'email'));

CREATE POLICY "authenticated_tenant_access_hospital_appointments" ON public.hospital_appointments
  FOR ALL TO authenticated
  USING (business_id IN (SELECT id FROM public.businesses WHERE owner_email = auth.jwt() ->> 'email'))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_email = auth.jwt() ->> 'email'));

-- 2. CA AUTOMATION TABLES: Restrict RLS
DROP POLICY IF EXISTS "Allow service role full access ca_clients" ON public.ca_clients;
DROP POLICY IF EXISTS "Allow service role full access ca_compliance_calendar" ON public.ca_compliance_calendar;
DROP POLICY IF EXISTS "Allow service role full access ca_documents_tracker" ON public.ca_documents_tracker;
DROP POLICY IF EXISTS "Allow service role full access ca_leads" ON public.ca_leads;
DROP POLICY IF EXISTS "Allow service role full access ca_query_logs" ON public.ca_query_logs;

CREATE POLICY "service_role_full_access_ca_clients" ON public.ca_clients TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access_ca_compliance_calendar" ON public.ca_compliance_calendar TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access_ca_documents_tracker" ON public.ca_documents_tracker TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access_ca_leads" ON public.ca_leads TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_full_access_ca_query_logs" ON public.ca_query_logs TO service_role USING (true) WITH CHECK (true);

-- 3. UNIQUE CONSTRAINTS FOR TENANT ISOLATION & RELIABILITY
-- Fix patient cross-tenant upsert collision: phone scoped by business
CREATE UNIQUE INDEX IF NOT EXISTS idx_hospital_patients_business_phone ON public.hospital_patients(business_id, phone);

-- Fix double-booking collision: doctor cannot have two active appointments at the exact same slot time
CREATE UNIQUE INDEX IF NOT EXISTS idx_hospital_appointments_no_double_booking 
  ON public.hospital_appointments(business_id, doctor_name, slot_time)
  WHERE status != 'cancelled';
