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
    <div className="space-y-6">
      {/* 1. Membership Plans Section */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Dumbbell className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-semibold text-slate-900">Gym Memberships & Passes</h3>
          </div>
          <button
            type="button"
            onClick={() => appendPlan({ name: '', price: 1500, duration: '1 Month' })}
            className="inline-flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Plan</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {planFields.map((field, index) => (
            <div
              key={field.id}
              className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2 sm:space-y-0 sm:grid sm:grid-cols-12 sm:gap-3 sm:items-center"
            >
              <div className="sm:col-span-5">
                <div className="flex items-center justify-between mb-1 sm:block">
                  <label className="block text-[11px] font-medium text-slate-500">Plan Name</label>
                  {planFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePlan(index)}
                      className="sm:hidden p-1 text-slate-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <input
                  {...register(`gym_plans.${index}.name` as const)}
                  placeholder="e.g. Monthly Standard"
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 sm:contents">
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    {...register(`gym_plans.${index}.price` as const)}
                    placeholder="1500"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Duration</label>
                  <input
                    {...register(`gym_plans.${index}.duration` as const)}
                    placeholder="e.g. 1 Month"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-center"
                  />
                </div>
              </div>

              <div className="hidden sm:flex sm:col-span-1 justify-end pt-5">
                {planFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePlan(index)}
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

      {/* 2. Personal Trainers */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-semibold text-slate-900">Trainers & Coaches</h3>
          </div>
          <button
            type="button"
            onClick={() => appendTrainer({ name: '', specialty: 'Strength & Conditioning' })}
            className="inline-flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Trainer</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {trainerFields.map((field, index) => (
            <div
              key={field.id}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200/80"
            >
              <div className="flex-1 mr-2 space-y-1">
                <input
                  {...register(`staff.${index}.name` as const)}
                  placeholder="Trainer Name"
                  className="w-full text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
                />
                <input
                  {...register(`staff.${index}.specialty` as const)}
                  placeholder="Specialty (e.g. Strength / Cardio)"
                  className="w-full text-[11px] px-2.5 py-1 bg-white border border-slate-200 rounded-lg"
                />
              </div>
              <button
                type="button"
                onClick={() => removeTrainer(index)}
                className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Timings */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-slate-700" />
          <h3 className="text-sm font-semibold text-slate-900">Gym Hours & Batches</h3>
        </div>
        <textarea
          {...register('hours')}
          placeholder="e.g. Mon-Sat: 6:00 AM - 11:00 AM, 5:00 PM - 10:00 PM. Sunday: 7:00 AM - 1:00 PM."
          rows={2}
          className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-mono"
        />
      </div>

      {/* 4. FAQs */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-semibold text-slate-900">Gym FAQs</h3>
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
                  placeholder="Question (e.g. Free trial session?)"
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
                placeholder="Answer (e.g. Yes! We offer 1 free workout pass.)"
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
