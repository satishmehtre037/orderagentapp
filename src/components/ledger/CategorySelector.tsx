'use client';

import React from 'react';
import {
  Cake,
  Coffee,
  Scissors,
  Dumbbell,
  GraduationCap,
  Stethoscope,
  ShoppingBag,
  Building2,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  FileText,
} from 'lucide-react';
import { BusinessCategory } from '../../types';

interface CategorySelectorProps {
  value: BusinessCategory;
  onChange: (category: BusinessCategory) => void;
}

interface CategoryConfig {
  id: BusinessCategory;
  title: string;
  icon: React.ElementType;
  description: string;
  badge: string;
  capabilities: string[];
  previewGreeting: {
    text: string;
    subtext: string;
  };
}

const CATEGORIES: CategoryConfig[] = [
  {
    id: 'bakery',
    title: 'Bakery & Cakes',
    icon: Cake,
    description: 'Fresh cakes, custom pastries & baked treats. AI takes orders, cake weights & delivery addresses.',
    badge: 'Orders & Deliveries',
    capabilities: ['🎂 Weight & Flavors', '📦 Delivery Address', '💳 Instant UPI QR'],
    previewGreeting: {
      text: '✨ *Welcome to The Bakery Studio!* ✨\n\nFresh Chocolate Truffle (₹650/kg) & Butter Croissants ready! Where should we deliver your treat?',
      subtext: 'Handles cake flavors, eggless options, custom text & delivery slots',
    },
  },
  {
    id: 'cafe',
    title: 'Cafe & Dining',
    icon: Coffee,
    description: 'Artisan brews, dining & takeout. AI handles table reservations, food menu orders & billing.',
    badge: 'Dining & Orders',
    capabilities: ['☕ Coffee & Food Menu', '🍽️ Table Reservations', '⚡ Takeaways & Dine-in'],
    previewGreeting: {
      text: '✨ *Welcome to Artisan Coffee House!* ✨\n\nI can help you with our cold brews, artisan sandwiches, or reserve a table for this evening.',
      subtext: 'Auto-calculates bill with modifiers (almond milk, extra shot) & payment links',
    },
  },
  {
    id: 'salon',
    title: 'Salon & Spa',
    icon: Scissors,
    description: 'Styling, haircuts, spa & grooming. AI shares service tariffs & books stylist appointments.',
    badge: 'Grooming & Spa',
    capabilities: ['✂️ Stylist Selection', '🕒 Time Slot Booking', '💆 Service Tariffs'],
    previewGreeting: {
      text: '✨ *Welcome to Luxe Studio & Spa!* ✨\n\nWe have slots open today with Senior Stylists. Which service would you like to book?',
      subtext: 'Matches client with staff availability & confirms booking via calendar',
    },
  },
  {
    id: 'clinic',
    title: 'Clinic & Healthcare',
    icon: Stethoscope,
    description: 'Doctor consultations & dental care. AI manages patient appointments, OPD queues & timings.',
    badge: 'Consultations',
    capabilities: ['🩺 Doctor Consultation', '📅 OPD Timings', '🏥 Appointment Slots'],
    previewGreeting: {
      text: '✨ *Welcome to City Health & Dental Clinic!* ✨\n\nDr. Sharma (Physician) & Dr. Priya (Dentist) are available for appointments. How may we assist you?',
      subtext: 'Collects patient symptoms, books appointment slot & sends clinic directions',
    },
  },
  {
    id: 'hospital',
    title: 'Hospital & Multi-Specialty',
    icon: Stethoscope,
    description: 'Multi-specialty operations: OPD tokens, inpatient admissions, lab reports & 24/7 triage.',
    badge: 'OPD & Inpatient',
    capabilities: ['🏥 OPD Token Booking', '🛏️ Inpatient & Labs', '🚑 24/7 Emergency AI'],
    previewGreeting: {
      text: '✨ *Welcome to MediCare Hospital!* ✨\n\nBook OPD appointments, view doctor schedules, get lab reports & emergency assistance — all via WhatsApp AI.',
      subtext: 'Manages doctors, departments, patient records, voice calls & automated follow-ups',
    },
  },
  {
    id: 'gym',
    title: 'Gym & Fitness',
    icon: Dumbbell,
    description: 'Fitness memberships, personal training & trial passes. AI handles renewals & pass bookings.',
    badge: 'Memberships',
    capabilities: ['🏋️ Monthly / Annual Plans', '🔥 Free Trial Pass', '🔄 Auto Renewals'],
    previewGreeting: {
      text: '✨ *Welcome to IronCore Fitness!* ✨\n\nLooking for gym memberships, personal training, or want to claim a Free 1-Day Trial Pass?',
      subtext: 'Answers membership pricing, trainer profiles, timing slots & renewal links',
    },
  },
  {
    id: 'tuition',
    title: 'Tuition & Coaching',
    icon: GraduationCap,
    description: 'Academic coaching, test prep & admissions. AI captures student grades & demo batch bookings.',
    badge: 'Admissions & Batches',
    capabilities: ['📚 Batch Schedules', '💰 Fee Structure', '🎯 Free Demo Class'],
    previewGreeting: {
      text: '✨ *Welcome to Apex Academy!* ✨\n\nAdmissions open for Class 10th & NEET Foundation batches. We offer a 2-Day Free Demo. Would you like to register?',
      subtext: 'Captures student grade, parent contact & schedules demo batches',
    },
  },
  {
    id: 'retail',
    title: 'Boutique & Retail',
    icon: ShoppingBag,
    description: 'Fashion, apparel & retail. AI shares product catalogs, checks stock & takes home delivery orders.',
    badge: 'Shopping & Delivery',
    capabilities: ['👗 Catalog & Sizes', '📦 Order Tracking', '🚚 Home Delivery'],
    previewGreeting: {
      text: '✨ *Welcome to Elegance Boutique!* ✨\n\nExplore our latest designer wear & seasonal collections with same-day local delivery!',
      subtext: 'Handles sizes (S/M/L/XL), color availability & delivery address capture',
    },
  },
  {
    id: 'real_estate',
    title: 'Real Estate & Property',
    icon: Building2,
    description: 'Residential & commercial advisory. AI shares project brochures & books weekend site visits.',
    badge: 'Site Visits & Leads',
    capabilities: ['🏢 2BHK / 3BHK / Villas', '📍 Project Brochure', '🗓️ Site Visit Booking'],
    previewGreeting: {
      text: '✨ *Welcome to Prime Realty Advisory!* ✨\n\nWe have premium ready-to-move properties in prime locations. Would you like a brochure or book a site visit?',
      subtext: 'Captures buyer budget, preferred locations & books weekend site visits',
    },
  },
  {
    id: 'ca_firm',
    title: 'CA & Tax Consulting',
    icon: FileText,
    description: 'GST, ITR, TDS & compliance advisory. AI collects client documents & automates tax deadlines.',
    badge: 'Tax & Compliance',
    capabilities: ['📊 GST & ITR Filings', '📂 WhatsApp Documents', '⏰ Autonomous Deadlines'],
    previewGreeting: {
      text: '✨ *Welcome to Apex Tax & Financial Advisors!* ✨\n\nI can assist you with your GST returns, ITR filings, document submissions, and compliance countdowns.',
      subtext: 'Auto-scores hot leads, tracks compliance deadlines & follows up on missing client documents',
    },
  },
];

export const CategorySelector: React.FC<CategorySelectorProps> = ({ value, onChange }) => {
  const selectedConfig = CATEGORIES.find((c) => c.id === value) || CATEGORIES[0];

  return (
    <div className="space-y-4 my-2">
      {/* Categories Grid — Balanced 2 & 3 Column Responsive Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {CATEGORIES.map((cat) => {
          const isSelected = value === cat.id;
          const Icon = cat.icon;

          return (
            <div
              key={cat.id}
              onClick={() => onChange(cat.id)}
              className={`cursor-pointer rounded-xl border p-4 transition-all duration-150 flex flex-col justify-between relative group ${
                isSelected
                  ? 'bg-surface border-accent shadow-sm ring-2 ring-accent/20'
                  : 'bg-surface border-line hover:border-line-strong hover:bg-surface-subtle/50'
              }`}
            >
              {/* Top Row: Icon + Title + Category Badge */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-lg transition-colors flex-shrink-0 ${
                        isSelected
                          ? 'bg-accent/10 text-accent'
                          : 'bg-surface-subtle text-fg-muted group-hover:text-fg'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-fg leading-snug">{cat.title}</h3>
                      <span className="inline-block text-[11px] font-medium text-accent mt-0.5">
                        {cat.badge}
                      </span>
                    </div>
                  </div>

                  {/* Radio / Checkmark indicator */}
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors flex-shrink-0 ${
                      isSelected
                        ? 'border-accent bg-accent text-accent-fg'
                        : 'border-line-strong bg-surface'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-fg-muted leading-relaxed mb-3">
                  {cat.description}
                </p>

                {/* Capability Chips with Full Text Wrapping */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {cat.capabilities.map((cap, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] text-fg-muted font-medium bg-surface-subtle px-2 py-0.5 rounded-md border border-line"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer Status */}
              <div className="pt-2.5 border-t border-line flex items-center justify-between text-xs font-medium">
                <span className={isSelected ? 'text-accent font-semibold' : 'text-fg-subtle'}>
                  {isSelected ? 'Selected Active' : 'Click to Select'}
                </span>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live WhatsApp AI Bot Preview Banner */}
      <div className="bg-surface-elevated rounded-xl p-4 shadow-xs border border-line">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5 pb-2.5 border-b border-line text-xs">
          <div className="flex items-center gap-2 text-accent font-semibold">
            <MessageSquare className="w-4 h-4 flex-shrink-0" />
            <span>Live WhatsApp AI Concierge Preview ({selectedConfig.title})</span>
          </div>
          <span className="text-[11px] font-mono text-fg-muted bg-surface-subtle px-2 py-0.5 rounded border border-line self-start sm:self-auto">
            Mode: {selectedConfig.badge}
          </span>
        </div>

        <div className="bg-surface-subtle rounded-lg p-3.5 border border-line font-sans text-xs text-fg space-y-2">
          <p className="whitespace-pre-line leading-relaxed font-mono text-[12px]">{selectedConfig.previewGreeting.text}</p>
          <div className="pt-2 border-t border-line flex items-center gap-1.5 text-[11px] text-fg-muted">
            <Sparkles className="w-3.5 h-3.5 text-warning flex-shrink-0" />
            <span>{selectedConfig.previewGreeting.subtext}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
