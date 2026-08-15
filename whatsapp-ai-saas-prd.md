# Product Requirements Document
## WhatsApp AI Agent Platform for Local Businesses (working name: "BizBot OS")

---

## 1. Problem Statement

Small local businesses (bakeries, salons, clinics, tuition centers, real estate brokers) manage customer WhatsApp conversations manually — answering the same FAQs, taking orders/bookings, and following up on leads by hand. They lose time, miss messages, and lose customers to slow replies. Existing no-code WhatsApp bot builders (YourGPT, Gallabox, AiSensy) are generic, require manual configuration, and aren't built for Indian tier-2/3 small business owners who want something that works in 5 minutes, not a 30-field setup wizard.

## 2. Solution

A self-serve web app where a business owner:
1. Signs up
2. Picks their business category (Bakery, Salon/Gym, Clinic, Tuition, Real Estate, etc.)
3. Fills a short, category-specific onboarding form (menu/services/courses/listings)
4. Connects their WhatsApp number
5. Gets a live AI agent on WhatsApp within minutes — pre-configured for their category's typical customer questions and workflows (orders, bookings, lead capture)

One shared backend engine powers every category. Only the onboarding form, AI prompt template, and dashboard view change per category — this is the reusable core, same idea as your OS product line.

## 3. Target Users

- Primary: Solo or small-team business owners (1-5 staff) in Indian tier-2/3 cities
- First launch categories: Bakery/Cafe, Salon/Gym, Tuition/Coaching
- Later categories: Clinic, Real Estate, Freelancer/Agency reporting

## 4. Goals (v1 / MVP)

- Business owner can go from signup to live WhatsApp AI agent in under 10 minutes, self-serve, no developer help
- AI agent correctly answers category-relevant FAQs and captures orders/bookings/leads
- Owner can view and manage incoming orders/bookings from a simple dashboard
- 30-day free trial → paid subscription via Razorpay

## 5. Out of Scope (v1)

- In-chat payment collection (use "pay on delivery/UPI manually" for now)
- Multi-language / voice note support
- Image-based menu/catalog recognition
- Advanced analytics dashboards
- More than 3 categories at launch

---

## 6. User Flow

### 6.1 Owner-side flow (onboarding)

```
1. Landing page → "Start Free Trial"
2. Sign up (email/phone + password, or Google auth)
3. Select business category
      → Bakery/Cafe | Salon/Gym | Tuition/Coaching
4. Category-specific onboarding form (see Section 8)
5. Connect WhatsApp number
      → Enter business WhatsApp number
      → Verify via OTP / Meta Cloud API onboarding flow
6. Review & confirm → "Go Live"
7. Agent is live — owner lands on Dashboard
```

### 6.2 Customer-side flow (end user on WhatsApp)

```
1. Customer messages business WhatsApp number
2. Webhook receives message → backend identifies business_id from number
3. Backend loads: category template + business's saved config + conversation history
4. Backend builds dynamic system prompt → sends to Claude API
5. Claude generates reply (answer FAQ / take order / book slot / capture lead)
6. Reply sent back to customer via WhatsApp API
7. If order/booking/lead captured → saved to DB → appears on owner dashboard
8. If query is beyond agent's ability → escalate: forward message to owner's personal WhatsApp
```

### 6.3 Owner dashboard flow (day-to-day use)

```
Login → Dashboard home
   ├── Orders/Bookings tab → list, filter by status (new/confirmed/completed)
   ├── Conversations tab → view raw chat logs per customer
   ├── Edit Config tab → update menu/services/FAQs/hours anytime
   └── Billing tab → trial status, plan, payment history
```

---

## 7. System Architecture

```
                         ┌─────────────────────────┐
                         │   Owner Web App (Next.js) │
                         │  Onboarding + Dashboard    │
                         └────────────┬─────────────┘
                                      │ REST/Supabase client
                                      ▼
                         ┌─────────────────────────┐
                         │        Supabase           │
                         │  (Postgres + Auth + RLS)  │
                         └────────────┬─────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              ▼                       ▼                       ▼
     businesses table       category_templates table   business_config table
     (id, name, category,   (category, prompt_template, (business_id, key, value
      whatsapp_number,       form_schema)                 -> menu items, services,
      trial_end_date)                                      hours, FAQs etc.)

                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │   Express/Node Backend    │
                         │  WhatsApp Webhook Handler  │
                         └────────────┬─────────────┘
                                      │
                     ┌────────────────┼────────────────┐
                     ▼                                  ▼
        WhatsApp Business API                    Claude API
        (Twilio or Meta Cloud API)         (dynamic system prompt built
                     │                       from category + business_config)
                     ▼                                  │
            Customer's WhatsApp  ◄─────────────────────┘
                                      │
                                      ▼
                         orders_bookings_leads table
                         (business_id, type, details, status, created_at)
                                      │
                                      ▼
                         Owner Dashboard (real-time via Supabase)
```

### Key design principle
**One codebase, category-aware.** The webhook handler and Claude prompt-builder don't hardcode any business logic — they always look up `category_templates` for that business's category, then merge in `business_config` (the owner's actual data) before calling Claude. Adding a new category later means adding a new template row, not new code.

---

## 8. Data Model

```sql
-- Core tenant table
businesses (
  id uuid primary key,
  name text,
  category text,              -- 'bakery' | 'salon' | 'tuition' | ...
  whatsapp_number text,
  owner_email text,
  trial_end_date timestamp,
  subscription_status text,   -- 'trial' | 'active' | 'expired'
  created_at timestamp
)

-- One row per category, defines the AI behavior + onboarding form shape
category_templates (
  category text primary key,
  prompt_template text,       -- system prompt with placeholders e.g. {menu}, {hours}, {faqs}
  form_schema jsonb           -- defines onboarding form fields for this category
)

-- Owner's actual filled-in data, flexible key-value per business
business_config (
  id uuid primary key,
  business_id uuid references businesses(id),
  config_key text,            -- 'menu_items' | 'services' | 'hours' | 'faqs' | 'course_list' etc.
  config_value jsonb,
  updated_at timestamp
)

-- Conversation log
conversations (
  id uuid primary key,
  business_id uuid references businesses(id),
  customer_number text,
  message_direction text,     -- 'inbound' | 'outbound'
  message_text text,
  created_at timestamp
)

-- Captured orders / bookings / leads (type varies by category)
orders_bookings_leads (
  id uuid primary key,
  business_id uuid references businesses(id),
  type text,                  -- 'order' | 'booking' | 'lead'
  customer_number text,
  details jsonb,               -- flexible: items+qty for order, date+slot for booking, etc.
  status text,                 -- 'new' | 'confirmed' | 'completed' | 'cancelled'
  created_at timestamp
)
```

---

## 9. Category Templates (v1 launch categories)

| Category | Onboarding fields | AI agent's core job | Captured record type |
|---|---|---|---|
| Bakery/Cafe | Menu items + prices, customization options, delivery zones, hours | Answer menu Qs, take orders, confirm order + delivery/pickup | `order` |
| Salon/Gym | Services + prices, staff, available slots, hours | Answer service Qs, book appointments, send renewal reminders | `booking` |
| Tuition/Coaching | Courses, batch timings, fees, admission process | Answer admission/fee Qs, share batch info, capture interested leads | `lead` |

Each category's `prompt_template` is a pre-written system prompt with placeholders that get filled from that business's `business_config` at runtime — this is your actual product IP, not the plumbing.

---

## 10. Build Phases

**Phase 1 — Core multi-tenant engine** (foundation, do this first)
- Supabase schema (all tables above)
- WhatsApp webhook handler (Express)
- Dynamic prompt builder (category_template + business_config → Claude API call)
- Basic conversation logging

**Phase 2 — Category onboarding wizards**
- Signup + category picker UI (Next.js)
- Bakery onboarding form (reuse your existing Wake Up Cakes config as the template source)
- Salon/Gym onboarding form
- Tuition onboarding form

**Phase 3 — Owner dashboard**
- Orders/bookings/leads list view, status updates
- Conversation log viewer
- Edit config (menu/services/FAQs) anytime

**Phase 4 — Billing & trial**
- 30-day trial countdown logic
- Razorpay subscription integration
- Trial-expired lockout (agent pauses, owner sees upgrade prompt)

**Phase 5 — Launch & expand**
- Pitch first 15-20 businesses across the 3 categories (in-person, hyper-local)
- Onboard first paying customers
- Add new categories only based on real demand from pitches (Clinic, Real Estate, etc.)

---

## 11. Success Metrics (first 90 days)

- 15+ businesses onboarded across 3 categories
- 5+ converted from trial to paid
- Average onboarding time under 10 minutes
- AI agent correctly handles 80%+ of customer messages without human escalation
