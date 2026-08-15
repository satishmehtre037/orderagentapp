import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, Scissors, UserCheck, Clock, HelpCircle } from 'lucide-react';
import { OnboardingWizardFormData } from '../../lib/validations/onboarding';

export const SalonForm: React.FC = () => {
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
    <div className="space-y-8">
      {/* 1. Services & Treatments */}
      <div className="bg-paper border border-warm-border rounded-lg p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-warm-border">
          <div className="flex items-center space-x-2">
            <Scissors className="w-5 h-5 text-teal" />
            <h3 className="font-serif text-lg font-bold text-ink">Salon Services & Appointment Price List</h3>
          </div>
          <button
            type="button"
            onClick={() => appendService({ name: '', price: 300, duration: '30 mins' })}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-teal-light text-teal border border-teal/20 hover:bg-teal hover:text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Service</span>
          </button>
        </div>

        <div className="space-y-3">
          {serviceFields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-12 gap-2 sm:gap-3 items-center p-2.5 bg-warm-card rounded-md border border-warm-border/70"
            >
              <div className="col-span-5 sm:col-span-5">
                <label className="block text-[11px] font-mono text-ink-light mb-1">Service Name</label>
                <input
                  {...register(`services.${index}.name` as const)}
                  placeholder="e.g. Haircut & Styling"
                  className="w-full text-xs font-medium px-3 py-2 bg-paper border border-warm-border rounded"
                />
              </div>

              <div className="col-span-3 sm:col-span-3">
                <label className="block text-[11px] font-mono text-ink-light mb-1">Price (₹)</label>
                <input
                  type="number"
                  {...register(`services.${index}.price` as const)}
                  placeholder="400"
                  className="w-full text-xs font-mono tabular-nums font-semibold px-3 py-2 bg-paper border border-warm-border rounded"
                />
              </div>

              <div className="col-span-3 sm:col-span-3">
                <label className="block text-[11px] font-mono text-ink-light mb-1">Duration</label>
                <input
                  {...register(`services.${index}.duration` as const)}
                  placeholder="45 mins"
                  className="w-full text-xs font-medium px-2 py-2 bg-paper border border-warm-border rounded text-center"
                />
              </div>

              <div className="col-span-1 flex justify-end pt-5">
                {serviceFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeService(index)}
                    className="p-1.5 text-ink-light hover:text-red-600 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Staff / Specialists */}
      <div className="bg-paper border border-warm-border rounded-lg p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-warm-border">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-teal" />
            <h3 className="font-serif text-lg font-bold text-ink">Staff & Stylists</h3>
          </div>
          <button
            type="button"
            onClick={() => appendStaff({ name: '' })}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-teal-light text-teal border border-teal/20 hover:bg-teal hover:text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Stylist</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {staffFields.map((field, index) => (
            <div key={field.id} className="flex items-center space-x-2">
              <input
                {...register(`staff.${index}.name` as const)}
                placeholder={`Stylist #${index + 1} Name`}
                className="w-full text-xs font-medium px-3 py-2 bg-paper border border-warm-border rounded"
              />
              {staffFields.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeStaff(index)}
                  className="p-1 text-ink-light hover:text-red-600 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 3. Business Hours */}
      <div className="bg-paper border border-warm-border rounded-lg p-5 shadow-sm">
        <div className="flex items-center space-x-2 mb-3">
          <Clock className="w-5 h-5 text-teal" />
          <h3 className="font-serif text-lg font-bold text-ink">Salon Hours & Appointment Slots</h3>
        </div>
        <input
          {...register('hours')}
          placeholder="e.g. Tuesday to Sunday, 10:00 AM - 8:00 PM (Slots available every 30 mins)"
          className="w-full text-sm px-3.5 py-2.5 bg-paper border border-warm-border rounded-md focus:border-teal"
        />
        {errors.hours && (
          <p className="text-xs text-red-600 mt-1">{errors.hours.message}</p>
        )}
      </div>

      {/* 4. FAQs */}
      <div className="bg-paper border border-warm-border rounded-lg p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-warm-border">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-5 h-5 text-teal" />
            <h3 className="font-serif text-lg font-bold text-ink">Salon FAQs</h3>
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
                placeholder="Question (e.g. Do I need to book in advance?)"
                className="w-full text-xs font-medium px-3 py-2 bg-paper border border-warm-border rounded"
              />
              <input
                {...register(`faqs.${index}.answer` as const)}
                placeholder="Answer (e.g. Prior booking is recommended for weekends!)"
                className="w-full text-xs px-3 py-2 bg-paper border border-warm-border rounded"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
