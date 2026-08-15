import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, GraduationCap, BookOpen, HelpCircle } from 'lucide-react';
import { OnboardingWizardFormData } from '../../lib/validations/onboarding';

export const TuitionForm: React.FC = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<OnboardingWizardFormData>();

  const {
    fields: courseFields,
    append: appendCourse,
    remove: removeCourse,
  } = useFieldArray({
    control,
    name: 'courses',
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
      {/* 1. Courses & Fees */}
      <div className="bg-paper border border-warm-border rounded-lg p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-warm-border">
          <div className="flex items-center space-x-2">
            <GraduationCap className="w-5 h-5 text-teal" />
            <h3 className="font-serif text-lg font-bold text-ink">Course Offerings & Fee Ledger</h3>
          </div>
          <button
            type="button"
            onClick={() => appendCourse({ name: '', fee: '₹2,000/mo', batch_timing: 'Evening 4-6 PM' })}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-teal-light text-teal border border-teal/20 hover:bg-teal hover:text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Course</span>
          </button>
        </div>

        <div className="space-y-3">
          {courseFields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-12 gap-2 sm:gap-3 items-center p-2.5 bg-warm-card rounded-md border border-warm-border/70"
            >
              <div className="col-span-5 sm:col-span-5">
                <label className="block text-[11px] font-mono text-ink-light mb-1">Course / Class</label>
                <input
                  {...register(`courses.${index}.name` as const)}
                  placeholder="e.g. Class 10th Mathematics & Science"
                  className="w-full text-xs font-medium px-3 py-2 bg-paper border border-warm-border rounded"
                />
              </div>

              <div className="col-span-3 sm:col-span-3">
                <label className="block text-[11px] font-mono text-ink-light mb-1">Fee Structure</label>
                <input
                  {...register(`courses.${index}.fee` as const)}
                  placeholder="₹2,500/month"
                  className="w-full text-xs font-mono tabular-nums font-semibold px-3 py-2 bg-paper border border-warm-border rounded"
                />
              </div>

              <div className="col-span-3 sm:col-span-3">
                <label className="block text-[11px] font-mono text-ink-light mb-1">Batch Timings</label>
                <input
                  {...register(`courses.${index}.batch_timing` as const)}
                  placeholder="Mon-Fri, 5-7 PM"
                  className="w-full text-xs font-medium px-2 py-2 bg-paper border border-warm-border rounded text-center"
                />
              </div>

              <div className="col-span-1 flex justify-end pt-5">
                {courseFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCourse(index)}
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

      {/* 2. Admission Process Details */}
      <div className="bg-paper border border-warm-border rounded-lg p-5 shadow-sm">
        <div className="flex items-center space-x-2 mb-3">
          <BookOpen className="w-5 h-5 text-teal" />
          <h3 className="font-serif text-lg font-bold text-ink">Admission Process & Demo Class Details</h3>
        </div>
        <textarea
          {...register('admission_process')}
          rows={3}
          placeholder="e.g. 2-day free trial demo class available. Registration requires parent contact, previous report card copy, and 1 month fee in advance."
          className="w-full text-xs leading-relaxed p-3 bg-paper border border-warm-border rounded-md focus:border-teal"
        />
        {errors.admission_process && (
          <p className="text-xs text-red-600 mt-1">{errors.admission_process.message}</p>
        )}
      </div>

      {/* 3. Tuition FAQs */}
      <div className="bg-paper border border-warm-border rounded-lg p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-warm-border">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-5 h-5 text-teal" />
            <h3 className="font-serif text-lg font-bold text-ink">Admission FAQs</h3>
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
                placeholder="Question (e.g. Do you provide study material?)"
                className="w-full text-xs font-medium px-3 py-2 bg-paper border border-warm-border rounded"
              />
              <input
                {...register(`faqs.${index}.answer` as const)}
                placeholder="Answer (e.g. Yes! Printed formula booklets and weekly test series are included.)"
                className="w-full text-xs px-3 py-2 bg-paper border border-warm-border rounded"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
