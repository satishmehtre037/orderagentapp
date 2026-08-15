import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, HelpCircle, Coffee, Clock, Sparkles } from 'lucide-react';
import { OnboardingWizardFormData } from '../../lib/validations/onboarding';

export const CafeForm: React.FC = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<OnboardingWizardFormData>();

  const {
    fields: cafeFields,
    append: appendCafe,
    remove: removeCafe,
  } = useFieldArray({
    control,
    name: 'cafe_menu',
  });

  const {
    fields: faqFields,
    append: appendFaq,
    remove: removeFaq,
  } = useFieldArray({
    control,
    name: 'faqs',
  });

  return (
    <div className="space-y-8">
      {/* 1. Cafe Food & Beverage Menu */}
      <div className="bg-paper border border-warm-border rounded-lg p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-warm-border">
          <div className="flex items-center space-x-2">
            <Coffee className="w-5 h-5 text-teal" />
            <h3 className="font-serif text-lg font-bold text-ink">Cafe Menu & Beverages</h3>
          </div>
          <button
            type="button"
            onClick={() => appendCafe({ name: '', price: 120, category: 'Beverage' })}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-teal-light text-teal border border-teal/20 hover:bg-teal hover:text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Cafe Item</span>
          </button>
        </div>

        <div className="space-y-3">
          {cafeFields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-12 gap-2 sm:gap-3 items-center p-2.5 bg-warm-card rounded-md border border-warm-border/70"
            >
              <div className="col-span-6 sm:col-span-6">
                <label className="block text-[11px] font-mono text-ink-light mb-1">Item Name</label>
                <input
                  {...register(`cafe_menu.${index}.name` as const)}
                  placeholder="e.g. Iced Caramel Macchiato / Paneer Tikka Sandwich"
                  className="w-full text-xs px-2.5 py-1.5 bg-paper border border-warm-border rounded focus:border-teal"
                />
              </div>

              <div className="col-span-3 sm:col-span-3">
                <label className="block text-[11px] font-mono text-ink-light mb-1">Price (₹)</label>
                <input
                  type="number"
                  {...register(`cafe_menu.${index}.price` as const)}
                  placeholder="150"
                  className="w-full text-xs px-2.5 py-1.5 bg-paper border border-warm-border rounded focus:border-teal font-mono"
                />
              </div>

              <div className="col-span-2 sm:col-span-2">
                <label className="block text-[11px] font-mono text-ink-light mb-1">Category</label>
                <input
                  {...register(`cafe_menu.${index}.category` as const)}
                  placeholder="e.g. Coffee / Snack"
                  className="w-full text-xs px-2.5 py-1.5 bg-paper border border-warm-border rounded focus:border-teal"
                />
              </div>

              <div className="col-span-1 flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => removeCafe(index)}
                  className="p-1.5 text-ink-light hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Cafe Hours */}
      <div className="bg-paper border border-warm-border rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 pb-2 border-b border-warm-border">
          <Clock className="w-5 h-5 text-teal" />
          <h3 className="font-serif text-lg font-bold text-ink">Cafe Hours & Table Reservations</h3>
        </div>
        <textarea
          {...register('hours')}
          placeholder="e.g. Open daily from 9:00 AM to 11:00 PM. Dine-in, Takeaway & Swiggy/Zomato delivery available."
          rows={2}
          className="w-full text-xs px-3 py-2 bg-warm-card border border-warm-border rounded focus:border-teal font-mono"
        />
      </div>

      {/* 3. Cafe FAQs */}
      <div className="bg-paper border border-warm-border rounded-lg p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-warm-border">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-5 h-5 text-teal" />
            <h3 className="font-serif text-lg font-bold text-ink">Cafe FAQs & Special Policies</h3>
          </div>
          <button
            type="button"
            onClick={() => appendFaq({ question: '', answer: '' })}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-teal-light text-teal border border-teal/20 hover:bg-teal hover:text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add FAQ</span>
          </button>
        </div>

        <div className="space-y-3">
          {faqFields.map((field, index) => (
            <div key={field.id} className="p-3 bg-warm-card rounded-md border border-warm-border/70 space-y-2">
              <div className="flex justify-between items-center">
                <input
                  {...register(`faqs.${index}.question` as const)}
                  placeholder="Question (e.g. Do you have high-speed WiFi and power sockets?)"
                  className="w-full text-xs px-2.5 py-1.5 bg-paper border border-warm-border rounded font-bold"
                />
                <button
                  type="button"
                  onClick={() => removeFaq(index)}
                  className="ml-2 p-1.5 text-ink-light hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <textarea
                {...register(`faqs.${index}.answer` as const)}
                placeholder="Answer (e.g. Yes! Free high-speed WiFi and work-friendly tables are available.)"
                rows={2}
                className="w-full text-xs px-2.5 py-1.5 bg-paper border border-warm-border rounded"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
