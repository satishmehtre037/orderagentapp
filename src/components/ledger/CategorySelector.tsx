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
    description: 'Fresh cakes, pastries, sourdough & breads. AI manages menu queries, custom cakes & home delivery.',
    badge: 'Orders',
  },
  {
    id: 'cafe' as BusinessCategory,
    title: 'Cafe & Restaurant',
    icon: Coffee,
    description: 'Beverages, snacks & dining. AI answers food queries, table reservations & takeaway orders.',
    badge: 'Orders',
  },
  {
    id: 'salon' as BusinessCategory,
    title: 'Salon & Spa',
    icon: Scissors,
    description: 'Haircuts, facials, styling & spa. AI shares service tariffs & books stylist appointment slots.',
    badge: 'Bookings',
  },
  {
    id: 'gym' as BusinessCategory,
    title: 'Gym & Fitness',
    icon: Dumbbell,
    description: 'Memberships, personal trainers & trial passes. AI handles membership inquiries & trial bookings.',
    badge: 'Memberships',
  },
  {
    id: 'tuition' as BusinessCategory,
    title: 'Tuition & Classes',
    icon: GraduationCap,
    description: 'Academic subjects, batch timings & fee structures. AI answers admission queries & captures student leads.',
    badge: 'Admissions',
  },
];

export const CategorySelector: React.FC<CategorySelectorProps> = ({ value, onChange }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
      {CATEGORIES.map((cat) => {
        const isSelected = value === cat.id;
        const Icon = cat.icon;

        return (
          <div
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className={`cursor-pointer rounded-lg border-2 p-5 transition-all duration-200 flex flex-col justify-between relative ${
              isSelected
                ? 'bg-paper border-teal ring-1 ring-teal/20 shadow-passbook'
                : 'bg-paper border-warm-border hover:border-teal/50 hover:bg-warm-card'
            }`}
          >
            {isSelected && (
              <div className="absolute top-3 right-3 text-teal">
                <CheckCircle2 className="w-5 h-5 fill-teal text-paper" />
              </div>
            )}

            <div>
              <div className="flex items-center space-x-3 mb-3">
                <div className={`p-2.5 rounded-md ${isSelected ? 'bg-teal text-paper' : 'bg-warm-card text-teal'}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-ink">{cat.title}</h3>
                  <span className="inline-block text-[11px] font-mono tracking-wider px-2 py-0.5 rounded bg-warm-card border border-warm-border text-ink-muted">
                    {cat.badge} Mode
                  </span>
                </div>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed mb-4">{cat.description}</p>
            </div>

            <div className="pt-3 border-t border-warm-border/60 flex items-center justify-between text-xs font-semibold">
              <span className={isSelected ? 'text-teal' : 'text-ink-light'}>
                {isSelected ? '✓ Selected Category' : 'Click to select'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
