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
    <div className="space-y-6">
      {/* 1. Courses & Fees */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <GraduationCap className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-semibold text-slate-900">Course Offerings & Fee Structure</h3>
          </div>
          <button
            type="button"
            onClick={() => appendCourse({ name: '', fee: '₹2,000/mo', batch_timing: 'Evening 4-6 PM' })}
            className="inline-flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Course</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {courseFields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-12 gap-2 sm:gap-3 items-center p-3 bg-slate-50 rounded-lg border border-slate-200/80"
            >
              <div className="col-span-5 sm:col-span-5">
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Course / Class</label>
                <input
                  {...register(`courses.${index}.name` as const)}
                  placeholder="e.g. Class 10th Mathematics"
                  className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>

              <div className="col-span-3 sm:col-span-3">
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Fee Structure</label>
                <input
                  {...register(`courses.${index}.fee` as const)}
                  placeholder="₹2,500/month"
                  className="w-full text-xs font-mono font-semibold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>

              <div className="col-span-3 sm:col-span-3">
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Batch Timings</label>
                <input
                  {...register(`courses.${index}.batch_timing` as const)}
                  placeholder="Mon-Fri, 5-7 PM"
                  className="w-full text-xs font-medium px-2 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-center"
                />
              </div>

              <div className="col-span-1 flex justify-end pt-5">
                {courseFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCourse(index)}
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

      {/* 2. Admission Process Details */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-4 h-4 text-slate-700" />
          <h3 className="text-sm font-semibold text-slate-900">Admission Process & Demo Classes</h3>
        </div>
        <textarea
          {...register('admission_process')}
          rows={3}
          placeholder="e.g. 2-day free trial demo class available. Registration requires parent contact and previous report card copy."
          className="w-full text-xs leading-relaxed p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
        />
        {errors.admission_process && (
          <p className="text-xs text-red-600 mt-1">{errors.admission_process.message}</p>
        )}
      </div>

      {/* 3. Tuition FAQs */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-semibold text-slate-900">Admission FAQs</h3>
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
                placeholder="Question (e.g. Do you provide study material?)"
                className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-200 rounded-lg"
              />
              <input
                {...register(`faqs.${index}.answer` as const)}
                placeholder="Answer (e.g. Yes! Printed test series and notes are included.)"
                className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
