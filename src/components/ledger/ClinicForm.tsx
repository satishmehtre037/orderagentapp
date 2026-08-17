import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, Stethoscope, UserCheck, Clock, HelpCircle } from 'lucide-react';
import { OnboardingWizardFormData } from '../../lib/validations/onboarding';

export const ClinicForm: React.FC = () => {
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
      {/* 1. Doctor Consultations & OPD Tariffs */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Stethoscope className="w-4 h-4 text-teal-700" />
            <h3 className="text-sm font-semibold text-slate-900">Doctor Consultations & OPD Tariffs</h3>
          </div>
          <button
            type="button"
            onClick={() => appendService({ name: '', price: 500, duration: '20 mins' })}
            className="inline-flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-900 text-white shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Consultation</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {serviceFields.map((field, index) => (
            <div
              key={field.id}
              className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2 sm:space-y-0 sm:grid sm:grid-cols-12 sm:gap-3 sm:items-center"
            >
              <div className="sm:col-span-5">
                <div className="flex items-center justify-between mb-1 sm:block">
                  <label className="block text-[11px] font-medium text-slate-500">Consultation / Treatment</label>
                  {serviceFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeService(index)}
                      className="sm:hidden p-1 text-slate-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <input
                  {...register(`services.${index}.name` as const)}
                  placeholder="e.g. General Physician OPD"
                  className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-900/10 focus:border-teal-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 sm:contents">
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Fee (₹)</label>
                  <input
                    type="number"
                    {...register(`services.${index}.price` as const)}
                    placeholder="500"
                    className="w-full text-xs font-mono font-semibold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-900/10 focus:border-teal-900"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Slot Duration</label>
                  <input
                    {...register(`services.${index}.duration` as const)}
                    placeholder="20 mins"
                    className="w-full text-xs font-medium px-2 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-900/10 focus:border-teal-900 text-center"
                  />
                </div>
              </div>

              <div className="hidden sm:flex sm:col-span-1 justify-end pt-5">
                {serviceFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeService(index)}
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

      {/* 2. Doctors & Specialists */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-teal-700" />
            <h3 className="text-sm font-semibold text-slate-900">Doctors & Specialists</h3>
          </div>
          <button
            type="button"
            onClick={() => appendStaff({ name: '', specialty: 'Specialist' })}
            className="inline-flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Doctor</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {staffFields.map((field, index) => (
            <div
              key={field.id}
              className="flex items-center space-x-2 p-3 bg-slate-50 rounded-lg border border-slate-200/80"
            >
              <div className="flex-1 space-y-1.5">
                <input
                  {...register(`staff.${index}.name` as const)}
                  placeholder="Doctor Name (e.g. Dr. Amit Sharma)"
                  className="w-full text-xs font-medium px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-900/10 focus:border-teal-900"
                />
                <input
                  {...register(`staff.${index}.specialty` as const)}
                  placeholder="Specialty (e.g. MD - Physician, Dentist)"
                  className="w-full text-[11px] px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 focus:ring-2 focus:ring-teal-900/10 focus:border-teal-900"
                />
              </div>
              {staffFields.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeStaff(index)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 3. Clinic Hours */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
          <Clock className="w-4 h-4 text-teal-700" />
          <h3 className="text-sm font-semibold text-slate-900">Clinic OPD Hours & Days</h3>
        </div>
        <input
          {...register('hours')}
          placeholder="e.g. Mon - Sat, 9:00 AM - 8:00 PM (Sunday Closed)"
          className="w-full text-xs font-medium px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-900/10 focus:border-teal-900"
        />
      </div>

      {/* 4. Clinic FAQs */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-4 h-4 text-teal-700" />
            <h3 className="text-sm font-semibold text-slate-900">Clinic Patient FAQs</h3>
          </div>
          <button
            type="button"
            onClick={() => appendFaq({ question: '', answer: '' })}
            className="inline-flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add FAQ</span>
          </button>
        </div>

        <div className="space-y-3">
          {faqFields.map((field, index) => (
            <div key={field.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-600">FAQ #{index + 1}</span>
                {faqFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFaq(index)}
                    className="text-slate-400 hover:text-red-600 transition-colors text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <input
                {...register(`faqs.${index}.question` as const)}
                placeholder="Question (e.g. How to book a consultation?)"
                className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-900/10 focus:border-teal-900"
              />
              <textarea
                rows={2}
                {...register(`faqs.${index}.answer` as const)}
                placeholder="Answer for patient..."
                className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-900/10 focus:border-teal-900"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
