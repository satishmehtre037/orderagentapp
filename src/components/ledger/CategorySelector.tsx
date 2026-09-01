'use client';

import React, { useState } from 'react';
import {
  Cake,
  Coffee,
  Scissors,
  Dumbbell,
  GraduationCap,
  Stethoscope,
  ShoppingBag,
  Building2,
  Check,
  Sparkles,
  MessageSquare,
  FileText,
  ArrowUpRight,
  Zap,
} from 'lucide-react';
import { BusinessCategory } from '../../types';

interface CategorySelectorProps {
  value: BusinessCategory;
  onChange: (category: BusinessCategory) => void;
}

interface CategoryConfig {
  id: BusinessCategory;
  title: string;
  group: 'food' | 'health' | 'services' | 'retail';
  icon: React.ElementType;
  tag: string;
  tagTone: string;
  description: string;
  highlights: string[];
  previewGreeting: {
    text: string;
    subtext: string;
  };
}

const CATEGORIES: CategoryConfig[] = [
  {
    id: 'bakery',
    title: 'Bakery & Cakes',
    group: 'food',
    icon: Cake,
    tag: 'Orders & Deliveries',
    tagTone: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    description: 'Fresh cakes, weight selection & home delivery capture on WhatsApp.',
    highlights: ['Cake flavor & eggless options', 'Weight & custom text capture', 'Instant UPI payment links'],
    previewGreeting: {
      text: '🎂 *Welcome to The Bakery Studio!*\n\nFresh Chocolate Truffle (₹650/kg) is ready! Where should we deliver your cake?',
      subtext: 'Handles cake customization, custom writing & delivery slot scheduling',
    },
  },
  {
    id: 'cafe',
    title: 'Cafe & Dining',
    group: 'food',
    icon: Coffee,
    tag: 'Dining & Takeaway',
    tagTone: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    description: 'Food menu orders, table reservations & bill calculations.',
    highlights: ['Food & coffee digital menu', 'Table reservation booking', 'Takeaway orders & billing'],
    previewGreeting: {
      text: '☕ *Welcome to Artisan Cafe!*\n\nWould you like to explore our Cold Brews, order takeaway, or reserve a table for tonight?',
      subtext: 'Calculates bills with modifiers (extra shot, oat milk) & sends payment links',
    },
  },
  {
    id: 'salon',
    title: 'Salon & Spa',
    group: 'services',
    icon: Scissors,
    tag: 'Appointments & Spa',
    tagTone: 'text-pink-500 bg-pink-500/10 border-pink-500/20',
    description: 'Stylist scheduling, haircut & spa service appointment booking.',
    highlights: ['Service tariff & packages', 'Senior stylist selection', 'Calendar slot confirmation'],
    previewGreeting: {
      text: '💇 *Welcome to Luxe Studio & Spa!*\n\nSlots are open today with Senior Stylists. Which grooming service would you like to book?',
      subtext: 'Checks stylist availability & confirms appointment via Google/Apple Calendar',
    },
  },
  {
    id: 'clinic',
    title: 'Clinic & Doctors',
    group: 'health',
    icon: Stethoscope,
    tag: 'Consultations & OPD',
    tagTone: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    description: 'Doctor appointments, OPD token queue & timing management.',
    highlights: ['Doctor consultation booking', 'Symptom & patient triage', 'Clinic location & directions'],
    previewGreeting: {
      text: '🩺 *Welcome to City Health Clinic!*\n\nDr. Sharma (Physician) & Dr. Priya (Dentist) are available. Would you like to book a slot?',
      subtext: 'Collects patient details, books appointment slot & sends clinic map directions',
    },
  },
  {
    id: 'hospital',
    title: 'Hospital & Healthcare',
    group: 'health',
    icon: Stethoscope,
    tag: 'OPD & Inpatient Care',
    tagTone: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    description: 'Multi-specialty operations: OPD tokens, patient CRM & lab reports.',
    highlights: ['OPD token queue booking', 'Doctor roster & departments', 'Lab reports & emergency triage'],
    previewGreeting: {
      text: '🏥 *Welcome to MediCare Multi-Specialty Hospital!*\n\nBook OPD appointments, check doctor timings, and get lab reports via WhatsApp AI.',
      subtext: 'Manages multi-doctor schedules, patient history & automated follow-ups',
    },
  },
  {
    id: 'gym',
    title: 'Gym & Fitness',
    group: 'health',
    icon: Dumbbell,
    tag: 'Memberships & Passes',
    tagTone: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    description: 'Membership plans, personal trainer coaching & trial passes.',
    highlights: ['Monthly & annual plans', 'Free 1-day trial passes', 'Automated renewal links'],
    previewGreeting: {
      text: '🏋️ *Welcome to IronCore Fitness!*\n\nLooking to join our gym, start personal training, or claim a Free 1-Day Trial Pass?',
      subtext: 'Explains membership tiers, trainer profiles & provides instant signup links',
    },
  },
  {
    id: 'tuition',
    title: 'Tuition & Coaching',
    group: 'services',
    icon: GraduationCap,
    tag: 'Admissions & Batches',
    tagTone: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    description: 'Student admissions, batch timings & free demo class leads.',
    highlights: ['Class & batch schedules', 'Fee structure & scholarships', 'Free 2-day demo classes'],
    previewGreeting: {
      text: '🎓 *Welcome to Apex Academy!*\n\nAdmissions open for Class 10th & NEET batches. We offer a 2-Day Free Demo. Shall we register you?',
      subtext: 'Captures student grade, parent contact & schedules demo batch attendance',
    },
  },
  {
    id: 'retail',
    title: 'Boutique & Retail',
    group: 'retail',
    icon: ShoppingBag,
    tag: 'Catalog & Delivery',
    tagTone: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    description: 'Fashion apparel, stock availability & home delivery orders.',
    highlights: ['Digital product catalog', 'Size & color availability', 'Delivery address capture'],
    previewGreeting: {
      text: '👗 *Welcome to Elegance Boutique!*\n\nExplore our latest designer collection with same-day local delivery right to your doorstep!',
      subtext: 'Checks sizes (S/M/L/XL), color options & takes customer delivery addresses',
    },
  },
  {
    id: 'real_estate',
    title: 'Real Estate & Properties',
    group: 'services',
    icon: Building2,
    tag: 'Site Visits & Leads',
    tagTone: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
    description: 'Property brochures, unit pricing & weekend site visit bookings.',
    highlights: ['2BHK / 3BHK / Villa specs', 'Instant PDF brochure delivery', 'Weekend site visit tours'],
    previewGreeting: {
      text: '🏢 *Welcome to Prime Realty Advisory!*\n\nWe have premium ready-to-move properties in prime locations. Would you like a brochure or book a site visit?',
      subtext: 'Captures buyer budget, preferred locations & books verified weekend site visits',
    },
  },
  {
    id: 'ca_firm',
    title: 'CA & Tax Consulting',
    group: 'services',
    icon: FileText,
    tag: 'GST & ITR Compliance',
    tagTone: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    description: 'GST returns, ITR filings, document hub & tax deadline reminders.',
    highlights: ['GST & ITR filing flows', 'Document collection on WhatsApp', 'Autonomous deadline countdowns'],
    previewGreeting: {
      text: '⚖️ *Welcome to Apex Tax & Financial Advisors!*\n\nI can assist you with your GST returns, ITR filings, document submissions, and compliance dates.',
      subtext: 'Auto-scores qualified leads, tracks deadlines & requests missing documents',
    },
  },
];

type FilterGroup = 'all' | 'food' | 'health' | 'services' | 'retail';

export const CategorySelector: React.FC<CategorySelectorProps> = ({ value, onChange }) => {
  const [activeFilter, setActiveFilter] = useState<FilterGroup>('all');
  const selectedConfig = CATEGORIES.find((c) => c.id === value) || CATEGORIES[0];

  const filteredCategories = CATEGORIES.filter((c) =>
    activeFilter === 'all' ? true : c.group === activeFilter
  );

  return (
    <div className="space-y-4 my-2">
      {/* Filter Tabs Header */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar">
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-surface-subtle border border-line">
          {[
            { id: 'all', label: 'All Businesses' },
            { id: 'food', label: 'Food & Dining' },
            { id: 'health', label: 'Healthcare & Gym' },
            { id: 'services', label: 'Services & Advisory' },
            { id: 'retail', label: 'Retail & Stores' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id as FilterGroup)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                activeFilter === tab.id
                  ? 'bg-surface text-fg font-semibold shadow-xs border border-line/60'
                  : 'text-fg-muted hover:text-fg'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-fg-subtle shrink-0 hidden sm:inline">
          {filteredCategories.length} Categories
        </span>
      </div>

      {/* Modern 21st.dev Interactive Card Grid */}
      <div role="radiogroup" aria-label="Select Business Category" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredCategories.map((cat) => {
          const isSelected = value === cat.id;
          const Icon = cat.icon;

          return (
            <div
              key={cat.id}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onClick={() => onChange(cat.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onChange(cat.id);
                }
              }}
              className={`group relative rounded-xl p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between select-none outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                isSelected
                  ? 'bg-surface border-2 border-accent shadow-md ring-2 ring-accent/15'
                  : 'bg-surface border border-line hover:border-line-strong hover:bg-surface-subtle/40 hover:shadow-xs'
              }`}
            >
              {/* Top Accent & Icon Bar */}
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-accent text-accent-fg shadow-xs'
                          : 'bg-surface-subtle text-fg-muted group-hover:text-fg group-hover:bg-surface-subtle/80'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-fg leading-tight">
                        {cat.title}
                      </h3>
                      <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border mt-1 ${cat.tagTone}`}>
                        {cat.tag}
                      </span>
                    </div>
                  </div>

                  {/* Radio Checkmark Pill */}
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-all shrink-0 ${
                      isSelected
                        ? 'bg-accent text-accent-fg shadow-xs'
                        : 'border border-line-strong bg-surface group-hover:border-fg-muted'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-fg-muted leading-relaxed mb-3">
                  {cat.description}
                </p>

                {/* Clean Feature Highlights */}
                <div className="space-y-1.5 mb-3 pt-2 border-t border-line/60">
                  {cat.highlights.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[11px] text-fg-muted">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSelected ? 'bg-accent' : 'bg-fg-subtle/60'}`} />
                      <span className="truncate">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Bottom Pill */}
              <div className="pt-2.5 border-t border-line flex items-center justify-between text-xs">
                <span className={`text-[11px] font-semibold transition-colors ${isSelected ? 'text-accent' : 'text-fg-subtle group-hover:text-fg-muted'}`}>
                  {isSelected ? 'Selected Category' : 'Click to select'}
                </span>
                {isSelected ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-accent">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    Active
                  </span>
                ) : (
                  <ArrowUpRight className="w-3.5 h-3.5 text-fg-subtle opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live WhatsApp AI Bot Preview Banner */}
      <div className="bg-surface rounded-xl p-4 border border-line shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-line">
          <div className="flex items-center gap-2 text-xs font-bold text-fg">
            <MessageSquare className="w-4 h-4 text-accent" />
            <span>Autonomous AI Concierge Preview ({selectedConfig.title})</span>
          </div>
          <span className="text-[11px] font-mono font-medium text-accent bg-accent-subtle border border-accent-border px-2.5 py-0.5 rounded-full self-start sm:self-auto">
            Preset: {selectedConfig.tag}
          </span>
        </div>

        <div className="bg-surface-subtle rounded-lg p-3.5 border border-line space-y-2.5">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
              WA
            </div>
            <div className="flex-1 bg-surface p-3 rounded-lg border border-line shadow-xs">
              <p className="text-xs text-fg leading-relaxed whitespace-pre-line font-sans">
                {selectedConfig.previewGreeting.text}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-line/60 flex items-center gap-1.5 text-[11px] text-fg-muted pl-9">
            <Sparkles className="w-3.5 h-3.5 text-warning shrink-0" />
            <span>{selectedConfig.previewGreeting.subtext}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

