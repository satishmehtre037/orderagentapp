'use client';

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
      <div className="bg-surface border border-line rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div className="flex items-center space-x-2">
            <Coffee className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-fg">Cafe Menu & Beverages</h3>
          </div>
          <button
            type="button"
            onClick={() => appendCafe({ name: '', price: 120, category: 'Beverage' })}
            className="inline-flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-accent-fg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {cafeFields.map((field, index) => (
            <div
              key={field.id}
              className="p-3 bg-surface-subtle rounded-lg border border-line space-y-2 sm:space-y-0 sm:grid sm:grid-cols-12 sm:gap-3 sm:items-center"
            >
              <div className="sm:col-span-6">
                <div className="flex items-center justify-between mb-1 sm:block">
                  <label className="block text-[11px] font-medium text-fg-muted">Item Name</label>
                  {cafeFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCafe(index)}
                      className="sm:hidden p-1 text-fg-subtle hover:text-danger rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <input
                  {...register(`cafe_menu.${index}.name` as const)}
                  placeholder="e.g. Iced Caramel Macchiato"
                  className="w-full text-xs px-3 py-2 bg-surface text-fg placeholder:text-fg-subtle border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 sm:contents">
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-medium text-fg-muted mb-1">Price (₹)</label>
                  <input
                    type="number"
                    {...register(`cafe_menu.${index}.price` as const)}
                    placeholder="150"
                    className="w-full text-xs px-3 py-2 bg-surface text-fg placeholder:text-fg-subtle border border-line rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium text-fg-muted mb-1">Category</label>
                  <input
                    {...register(`cafe_menu.${index}.category` as const)}
                    placeholder="e.g. Beverage / Food"
                    className="w-full text-xs px-3 py-2 bg-surface text-fg placeholder:text-fg-subtle border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  />
                </div>
              </div>

              <div className="hidden sm:flex sm:col-span-1 justify-end pt-5">
                {cafeFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCafe(index)}
                    className="p-1.5 text-fg-subtle hover:text-danger rounded-lg hover:bg-danger-subtle transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Cafe Hours */}
      <div className="bg-surface border border-line rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold text-fg">Cafe Hours & Reservations</h3>
        </div>
        <textarea
          {...register('hours')}
          placeholder="e.g. Open daily from 9:00 AM to 11:00 PM. Dine-in, Takeaway & Delivery."
          rows={2}
          className="w-full text-xs px-3 py-2 bg-surface text-fg placeholder:text-fg-subtle border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent font-mono"
        />
      </div>

      {/* 3. Cafe FAQs */}
      <div className="bg-surface border border-line rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-fg">Cafe FAQs</h3>
          </div>
          <button
            type="button"
            onClick={() => appendFaq({ question: '', answer: '' })}
            className="inline-flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-surface-subtle hover:bg-surface-hover text-fg border border-line transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add FAQ</span>
          </button>
        </div>

        <div className="space-y-3">
          {faqFields.map((field, index) => (
            <div key={field.id} className="p-3 bg-surface-subtle rounded-lg border border-line space-y-2">
              <div className="flex justify-between items-center">
                <input
                  {...register(`faqs.${index}.question` as const)}
                  placeholder="Question (e.g. Do you offer WiFi?)"
                  className="w-full text-xs font-medium px-3 py-2 bg-surface text-fg placeholder:text-fg-subtle border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
                <button
                  type="button"
                  onClick={() => removeFaq(index)}
                  className="ml-2 p-1.5 text-fg-subtle hover:text-danger rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <textarea
                {...register(`faqs.${index}.answer` as const)}
                placeholder="Answer (e.g. Yes! High-speed WiFi is available.)"
                rows={2}
                className="w-full text-xs px-3 py-2 bg-surface text-fg placeholder:text-fg-subtle border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
