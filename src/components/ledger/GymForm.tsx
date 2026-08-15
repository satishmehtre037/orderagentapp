import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, HelpCircle, Dumbbell, UserCheck, Clock } from 'lucide-react';
import { OnboardingWizardFormData } from '../../lib/validations/onboarding';

export const GymForm: React.FC = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<OnboardingWizardFormData>();

  const {
    fields: planFields,
    append: appendPlan,
    remove: removePlan,
  } = useFieldArray({
    control,
    name: 'gym_plans',
  });

  const {
    fields: trainerFields,
    append: appendTrainer,
    remove: removeTrainer,
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
      {/* 1. Membership Plans Section */}
      <div className="bg-paper border border-warm-border rounded-lg p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-warm-border">
          <div className="flex items-center space-x-2">
            <Dumbbell className="w-5 h-5 text-teal" />
            <h3 className="font-serif text-lg font-bold text-ink">Gym Memberships & Passes</h3>
          </div>
          <button
            type="button"
            onClick={() => appendPlan({ name: '', price: 1500, duration: '1 Month' })}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-teal-light text-teal border border-teal/20 hover:bg-teal hover:text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Membership Plan</span>
          </button>
        </div>

        <div className="space-y-3">
          {planFields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-12 gap-2 sm:gap-3 items-center p-2.5 bg-warm-card rounded-md border border-warm-border/70"
            >
              <div className="col-span-5 sm:col-span-5">
                <label className="block text-[11px] font-mono text-ink-light mb-1">Plan / Package Name</label>
                <input
                  {...register(`gym_plans.${index}.name` as const)}
                  placeholder="e.g. Monthly Standard / Annual VIP"
                  className="w-full text-xs px-2.5 py-1.5 bg-paper border border-warm-border rounded focus:border-teal"
                />
              </div>

              <div className="col-span-3 sm:col-span-3">
                <label className="block text-[11px] font-mono text-ink-light mb-1">Price (₹)</label>
                <input
                  type="number"
                  {...register(`gym_plans.${index}.price` as const)}
                  placeholder="1500"
                  className="w-full text-xs px-2.5 py-1.5 bg-paper border border-warm-border rounded focus:border-teal font-mono"
                />
              </div>

              <div className="col-span-3 sm:col-span-3">
                <label className="block text-[11px] font-mono text-ink-light mb-1">Duration</label>
                <input
                  {...register(`gym_plans.${index}.duration` as const)}
                  placeholder="e.g. 1 Month / 1 Year"
                  className="w-full text-xs px-2.5 py-1.5 bg-paper border border-warm-border rounded focus:border-teal font-mono"
                />
              </div>

              <div className="col-span-1 flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => removePlan(index)}
                  className="p-1.5 text-ink-light hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Personal Trainers */}
      <div className="bg-paper border border-warm-border rounded-lg p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-warm-border">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-teal" />
            <h3 className="font-serif text-lg font-bold text-ink">Trainers & Coaches</h3>
          </div>
          <button
            type="button"
            onClick={() => appendTrainer({ name: '', specialty: 'Strength & Conditioning' })}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-teal-light text-teal border border-teal/20 hover:bg-teal hover:text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Trainer</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {trainerFields.map((field, index) => (
            <div
              key={field.id}
              className="flex items-center justify-between p-2.5 bg-warm-card rounded-md border border-warm-border/70"
            >
              <div className="flex-1 mr-2 space-y-1">
                <input
                  {...register(`staff.${index}.name` as const)}
                  placeholder="Trainer Name (e.g. Vikram)"
                  className="w-full text-xs px-2.5 py-1.5 bg-paper border border-warm-border rounded"
                />
                <input
                  {...register(`staff.${index}.specialty` as const)}
                  placeholder="Specialty (e.g. CrossFit / Bodybuilding)"
                  className="w-full text-[11px] px-2 py-1 bg-paper border border-warm-border rounded"
                />
              </div>
              <button
                type="button"
                onClick={() => removeTrainer(index)}
                className="p-1.5 text-ink-light hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Timings & FAQs */}
      <div className="bg-paper border border-warm-border rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 pb-2 border-b border-warm-border">
          <Clock className="w-5 h-5 text-teal" />
          <h3 className="font-serif text-lg font-bold text-ink">Gym Hours & Batch Timings</h3>
        </div>
        <textarea
          {...register('hours')}
          placeholder="e.g. Mon-Sat: Morning 6:00 AM - 11:00 AM, Evening 5:00 PM - 10:00 PM. Sunday: 7:00 AM - 1:00 PM."
          rows={2}
          className="w-full text-xs px-3 py-2 bg-warm-card border border-warm-border rounded focus:border-teal font-mono"
        />
      </div>

      {/* 4. Common FAQs */}
      <div className="bg-paper border border-warm-border rounded-lg p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-warm-border">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-5 h-5 text-teal" />
            <h3 className="font-serif text-lg font-bold text-ink">Gym Inquiries & FAQs</h3>
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
                  placeholder="Question (e.g. Do you provide a free trial session?)"
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
                placeholder="Answer (e.g. Yes! We offer 1 free trial workout pass. Message us your name to book.)"
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
