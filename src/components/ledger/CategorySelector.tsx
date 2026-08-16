import React from 'react';
import { Cake, Coffee, Scissors, Dumbbell, GraduationCap, CheckCircle2 } from 'lucide-react';
import { BusinessCategory } from '../../types';

interface CategorySelectorProps {
  value: BusinessCategory;
  onChange: (category: BusinessCategory) => void;
}

const CATEGORIES = [
  {
    id: 'bakery' as BusinessCategory,
    title: 'Bakery & Cakes',
    icon: Cake,
    description: 'Fresh cakes, pastries, snacks & breads. AI answers menu queries and takes home delivery orders.',
    badge: 'Orders',
  },
  {
    id: 'cafe' as BusinessCategory,
    title: 'Cafe & Dining',
    icon: Coffee,
    description: 'Beverages, artisan brews & dining. AI handles food queries, reservations & takeaway orders.',
    badge: 'Orders',
  },
  {
    id: 'salon' as BusinessCategory,
    title: 'Salon & Spa',
    icon: Scissors,
    description: 'Haircuts, styling, spa & treatments. AI shares service tariffs & books appointment slots.',
    badge: 'Bookings',
  },
  {
    id: 'gym' as BusinessCategory,
    title: 'Gym & Fitness',
    icon: Dumbbell,
    description: 'Monthly memberships, trainers & trial passes. AI handles inquiries & recurring renewals.',
    badge: 'Memberships',
  },
  {
    id: 'tuition' as BusinessCategory,
    title: 'Tuition & Coaching',
    icon: GraduationCap,
    description: 'Academic subjects, batch timings & fee structures. AI answers admission inquiries & captures leads.',
    badge: 'Admissions',
  },
];

export const CategorySelector: React.FC<CategorySelectorProps> = ({ value, onChange }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 my-4">
      {CATEGORIES.map((cat) => {
        const isSelected = value === cat.id;
        const Icon = cat.icon;

        return (
          <div
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className={`cursor-pointer rounded-xl border-2 p-5 transition-all duration-200 flex flex-col justify-between relative ${
              isSelected
                ? 'bg-white border-slate-900 shadow-md ring-1 ring-slate-900/10'
                : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50 shadow-sm'
            }`}
          >
            {isSelected && (
              <div className="absolute top-4 right-4 text-slate-900">
                <CheckCircle2 className="w-5 h-5 fill-slate-900 text-white" />
              </div>
            )}

            <div>
              <div className="flex items-center space-x-3 mb-3">
                <div
                  className={`p-2.5 rounded-lg ${
                    isSelected ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{cat.title}</h3>
                  <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/60 mt-0.5">
                    {cat.badge}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">{cat.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium">
              <span className={isSelected ? 'text-slate-900 font-semibold' : 'text-slate-400'}>
                {isSelected ? 'Selected' : 'Select category'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
