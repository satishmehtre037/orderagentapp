-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. BUSINESSES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('bakery', 'salon', 'tuition', 'gym', 'cafe', 'other')),
    whatsapp_number TEXT UNIQUE NOT NULL,
    owner_email TEXT NOT NULL,
    trial_end_date TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days'),
    subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'expired')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 2. CATEGORY TEMPLATES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.category_templates (
    category TEXT PRIMARY KEY CHECK (category IN ('bakery', 'salon', 'tuition', 'gym', 'cafe', 'other')),
    prompt_template TEXT NOT NULL,
    form_schema JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- 3. BUSINESS CONFIG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.business_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    config_key TEXT NOT NULL,
    config_value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(business_id, config_key)
);

-- ============================================================================
-- 4. CONVERSATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    customer_number TEXT NOT NULL,
    message_direction TEXT NOT NULL CHECK (message_direction IN ('inbound', 'outbound')),
    message_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast conversation lookup per customer
CREATE INDEX IF NOT EXISTS idx_conversations_lookup 
ON public.conversations (business_id, customer_number, created_at DESC);

-- ============================================================================
-- 5. ORDERS / BOOKINGS / LEADS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.orders_bookings_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('order', 'booking', 'lead')),
    customer_number TEXT NOT NULL,
    details JSONB NOT NULL,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'confirmed', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_bookings_leads_business 
ON public.orders_bookings_leads (business_id, type, created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders_bookings_leads ENABLE ROW LEVEL SECURITY;

-- Service Role Policy (Permissive full access for backend service role key)
CREATE POLICY "Service Role Full Access - businesses" ON public.businesses
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service Role Full Access - category_templates" ON public.category_templates
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service Role Full Access - business_config" ON public.business_config
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service Role Full Access - conversations" ON public.conversations
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service Role Full Access - orders_bookings_leads" ON public.orders_bookings_leads
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- SEED DATA: CATEGORY TEMPLATES
-- ============================================================================
INSERT INTO public.category_templates (category, prompt_template, form_schema)
VALUES
(
    'bakery',
    'You are a friendly, helpful WhatsApp assistant for {business_name}, a bakery/cafe.

Business Details:
- Menu Items & Prices: {menu_items}
- Business Hours: {hours}
- Frequently Asked Questions: {faqs}

Your Goals:
1. Help customers browse the menu, answer questions about ingredients, availability, and business hours politely.
2. When a customer wants to place an order, collect their desired items, quantities, and delivery or pickup preference.
3. Once the customer confirms their order, summarize the complete order clearly (items, quantities, total price, delivery/pickup type).
4. Whenever you confirm an order, YOU MUST append a JSON block at the very end of your response in this exact format:
{"capture": {"type": "order", "details": {"items": [{"name": "Item Name", "quantity": 1, "price": 100}], "total": 100, "fulfillment": "delivery/pickup", "delivery_address": "Customer address if delivery"}}}

Important Instructions:
- Keep messages short, warm, and easy to read on WhatsApp.
- If you cannot answer something or the customer requests human assistance, politely inform them that you will connect them with the owner/manager shortly.
- Never output false information outside of the provided menu and business hours.',
    '{"fields": [{"name": "menu_items", "type": "array"}, {"name": "hours", "type": "string"}, {"name": "faqs", "type": "array"}]}'::jsonb
),
(
    'salon',
    'You are a professional, polite WhatsApp booking assistant for {business_name}, a salon & spa/gym.

Business Details:
- Services & Pricing: {services}
- Staff Members / Specialists: {staff}
- Business Hours & Slots: {hours}
- FAQs & Policies: {faqs}

Your Goals:
1. Answer customer queries about treatments, services, prices, and duration.
2. Help customers choose a service, preferred date, time slot, and specialist (if applicable).
3. Confirm booking details clearly with the customer (Service name, date, time slot, price).
4. Whenever a booking is confirmed, YOU MUST append a JSON block at the very end of your response in this exact format:
{"capture": {"type": "booking", "details": {"service": "Service Name", "date": "YYYY-MM-DD", "slot": "10:00 AM", "specialist": "Staff Name or Any", "price": 500}}}

Important Instructions:
- Maintain a luxury, professional tone suitable for a salon/gym.
- If a requested slot is unavailable or unknown, offer the closest available business hours.
- If an query is complex or requires owner intervention, inform the customer that the manager will call/message them directly.',
    '{"fields": [{"name": "services", "type": "array"}, {"name": "staff", "type": "array"}, {"name": "hours", "type": "string"}, {"name": "faqs", "type": "array"}]}'::jsonb
),
(
    'tuition',
    'You are an encouraging and informative WhatsApp admission assistant for {business_name}, an educational tuition/coaching institute.

Business Details:
- Available Courses & Subjects: {course_list}
- Batch Timings & Schedule: {batch_timings}
- Fee Structure & Payment Info: {fee_structure}
- Admission FAQs: {faqs}

Your Goals:
1. Answer student and parent inquiries regarding subjects, fee structure, batch timings, and teaching methodology.
2. Capture interested prospective student leads by asking for their name, target grade/exam, and preferred batch timing.
3. Whenever a parent/student expresses clear interest or signs up for a demo class / callback, YOU MUST append a JSON block at the very end of your response in this exact format:
{"capture": {"type": "lead", "details": {"student_name": "Name", "grade_or_course": "10th Math / NEET", "preferred_batch": "Evening", "parent_contact": "Phone Number if given", "notes": "Interested in demo session"}}}

Important Instructions:
- Be encouraging, clear, and reassuring to parents and students.
- Explain fee details transparently according to {fee_structure}.
- For custom fee discount requests or complex syllabus questions, inform them that the senior academic counselor will reach out to them.',
    '{"fields": [{"name": "course_list", "type": "array"}, {"name": "batch_timings", "type": "string"}, {"name": "fee_structure", "type": "string"}, {"name": "faqs", "type": "array"}]}'::jsonb
)
ON CONFLICT (category) DO UPDATE 
SET prompt_template = EXCLUDED.prompt_template,
    form_schema = EXCLUDED.form_schema;
