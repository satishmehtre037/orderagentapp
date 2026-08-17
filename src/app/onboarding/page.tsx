'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabaseClient } from '../../lib/supabase/client';
import {
  onboardingWizardSchema,
  OnboardingWizardFormData,
} from '../../lib/validations/onboarding';
import { StepIndicator } from '../../components/ledger/StepIndicator';
import { CategorySelector } from '../../components/ledger/CategorySelector';
import { BakeryForm } from '../../components/ledger/BakeryForm';
import { CafeForm } from '../../components/ledger/CafeForm';
import { SalonForm } from '../../components/ledger/SalonForm';
import { ClinicForm } from '../../components/ledger/ClinicForm';
import { GymForm } from '../../components/ledger/GymForm';
import { TuitionForm } from '../../components/ledger/TuitionForm';
import { RetailForm } from '../../components/ledger/RetailForm';
import { RealEstateForm } from '../../components/ledger/RealEstateForm';
import { ReviewLedgerCard } from '../../components/ledger/ReviewLedgerCard';
import { CATEGORY_PRESETS } from '../../lib/constants/categoryPresets';
import { BusinessCategory } from '../../types';
import { Bot, ArrowRight, ArrowLeft, PhoneCall, Info } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [ownerEmail, setOwnerEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Initialize form with default category items
  const methods = useForm<OnboardingWizardFormData>({
    resolver: zodResolver(onboardingWizardSchema),
    defaultValues: {
      business_name: '',
      category: 'bakery',
      whatsapp_number: '',
      hours: 'Mon - Sun, 9:00 AM - 9:00 PM',
      menu_items: [
        { name: 'Fresh Chocolate Truffle Cake (1kg)', price: 650, unit: 'kg' },
        { name: 'Butter Croissant', price: 90, unit: 'pcs' },
      ],
      services: [
        { name: 'Deluxe Haircut & Blowdry', price: 450, duration: '45 mins' },
        { name: 'Hydrating Facial Treatment', price: 1200, duration: '60 mins' },
      ],
      staff: [{ name: 'Ankita (Senior Stylist)' }, { name: 'Rahul (Specialist)' }],
      courses: [
        { name: 'Class 10th CBSE Mathematics', fee: '₹2,500/month', batch_timing: 'Mon-Fri 5:00 PM' },
        { name: 'NEET Foundation Chemistry', fee: '₹3,500/month', batch_timing: 'Mon-Sat 6:30 PM' },
      ],
      admission_process: '2-Day free trial demo class available. Registration requires parent contact details.',
      faqs: [
        {
          question: 'What are your working hours?',
          answer: 'We are open Monday to Sunday from 9:00 AM to 9:00 PM.',
        },
      ],
    },
  });

  const { handleSubmit, watch, setValue, trigger, formState: { errors } } = methods;
  const selectedCategory = watch('category');
  const formData = watch();

  const handleCategorySelect = (cat: BusinessCategory) => {
    setValue('category', cat);
    const preset = CATEGORY_PRESETS[cat];
    if (preset) {
      if (preset.hours) setValue('hours', preset.hours);
      if (preset.faqs) setValue('faqs', preset.faqs);
      if (preset.menu_items) setValue('menu_items', preset.menu_items);
      if (preset.cafe_menu) setValue('cafe_menu', preset.cafe_menu);
      if (preset.services) setValue('services', preset.services);
      if (preset.staff) setValue('staff', preset.staff);
      if (preset.gym_plans) setValue('gym_plans', preset.gym_plans);
      if (preset.courses) setValue('courses', preset.courses);
      if (preset.admission_process) setValue('admission_process', preset.admission_process);
    }
  };

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session?.user?.email) {
        const userEmail = session.user.email;
        setOwnerEmail(userEmail);

        try {
          const res = await fetch(`/api/business?email=${encodeURIComponent(userEmail.trim())}`);
          const bizData = await res.json();
          if (bizData?.business?.id) {
            router.push('/dashboard');
          }
        } catch (e) {
          console.error('Error checking existing business:', e);
        }
      } else {
        setOwnerEmail('owner@bizbotos.in');
      }
    }
    checkAuth();
  }, [router]);

  const handleNextStep = async () => {
    setSubmitError(null);
    if (currentStep === 1) {
      const valid = await trigger(['business_name', 'category']);
      if (valid) setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      const valid = await trigger(['whatsapp_number']);
      if (valid) setCurrentStep(4);
    }
  };

  const handlePrevStep = () => {
    setSubmitError(null);
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const onSubmitWizard = async (data: OnboardingWizardFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const cleanDigits = data.whatsapp_number.replace(/\D/g, '').replace(/^91/, '');
      const fullWhatsAppNumber = cleanDigits ? `+91${cleanDigits}` : '';

      const payload = {
        ownerEmail,
        businessName: data.business_name,
        category: data.category,
        whatsappNumber: fullWhatsAppNumber,
        formData: {
          ...data,
          whatsapp_number: fullWhatsAppNumber,
        },
      };

      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to complete onboarding');
      }

      if (typeof window !== 'undefined') {
        if (resData.businessId) localStorage.setItem('biz_id', resData.businessId);
        if (data.category) localStorage.setItem('biz_category', data.category);
        if (ownerEmail) localStorage.setItem('biz_email', ownerEmail);
      }

      router.push('/dashboard');
    } catch (err: any) {
      console.error('Onboarding submission error:', err);
      setSubmitError(err.message || 'Something went wrong. Please check your data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-[#F8FAFC] py-6 sm:py-10 px-3 sm:px-6 lg:px-8 font-sans antialiased text-slate-900 overflow-x-hidden max-w-full pt-[max(env(safe-area-inset-top),2.5rem)] pb-safe">
      <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-slate-950 border border-white/20 shadow-md flex items-center justify-center p-1.5 flex-shrink-0">
              <img
                src="/logo.png"
                alt="Agento AI"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">Agento AI</h1>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Autonomous WhatsApp AI Setup</p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-slate-200/80 text-slate-700 rounded-full border border-slate-300/70 flex-shrink-0">
            Step {currentStep} of 4
          </span>
        </div>

        {/* Step Indicator Bar */}
        <StepIndicator currentStep={currentStep} />

        {/* Error Notification */}
        {submitError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start space-x-2">
            <Info className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Form Body */}
        <FormProvider {...methods}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (currentStep < 4) {
                handleNextStep();
              }
            }}
            className="space-y-6"
          >
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-8 shadow-sm">
              {/* STEP 1 */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
                      Step 1 of 4 — Business Profile
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 mt-1">
                      Tell us about your Business
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Select your category and enter your business details to configure your AI agent knowledge base.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Business Name *
                    </label>
                    <input
                      {...methods.register('business_name')}
                      placeholder="e.g. CafeDay Artisan Bakery"
                      className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-medium"
                    />
                    {errors.business_name && (
                      <p className="text-xs text-red-600 mt-1">{errors.business_name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Select Business Category *
                    </label>
                    <CategorySelector
                      value={selectedCategory}
                      onChange={handleCategorySelect}
                    />
                    {errors.category && (
                      <p className="text-xs text-red-600 mt-1">{errors.category.message}</p>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 2 */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
                      Step 2 of 4 — Catalog & Services
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 mt-1">
                      {selectedCategory === 'bakery'
                        ? 'Set up your Bakery Menu & Pricing'
                        : selectedCategory === 'cafe'
                        ? 'Set up your Cafe Menu & Beverages'
                        : selectedCategory === 'salon'
                        ? 'Set up your Salon Services & Pricing'
                        : selectedCategory === 'clinic'
                        ? 'Set up Doctor Consultations & OPD Tariffs'
                        : selectedCategory === 'gym'
                        ? 'Set up your Gym Memberships & Passes'
                        : selectedCategory === 'tuition'
                        ? 'Set up your Courses & Fee Structure'
                        : selectedCategory === 'retail'
                        ? 'Set up your Retail Product Catalog & Prices'
                        : selectedCategory === 'real_estate'
                        ? 'Set up your Property Configurations & Advisory'
                        : 'Set up your Service Catalog & Pricing'}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Your AI agent uses these exact items to answer customer questions and take orders on WhatsApp.
                    </p>
                  </div>

                  {selectedCategory === 'bakery' && <BakeryForm />}
                  {selectedCategory === 'cafe' && <CafeForm />}
                  {selectedCategory === 'salon' && <SalonForm />}
                  {selectedCategory === 'clinic' && <ClinicForm />}
                  {selectedCategory === 'gym' && <GymForm />}
                  {selectedCategory === 'tuition' && <TuitionForm />}
                  {selectedCategory === 'retail' && <RetailForm />}
                  {selectedCategory === 'real_estate' && <RealEstateForm />}
                  {selectedCategory === 'custom' && <SalonForm />}
                </div>
              )}

              {/* STEP 3 */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
                      Step 3 of 4 — WhatsApp Binding
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 mt-1">
                      Connect your Business WhatsApp Number
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Enter the dedicated phone number that will run your AI assistant.
                    </p>
                  </div>

                  <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-6 space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Business WhatsApp Number *
                      </label>
                      
                      {/* Fixed +91 India Code with 10-Digit Mobile Numberpad */}
                      <div className="flex rounded-lg border border-slate-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-slate-900/10 focus-within:border-slate-900 shadow-sm">
                        <div className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-slate-100/90 border-r border-slate-200 text-slate-700 select-none">
                          <span className="text-base leading-none">🇮🇳</span>
                          <span className="text-xs font-mono font-semibold text-slate-800">+91</span>
                        </div>
                        <input
                          type="tel"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={10}
                          autoComplete="tel-national"
                          value={watch('whatsapp_number') || ''}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setValue('whatsapp_number', digits, { shouldValidate: true });
                          }}
                          placeholder="9876543210"
                          className="flex-1 px-3.5 py-2.5 text-sm font-mono font-semibold text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-400 placeholder:font-normal"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between mt-1.5">
                        {errors.whatsapp_number ? (
                          <p className="text-xs text-red-600 font-medium">{errors.whatsapp_number.message}</p>
                        ) : (
                          <p className="text-[11px] text-slate-500">Enter exactly 10 digits without +91 or 0</p>
                        )}
                        <span className="text-[10px] font-mono text-slate-400">
                          {`${(watch('whatsapp_number') || '').length}/10 digits`}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-white border border-slate-200 rounded-lg text-xs space-y-1.5">
                      <div className="flex items-center space-x-2 text-slate-900 font-semibold">
                        <Info className="w-4 h-4 text-slate-600" />
                        <span>How Meta WhatsApp Integration Works</span>
                      </div>
                      <p className="text-slate-500 leading-relaxed">
                        We connect your number to Meta WhatsApp Cloud API webhooks. Once you click "Go Live", your AI agent will automatically start responding to customer messages sent to this number.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4 */}
              {currentStep === 4 && (
                <ReviewLedgerCard
                  formData={formData}
                  ownerEmail={ownerEmail}
                  onBack={handlePrevStep}
                  onGoLive={() => {
                    handleSubmit(
                      (validData) => onSubmitWizard(validData),
                      (errs) => {
                        console.warn('[Onboarding] Validation warning on Go Live:', errs);
                        onSubmitWizard(methods.getValues());
                      }
                    )();
                  }}
                  isSubmitting={isSubmitting}
                />
              )}

              {/* Action Buttons */}
              {currentStep < 4 && (
                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    disabled={currentStep === 1}
                    className="inline-flex items-center space-x-2 text-xs font-medium px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="inline-flex items-center space-x-2 text-xs font-medium px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-colors"
                  >
                    <span>Save & Continue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </form>
        </FormProvider>
      </div>
    </main>
  );
}
