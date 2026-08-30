'use client';

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
      <div className="bg-surface border border-line rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div className="flex items-center space-x-2">
            <Dumbbell className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-fg">Gym Memberships & Passes</h3>
          </div>
          <button
            type="button"
            onClick={() => appendPlan({ name: '', price: 1500, duration: '1 Month' })}
            className="inline-flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-accent-fg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Plan</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {planFields.map((field, index) => (
            <div
              key={field.id}
              className="p-3 bg-surface-subtle rounded-lg border border-line space-y-2 sm:space-y-0 sm:grid sm:grid-cols-12 sm:gap-3 sm:items-center"
            >
              <div className="sm:col-span-5">
                <div className="flex items-center justify-between mb-1 sm:block">
                  <label className="block text-[11px] font-medium text-fg-muted">Plan Name</label>
                  {planFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePlan(index)}
                      className="sm:hidden p-1 text-fg-subtle hover:text-danger rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <input
                  {...register(`gym_plans.${index}.name` as const)}
                  placeholder="e.g. Monthly Standard"
                  className="w-full text-xs px-3 py-2 bg-surface text-fg placeholder:text-fg-subtle border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 sm:contents">
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-medium text-fg-muted mb-1">Price (₹)</label>
                  <input
                    type="number"
                    {...register(`gym_plans.${index}.price` as const)}
                    placeholder="1500"
                    className="w-full text-xs px-3 py-2 bg-surface text-fg placeholder:text-fg-subtle border border-line rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-medium text-fg-muted mb-1">Duration</label>
                  <input
                    {...register(`gym_plans.${index}.duration` as const)}
                    placeholder="e.g. 1 Month"
                    className="w-full text-xs px-3 py-2 bg-surface text-fg placeholder:text-fg-subtle border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-center"
                  />
                </div>
              </div>

              <div className="hidden sm:flex sm:col-span-1 justify-end pt-5">
                {planFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePlan(index)}
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

      {/* 2. Trainers / Staff Section */}
      <div className="bg-surface border border-line rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-fg">Trainers & Coaches</h3>
          </div>
          <button
            type="button"
            onClick={() => appendTrainer({ name: '', specialty: 'Fitness Trainer' })}
            className="inline-flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-surface-subtle hover:bg-surface-hover text-fg border border-line transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Trainer</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {trainerFields.map((field, index) => (
            <div key={field.id} className="p-3 bg-surface-subtle rounded-lg border border-line space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-medium text-fg-muted">Trainer #{index + 1}</span>
                {trainerFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTrainer(index)}
                    className="p-1 text-fg-subtle hover:text-danger rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <input
                {...register(`staff.${index}.name` as const)}
                placeholder="Trainer Name (e.g. Vikram Singh)"
                className="w-full text-xs font-medium px-3 py-2 bg-surface text-fg placeholder:text-fg-subtle border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
              <input
                {...register(`staff.${index}.specialty` as const)}
                placeholder="Specialty (e.g. Strength & Conditioning Coach)"
                className="w-full text-xs px-3 py-2 bg-surface text-fg placeholder:text-fg-subtle border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 3. Gym Timings */}
      <div className="bg-surface border border-line rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold text-fg">Gym Operating Hours</h3>
        </div>
        <input
          {...register('hours')}
          placeholder="e.g. Mon - Sat: 6:00 AM - 10:00 PM | Sun: 7:00 AM - 1:00 PM"
          className="w-full text-xs px-3.5 py-2.5 bg-surface text-fg placeholder:text-fg-subtle border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
        />
        {errors.hours && (
          <p className="text-xs text-danger mt-1 font-medium">{errors.hours.message}</p>
        )}
      </div>

      {/* 4. Gym FAQs */}
      <div className="bg-surface border border-line rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-fg">Gym FAQs</h3>
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
                placeholder="Question (e.g. Do you offer free trial workouts?)"
                className="w-full text-xs font-medium px-3 py-2 bg-surface text-fg placeholder:text-fg-subtle border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
              <input
                {...register(`faqs.${index}.answer` as const)}
                placeholder="Answer (e.g. Yes! First session is completely free.)"
                className="w-full text-xs px-3 py-2 bg-surface text-fg placeholder:text-fg-subtle border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
