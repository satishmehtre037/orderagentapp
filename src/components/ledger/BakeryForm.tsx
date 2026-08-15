import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, HelpCircle, Clock, Utensils } from 'lucide-react';
import { OnboardingWizardFormData } from '../../lib/validations/onboarding';

export const BakeryForm: React.FC = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<OnboardingWizardFormData>();

  const {
    fields: menuFields,
    append: appendMenu,
    remove: removeMenu,
  } = useFieldArray({
    control,
    name: 'menu_items',
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
      {/* 1. Menu Items Section */}
      <div className="bg-paper border border-warm-border rounded-lg p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-warm-border">
          <div className="flex items-center space-x-2">
            <Utensils className="w-5 h-5 text-teal" />
            <h3 className="font-serif text-lg font-bold text-ink">Bakery Menu & Pricing Ledger</h3>
          </div>
          <button
            type="button"
            onClick={() => appendMenu({ name: '', price: 100, unit: 'pcs' })}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-teal-light text-teal border border-teal/20 hover:bg-teal hover:text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Menu Item</span>
          </button>
        </div>

        <div className="space-y-3">
          {menuFields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-12 gap-2 sm:gap-3 items-center p-2.5 bg-warm-card rounded-md border border-warm-border/70"
            >
              <div className="col-span-6 sm:col-span-6">
                <label className="block text-[11px] font-mono text-ink-light mb-1">Item Name</label>
                <input
                  {...register(`menu_items.${index}.name` as const)}
                  placeholder="e.g. Chocolate Truffle Cake (1kg)"
                  className="w-full text-xs font-medium px-3 py-2 bg-paper border border-warm-border rounded focus:border-teal"
                />
              </div>

              <div className="col-span-3 sm:col-span-3">
                <label className="block text-[11px] font-mono text-ink-light mb-1">Price (₹)</label>
                <input
                  type="number"
                  {...register(`menu_items.${index}.price` as const)}
                  placeholder="500"
                  className="w-full text-xs font-mono tabular-nums font-semibold px-3 py-2 bg-paper border border-warm-border rounded focus:border-teal"
                />
              </div>

              <div className="col-span-2 sm:col-span-2">
                <label className="block text-[11px] font-mono text-ink-light mb-1">Unit</label>
                <input
                  {...register(`menu_items.${index}.unit` as const)}
                  placeholder="kg / pcs"
                  className="w-full text-xs font-medium px-2 py-2 bg-paper border border-warm-border rounded focus:border-teal text-center"
                />
              </div>

              <div className="col-span-1 flex justify-end pt-5">
                {menuFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMenu(index)}
                    className="p-1.5 text-ink-light hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Business Hours */}
      <div className="bg-paper border border-warm-border rounded-lg p-5 shadow-sm">
        <div className="flex items-center space-x-2 mb-3">
          <Clock className="w-5 h-5 text-teal" />
          <h3 className="font-serif text-lg font-bold text-ink">Opening Hours</h3>
        </div>
        <input
          {...register('hours')}
          placeholder="e.g. Monday to Sunday, 9:00 AM - 9:30 PM (Closed on Tuesdays)"
          className="w-full text-sm px-3.5 py-2.5 bg-paper border border-warm-border rounded-md focus:border-teal"
        />
        {errors.hours && (
          <p className="text-xs text-red-600 mt-1">{errors.hours.message}</p>
        )}
      </div>

      {/* 3. Customer FAQs */}
      <div className="bg-paper border border-warm-border rounded-lg p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-warm-border">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-5 h-5 text-teal" />
            <h3 className="font-serif text-lg font-bold text-ink">Frequently Asked Questions</h3>
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
                <span className="text-[11px] font-mono text-teal font-semibold">FAQ #{index + 1}</span>
                {faqFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFaq(index)}
                    className="p-1 text-ink-light hover:text-red-600 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <input
                {...register(`faqs.${index}.question` as const)}
                placeholder="Question (e.g. Do you deliver eggless cakes?)"
                className="w-full text-xs font-medium px-3 py-2 bg-paper border border-warm-border rounded"
              />
              <input
                {...register(`faqs.${index}.answer` as const)}
                placeholder="Answer (e.g. Yes! All our cakes can be prepared 100% eggless upon request.)"
                className="w-full text-xs px-3 py-2 bg-paper border border-warm-border rounded"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
