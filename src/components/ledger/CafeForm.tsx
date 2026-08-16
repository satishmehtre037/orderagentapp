import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, HelpCircle, Coffee, Clock } from 'lucide-react';
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
    <div className="space-y-6">
      {/* 1. Cafe Food & Beverage Menu */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Coffee className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-semibold text-slate-900">Cafe Menu & Beverages</h3>
          </div>
          <button
            type="button"
            onClick={() => appendCafe({ name: '', price: 120, category: 'Beverage' })}
            className="inline-flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {cafeFields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-12 gap-2 sm:gap-3 items-center p-3 bg-slate-50 rounded-lg border border-slate-200/80"
            >
              <div className="col-span-6 sm:col-span-6">
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Item Name</label>
                <input
                  {...register(`cafe_menu.${index}.name` as const)}
                  placeholder="e.g. Iced Caramel Macchiato"
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>

              <div className="col-span-3 sm:col-span-3">
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Price (₹)</label>
                <input
                  type="number"
                  {...register(`cafe_menu.${index}.price` as const)}
                  placeholder="150"
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>

              <div className="col-span-2 sm:col-span-2">
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Category</label>
                <input
                  {...register(`cafe_menu.${index}.category` as const)}
                  placeholder="e.g. Beverage / Food"
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>

              <div className="col-span-1 flex justify-end pt-5">
                <button
                  type="button"
                  onClick={() => removeCafe(index)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Cafe Hours */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-slate-700" />
          <h3 className="text-sm font-semibold text-slate-900">Cafe Hours & Reservations</h3>
        </div>
        <textarea
          {...register('hours')}
          placeholder="e.g. Open daily from 9:00 AM to 11:00 PM. Dine-in, Takeaway & Delivery."
          rows={2}
          className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-mono"
        />
      </div>

      {/* 3. Cafe FAQs */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-semibold text-slate-900">Cafe FAQs</h3>
          </div>
          <button
            type="button"
            onClick={() => appendFaq({ question: '', answer: '' })}
            className="inline-flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add FAQ</span>
          </button>
        </div>

        <div className="space-y-3">
          {faqFields.map((field, index) => (
            <div key={field.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2">
              <div className="flex justify-between items-center">
                <input
                  {...register(`faqs.${index}.question` as const)}
                  placeholder="Question (e.g. Do you offer WiFi?)"
                  className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-200 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeFaq(index)}
                  className="ml-2 p-1.5 text-slate-400 hover:text-red-600 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <textarea
                {...register(`faqs.${index}.answer` as const)}
                placeholder="Answer (e.g. Yes! High-speed WiFi is available.)"
                rows={2}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
