'use client';

import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, Building2, UserCheck, Clock, HelpCircle } from 'lucide-react';
import { OnboardingWizardFormData } from '../../lib/validations/onboarding';

export const RealEstateForm: React.FC = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<OnboardingWizardFormData>();

  const {
    fields: serviceFields,
    append: appendService,
    remove: removeService,
  } = useFieldArray({
    control,
    name: 'services',
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
      {/* 1. Property Configurations & Pricing */}
      <div className="bg-surface border border-line rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-fg">Property Configurations & Price Catalog</h3>
          </div>
          <button
            type="button"
            onClick={() => appendService({ name: '', price: 6500000, duration: 'Site Visit' })}
            className="inline-flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-accent-fg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Property</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {serviceFields.map((field, index) => (
            <div
              key={field.id}
              className="p-3 bg-surface-subtle rounded-lg border border-line space-y-2 sm:space-y-0 sm:grid sm:grid-cols-12 sm:gap-3 sm:items-center"
            >
              <div className="sm:col-span-5">
                <div className="flex items-center justify-between mb-1 sm:block">
                  <label className="block text-[11px] font-medium text-fg-muted">Configuration / Unit</label>
                  {serviceFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeService(index)}
                      className="sm:hidden p-1 text-fg-subtle hover:text-danger rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <input
                  {...register(`services.${index}.name` as const)}
                  placeholder="e.g. 2 BHK Luxury Flat (950 sq.ft)"
                  className="w-full text-xs font-medium px-3 py-2 bg-surface text-fg placeholder:text-fg-subtle border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 sm:contents">
                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-medium text-fg-muted mb-1">Starting Price (₹)</label>
                  <input
                    type="number"
                    {...register(`services.${index}.price` as const)}
                    placeholder="6500000"
                    className="w-full text-xs font-mono font-semibold px-3 py-2 bg-surface text-fg placeholder:text-fg-subtle border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium text-fg-muted mb-1">Visit Type</label>
                  <input
                    {...register(`services.${index}.duration` as const)}
                    placeholder="Site Visit"
                    className="w-full text-xs font-medium px-2 py-2 bg-surface text-fg placeholder:text-fg-subtle border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-center"
                  />
                </div>
              </div>

              <div className="hidden sm:flex sm:col-span-1 justify-end pt-5">
                {serviceFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeService(index)}
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

      {/* 2. Property Advisors */}
      <div className="bg-surface border border-line rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-fg">Relationship Managers & Site Advisors</h3>
          </div>
          <button
            type="button"
            onClick={() => appendStaff({ name: '', specialty: 'Property Consultant' })}
            className="inline-flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-surface-subtle hover:bg-surface-hover text-fg border border-line transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Consultant</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {staffFields.map((field, index) => (
            <div key={field.id} className="p-3 bg-surface-subtle rounded-lg border border-line space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-medium text-fg-muted">Advisor #{index + 1}</span>
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
                placeholder="Advisor Name (e.g. Kunal Mehra)"
                className="w-full text-xs font-medium px-3 py-2 bg-surface text-fg placeholder:text-fg-subtle border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
              <input
                {...register(`staff.${index}.specialty` as const)}
                placeholder="Project / Area (e.g. Palm Meadows Township)"
                className="w-full text-xs px-3 py-2 bg-surface text-fg placeholder:text-fg-subtle border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 3. Site Office Hours */}
      <div className="bg-surface border border-line rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold text-fg">Site Office & Visit Timings</h3>
        </div>
        <input
          {...register('hours')}
          placeholder="e.g. Open daily: 10:00 AM - 7:00 PM (Weekend site tours available)"
          className="w-full text-xs px-3.5 py-2.5 bg-surface text-fg placeholder:text-fg-subtle border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
        />
        {errors.hours && (
          <p className="text-xs text-danger mt-1 font-medium">{errors.hours.message}</p>
        )}
      </div>

      {/* 4. Buyer FAQs */}
      <div className="bg-surface border border-line rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-fg">Buyer FAQs</h3>
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
                placeholder="Question (e.g. Are home loan partners approved?)"
                className="w-full text-xs font-medium px-3 py-2 bg-surface text-fg placeholder:text-fg-subtle border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
              <input
                {...register(`faqs.${index}.answer` as const)}
                placeholder="Answer (e.g. Yes! Approved by SBI, HDFC, and ICICI Bank with zero processing fees.)"
                className="w-full text-xs px-3 py-2 bg-surface text-fg placeholder:text-fg-subtle border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
