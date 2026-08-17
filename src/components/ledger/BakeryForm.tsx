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
    <div className="space-y-6">
      {/* 1. Menu Items Section */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Utensils className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-semibold text-slate-900">Bakery Menu & Pricing Catalog</h3>
          </div>
          <button
            type="button"
            onClick={() => appendMenu({ name: '', price: 100, unit: 'pcs' })}
            className="inline-flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {menuFields.map((field, index) => (
            <div
              key={field.id}
              className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2 sm:space-y-0 sm:grid sm:grid-cols-12 sm:gap-3 sm:items-center"
            >
              <div className="sm:col-span-6">
                <div className="flex items-center justify-between mb-1 sm:block">
                  <label className="block text-[11px] font-medium text-slate-500">Item Name</label>
                  {menuFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMenu(index)}
                      className="sm:hidden p-1 text-slate-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <input
                  {...register(`menu_items.${index}.name` as const)}
                  placeholder="e.g. Chocolate Truffle Cake (1kg)"
                  className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 sm:contents">
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    {...register(`menu_items.${index}.price` as const)}
                    placeholder="500"
                    className="w-full text-xs font-mono font-semibold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Unit</label>
                  <input
                    {...register(`menu_items.${index}.unit` as const)}
                    placeholder="kg / pcs"
                    className="w-full text-xs font-medium px-2 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-center"
                  />
                </div>
              </div>

              <div className="hidden sm:flex sm:col-span-1 justify-end pt-5">
                {menuFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMenu(index)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
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
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-slate-700" />
          <h3 className="text-sm font-semibold text-slate-900">Store Hours</h3>
        </div>
        <input
          {...register('hours')}
          placeholder="e.g. Monday to Sunday, 9:00 AM - 9:30 PM (Closed on Tuesdays)"
          className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
        />
        {errors.hours && (
          <p className="text-xs text-red-600 mt-1">{errors.hours.message}</p>
        )}
      </div>

      {/* 3. Customer FAQs */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-semibold text-slate-900">Frequently Asked Questions</h3>
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
                <span className="text-[11px] font-medium text-slate-500">FAQ #{index + 1}</span>
                {faqFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFaq(index)}
                    className="p-1 text-slate-400 hover:text-red-600 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <input
                {...register(`faqs.${index}.question` as const)}
                placeholder="Question (e.g. Do you deliver eggless cakes?)"
                className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-200 rounded-lg"
              />
              <input
                {...register(`faqs.${index}.answer` as const)}
                placeholder="Answer (e.g. Yes! All our cakes can be prepared 100% eggless upon request.)"
                className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
