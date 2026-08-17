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
  accent: {
    iconBg: string;
    iconText: string;
    selectedBorder: string;
    selectedRing: string;
    badgeBg: string;
    badgeText: string;
  };
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
    description: 'Fresh cakes, pastries, snacks & breads. AI answers menu queries and takes home delivery orders.',
    badge: 'Orders',
    accent: {
      iconBg: 'bg-amber-100 text-amber-700',
      iconText: 'text-amber-700',
      selectedBorder: 'border-amber-600',
      selectedRing: 'ring-amber-500/20',
      badgeBg: 'bg-amber-50 border-amber-200 text-amber-800',
      badgeText: 'text-amber-700',
    },
    capabilities: ['🎂 Weight (0.5kg/1kg)', '📦 Delivery Address', '💳 Instant UPI QR'],
    previewGreeting: {
      text: '✨ *Welcome to The Bakery Studio!* ✨\n\nFresh Chocolate Truffle (₹650/kg) & Butter Croissants ready! Where should we deliver your treat?',
      subtext: 'Handles cake flavors, eggless options, custom text & delivery slots',
    },
  },
  {
    id: 'cafe',
    title: 'Cafe & Dining',
    icon: Coffee,
    description: 'Beverages, artisan brews & dining. AI handles food queries, reservations & takeaway orders.',
    badge: 'Orders',
    accent: {
      iconBg: 'bg-emerald-100 text-emerald-700',
      iconText: 'text-emerald-700',
      selectedBorder: 'border-emerald-600',
      selectedRing: 'ring-emerald-500/20',
      badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      badgeText: 'text-emerald-700',
    },
    capabilities: ['☕ Coffee & Food Menu', '🍽️ Table Reservations', '⚡ Quick Takeaways'],
    previewGreeting: {
      text: '✨ *Welcome to Artisan Coffee House!* ✨\n\nI can help you with our cold brews, artisan sandwiches, or reserve a table for this evening.',
      subtext: 'Auto-calculates bill with modifiers (almond milk, extra shot) & payment links',
    },
  },
  {
    id: 'salon',
    title: 'Salon & Spa',
    icon: Scissors,
    description: 'Haircuts, styling, spa & treatments. AI shares service tariffs & books appointment slots.',
    badge: 'Bookings',
    accent: {
      iconBg: 'bg-rose-100 text-rose-700',
      iconText: 'text-rose-700',
      selectedBorder: 'border-rose-600',
      selectedRing: 'ring-rose-500/20',
      badgeBg: 'bg-rose-50 border-rose-200 text-rose-800',
      badgeText: 'text-rose-700',
    },
    capabilities: ['✂️ Stylist Selection', '🕒 Time Slot Booking', '💆 Service Tariffs'],
    previewGreeting: {
      text: '✨ *Welcome to Luxe Studio & Spa!* ✨\n\nWe have slots open today with Senior Stylist Ankita & Rahul. Which service would you like to book?',
      subtext: 'Matches client with staff availability & confirms booking via calendar',
    },
  },
  {
    id: 'clinic',
    title: 'Clinic & Healthcare',
    icon: Stethoscope,
    description: 'Doctors, dental & healthcare consultations. AI manages patient appointments & OPD timings.',
    badge: 'Appointments',
    accent: {
      iconBg: 'bg-teal-100 text-teal-700',
      iconText: 'text-teal-700',
      selectedBorder: 'border-teal-600',
      selectedRing: 'ring-teal-500/20',
      badgeBg: 'bg-teal-50 border-teal-200 text-teal-800',
      badgeText: 'text-teal-700',
    },
    capabilities: ['🩺 Doctor Consultation', '📅 OPD Timings', '🏥 Appointment Slots'],
    previewGreeting: {
      text: '✨ *Welcome to City Health & Dental Clinic!* ✨\n\nDr. Sharma (Physician) & Dr. Priya (Dentist) are available for appointments. How may we assist you?',
      subtext: 'Collects patient symptoms, books appointment slot & sends clinic directions',
    },
  },
  {
    id: 'gym',
    title: 'Gym & Fitness',
    icon: Dumbbell,
    description: 'Monthly memberships, trainers & trial passes. AI handles inquiries & recurring renewals.',
    badge: 'Memberships',
    accent: {
      iconBg: 'bg-indigo-100 text-indigo-700',
      iconText: 'text-indigo-700',
      selectedBorder: 'border-indigo-600',
      selectedRing: 'ring-indigo-500/20',
      badgeBg: 'bg-indigo-50 border-indigo-200 text-indigo-800',
      badgeText: 'text-indigo-700',
    },
    capabilities: ['🏋️ 1M / 3M / 1Y Plans', '🔥 Free Trial Pass', '🔄 Renewal Reminders'],
    previewGreeting: {
      text: '✨ *Welcome to IronFit Club!* ✨\n\nGet fit with our certified trainers. We offer 1-Day Free Trial Passes and Annual VIP memberships. Interested in a trial?',
      subtext: 'Captures fitness goals, phone numbers & issues instant trial passes',
    },
  },
  {
    id: 'tuition',
    title: 'Tuition & Coaching',
    icon: GraduationCap,
    description: 'Academic subjects, batch timings & fee structures. AI answers admission inquiries & captures leads.',
    badge: 'Admissions',
    accent: {
      iconBg: 'bg-sky-100 text-sky-700',
      iconText: 'text-sky-700',
      selectedBorder: 'border-sky-600',
      selectedRing: 'ring-sky-500/20',
      badgeBg: 'bg-sky-50 border-sky-200 text-sky-800',
      badgeText: 'text-sky-700',
    },
    capabilities: ['📚 Batch Schedules', '💰 Fee Breakdown', '🎯 Free Demo Class'],
    previewGreeting: {
      text: '✨ *Welcome to Apex Academy!* ✨\n\nAdmissions open for Class 10th & NEET Foundation batches. We offer a 2-Day Free Demo. Would you like to register?',
      subtext: 'Captures student grade, parent contact & schedules demo batches',
    },
  },
  {
    id: 'retail',
    title: 'Boutique & Retail',
    icon: ShoppingBag,
    description: 'Fashion, apparel & specialty stores. AI shares product catalogs, checks sizes & takes delivery orders.',
    badge: 'Shopping',
    accent: {
      iconBg: 'bg-purple-100 text-purple-700',
      iconText: 'text-purple-700',
      selectedBorder: 'border-purple-600',
      selectedRing: 'ring-purple-500/20',
      badgeBg: 'bg-purple-50 border-purple-200 text-purple-800',
      badgeText: 'text-purple-700',
    },
    capabilities: ['👗 Size & Stock Inquiries', '📸 Catalog Browsing', '🚚 Home Delivery'],
    previewGreeting: {
      text: '✨ *Welcome to Elegance Boutique!* ✨\n\nExplore our latest designer kurtis, linen wear & festive collections with same-day local delivery!',
      subtext: 'Handles sizes (S/M/L/XL), color availability & delivery address capture',
    },
  },
  {
    id: 'real_estate',
    title: 'Real Estate & Property',
    icon: Building2,
    description: 'Residential & commercial property advisory. AI shares floor plans, quotes & schedules site visits.',
    badge: 'Site Visits',
    accent: {
      iconBg: 'bg-blue-100 text-blue-700',
      iconText: 'text-blue-700',
      selectedBorder: 'border-blue-600',
      selectedRing: 'ring-blue-500/20',
      badgeBg: 'bg-blue-50 border-blue-200 text-blue-800',
      badgeText: 'text-blue-700',
    },
    capabilities: ['🏢 2BHK / 3BHK / Villas', '📍 Location Brochure', '🗓️ Site Visit Booking'],
    previewGreeting: {
      text: '✨ *Welcome to Prime Realty Advisory!* ✨\n\nWe have premium 2BHK & 3BHK ready-to-move properties in prime locations. Would you like a brochure or book a site visit?',
      subtext: 'Captures buyer budget, preferred locations & books weekend site visits',
    },
  },
];

export const CategorySelector: React.FC<CategorySelectorProps> = ({ value, onChange }) => {
  const selectedConfig = CATEGORIES.find((c) => c.id === value) || CATEGORIES[0];

  return (
    <div className="space-y-4 my-4">
      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {CATEGORIES.map((cat) => {
          const isSelected = value === cat.id;
          const Icon = cat.icon;

          return (
            <div
              key={cat.id}
              onClick={() => onChange(cat.id)}
              className={`cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 flex flex-col justify-between relative group ${
                isSelected
                  ? `bg-white ${cat.accent.selectedBorder} shadow-md ring-2 ${cat.accent.selectedRing}`
                  : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/60 shadow-xs'
              }`}
            >
              {isSelected && (
                <div className="absolute top-3.5 right-3.5 text-slate-900 animate-in fade-in zoom-in duration-150">
                  <CheckCircle2 className="w-5 h-5 fill-slate-900 text-white" />
                </div>
              )}

              <div>
                {/* Header Icon + Title */}
                <div className="flex items-start space-x-3 mb-2.5">
                  <div
                    className={`p-2.5 rounded-lg transition-colors ${
                      isSelected
                        ? cat.accent.iconBg
                        : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200/80'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="pr-6">
                    <h3 className="text-xs font-bold text-slate-900 leading-snug">{cat.title}</h3>
                    <span
                      className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border mt-1 ${cat.accent.badgeBg}`}
                    >
                      {cat.badge}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-[11px] text-slate-500 leading-relaxed mb-3 line-clamp-2">
                  {cat.description}
                </p>

                {/* Capability Micro-Pills */}
                <div className="space-y-1 mb-3">
                  {cat.capabilities.map((cap, idx) => (
                    <div
                      key={idx}
                      className="text-[10px] text-slate-600 font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-100 truncate"
                    >
                      {cap}
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Footer Button Label */}
              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-medium">
                <span className={isSelected ? 'text-slate-900 font-bold' : 'text-slate-400'}>
                  {isSelected ? '✓ Selected' : 'Select'}
                </span>
                {isSelected && (
                  <span className="text-[10px] font-mono text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                    Active
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live WhatsApp AI Bot Preview Banner */}
      <div className="bg-slate-900 text-slate-100 rounded-xl p-4 shadow-sm border border-slate-800">
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800 text-xs">
          <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
            <MessageSquare className="w-4 h-4" />
            <span>Live WhatsApp AI Concierge Preview ({selectedConfig.title})</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
            Auto-tuned for {selectedConfig.badge}
          </span>
        </div>

        <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/60 font-sans text-xs text-slate-200 space-y-1.5">
          <p className="whitespace-pre-line leading-relaxed">{selectedConfig.previewGreeting.text}</p>
          <div className="pt-2 border-t border-slate-700/50 flex items-center space-x-1.5 text-[11px] text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span>{selectedConfig.previewGreeting.subtext}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
