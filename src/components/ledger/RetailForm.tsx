'use client';

import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, ShoppingBag, UserCheck, Clock, HelpCircle } from 'lucide-react';
import { OnboardingWizardFormData } from '../../lib/validations/onboarding';

export const RetailForm: React.FC = () => {
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
    fields: staffFields,
    append: appendStaff,
    remove: removeStaff,
  } = useFieldArray({
    control,
    name: 'staff',
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
      {/* 1. Apparel & Product Catalog */}
      <div className="bg-surface border border-line rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-fg">Apparel & Product Catalog</h3>
          </div>
          <button
            type="button"
            onClick={() => appendMenu({ name: '', price: 999, unit: 'pcs' })}
            className="inline-flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-accent-fg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {menuFields.map((field, index) => (
            <div
              key={field.id}
              className="p-3 bg-surface-subtle rounded-lg border border-line space-y-2 sm:space-y-0 sm:grid sm:grid-cols-12 sm:gap-3 sm:items-center"
            >
              <div className="sm:col-span-5">
                <div className="flex items-center justify-between mb-1 sm:block">
                  <label className="block text-[11px] font-medium text-fg-muted">Product Name & Variant</label>
                  {menuFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMenu(index)}
                      className="sm:hidden p-1 text-fg-subtle hover:text-danger rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <input
                  {...register(`menu_items.${index}.name` as const)}
                  placeholder="e.g. Designer Silk Kurti (M/L/XL)"
                  className="w-full text-xs font-medium px-3 py-2 bg-surface text-fg placeholder:text-fg-subtle border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 sm:contents">
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-medium text-fg-muted mb-1">Price (₹)</label>
                  <input
                    type="number"
                    {...register(`menu_items.${index}.price` as const)}
                    placeholder="1499"
                    className="w-full text-xs font-mono font-semibold px-3 py-2 bg-surface text-fg placeholder:text-fg-subtle border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-medium text-fg-muted mb-1">Unit / Size</label>
                  <input
                    {...register(`menu_items.${index}.unit` as const)}
                    placeholder="pcs / pack"
                    className="w-full text-xs font-medium px-2 py-2 bg-surface text-fg placeholder:text-fg-subtle border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-center"
                  />
                </div>
              </div>

              <div className="hidden sm:flex sm:col-span-1 justify-end pt-5">
                {menuFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMenu(index)}
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

      {/* 2. Store Associates */}
      <div className="bg-surface border border-line rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-fg">Store Associates & Stylists</h3>
          </div>
          <button
            type="button"
            onClick={() => appendStaff({ name: '', specialty: 'Store Specialist' })}
            className="inline-flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-surface-subtle hover:bg-surface-hover text-fg border border-line transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Associate</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {staffFields.map((field, index) => (
            <div key={field.id} className="p-3 bg-surface-subtle rounded-lg border border-line space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-medium text-fg-muted">Staff #{index + 1}</span>
                {staffFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeStaff(index)}
                    className="p-1 text-fg-subtle hover:text-danger rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <input
                {...register(`staff.${index}.name` as const)}
                placeholder="Associate Name (e.g. Pooja Sharma)"
                className="w-full text-xs font-medium px-3 py-2 bg-surface text-fg placeholder:text-fg-subtle border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
              <input
                {...register(`staff.${index}.specialty` as const)}
                placeholder="Role (e.g. Senior Fashion Stylist)"
                className="w-full text-xs px-3 py-2 bg-surface text-fg placeholder:text-fg-subtle border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 3. Store Hours & Delivery Slots */}
      <div className="bg-surface border border-line rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold text-fg">Store Timings & Shipping Slots</h3>
        </div>
        <input
          {...register('hours')}
          placeholder="e.g. Open daily: 10:30 AM - 9:00 PM. Local delivery within 24 hours."
          className="w-full text-xs px-3.5 py-2.5 bg-surface text-fg placeholder:text-fg-subtle border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
        />
        {errors.hours && (
          <p className="text-xs text-danger mt-1 font-medium">{errors.hours.message}</p>
        )}
      </div>

      {/* 4. Customer FAQs */}
      <div className="bg-surface border border-line rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-fg">Customer FAQs & Return Policy</h3>
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
                <span className="text-[11px] font-medium text-fg-muted">FAQ #{index + 1}</span>
                {faqFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFaq(index)}
                    className="p-1 text-fg-subtle hover:text-danger rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <input
                {...register(`faqs.${index}.question` as const)}
                placeholder="Question (e.g. Do you accept size exchanges?)"
                className="w-full text-xs font-medium px-3 py-2 bg-surface text-fg placeholder:text-fg-subtle border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
              <input
                {...register(`faqs.${index}.answer` as const)}
                placeholder="Answer (e.g. Yes! Easy 3-day size exchange is available at our store.)"
                className="w-full text-xs px-3 py-2 bg-surface text-fg placeholder:text-fg-subtle border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
