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
import { GymForm } from '../../components/ledger/GymForm';
import { TuitionForm } from '../../components/ledger/TuitionForm';
import { ReviewLedgerCard } from '../../components/ledger/ReviewLedgerCard';
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
      whatsapp_number: '+91 ',
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
      admission_process: '2-Day free trial demo class available. Registration requires parent contact details and previous report card copy.',
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

  // Check auth user session
  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session?.user?.email) {
        const userEmail = session.user.email;
        setOwnerEmail(userEmail);

        // If user already created a business, auto-redirect straight to dashboard
        try {
          const res = await fetch(`/api/business?email=${encodeURIComponent(userEmail.trim())}`);
          const bizData = await res.json();
          if (bizData?.business?.id) {
            console.log('[Onboarding] Existing business found, redirecting to dashboard:', bizData.business.name);
            router.push('/dashboard');
          }
        } catch (e) {
          console.error('Error checking existing business:', e);
        }
      } else {
        // If not authenticated, default email fallback for testing
        setOwnerEmail('owner@bizbotos.in');
      }
    }
    checkAuth();
  }, [router]);

  // Step Navigation Validation
  const handleNextStep = async () => {
    setSubmitError(null);
    if (currentStep === 1) {
      const valid = await trigger(['business_name', 'category']);
      if (valid) setCurrentStep(2);
    } else if (currentStep === 2) {
      // Validate step 2
      const valid = await trigger(['hours', 'faqs']);
      if (valid) setCurrentStep(3);
    } else if (currentStep === 3) {
      const valid = await trigger(['whatsapp_number']);
      if (valid) setCurrentStep(4);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  // Final Onboarding Submission to Server Route (bypasses RLS safely)
  const onSubmitWizard = async (data: OnboardingWizardFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      console.log('Submitting onboarding data via API route:', data);

      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, ownerEmail: ownerEmail || 'owner@bizbotos.in' }),
      });

      const resData = await res.json();

      if (!res.ok || resData.error) {
        throw new Error(resData.error || 'Failed to save business profile.');
      }

      const businessId = resData.businessId;
      console.log('Successfully created business and config via API! ID:', businessId);
      
      // Store active business_id in localStorage for local session persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('bizbot_active_business_id', businessId);
      }

      router.push('/dashboard');
    } catch (err: any) {
      console.error('Wizard submission error:', err);
      setSubmitError(err.message || 'An unexpected error occurred during setup.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-paper py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-teal text-paper p-2 rounded-lg">
            <Bot className="w-6 h-6 text-marigold" />
          </div>
          <span className="font-serif text-xl font-bold text-ink">BizBot OS</span>
        </div>
        <div className="text-xs font-mono text-ink-muted">
          Signed in as: <span className="font-bold text-teal">{ownerEmail}</span>
        </div>
      </div>

      {/* Main Wizard Container */}
      <div className="max-w-4xl mx-auto bg-paper border-2 border-warm-border rounded-lg shadow-ledger overflow-hidden">
        {/* Passbook Stub Step Indicator */}
        <StepIndicator currentStep={currentStep} onStepClick={(step) => setCurrentStep(step)} />

        {/* Wizard Content Body */}
        <div className="p-6 sm:p-8">
          {submitError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
              {submitError}
            </div>
          )}

          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmitWizard)}>
              {/* STEP 1: BUSINESS BASICS */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <span className="text-[11px] font-mono text-teal font-semibold tracking-wider uppercase">
                      STEP 1 OF 4 — BUSINESS IDENTIFICATION
                    </span>
                    <h2 className="font-serif text-2xl font-bold text-ink mt-1">
                      What is your business name & category?
                    </h2>
                    <p className="text-xs text-ink-muted mt-1">
                      Your AI WhatsApp agent will introduce itself under this business name.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-ink-light uppercase mb-1.5">
                      Business Name
                    </label>
                    <input
                      {...methods.register('business_name')}
                      placeholder="e.g. Royal Bakers & Cafe"
                      className="w-full text-base px-4 py-3 bg-paper border border-warm-border rounded-md focus:border-teal font-medium"
                    />
                    {errors.business_name && (
                      <p className="text-xs text-red-600 mt-1">{errors.business_name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-ink-light uppercase mb-1.5">
                      Select Business Category
                    </label>
                    <CategorySelector
                      value={selectedCategory}
                      onChange={(cat) => setValue('category', cat)}
                    />
                    {errors.category && (
                      <p className="text-xs text-red-600 mt-1">{errors.category.message}</p>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 2: CATEGORY SPECIFIC CONFIG */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <span className="text-[11px] font-mono text-teal font-semibold tracking-wider uppercase">
                      STEP 2 OF 4 — CATALOG & SERVICE CONFIGURATION
                    </span>
                    <h2 className="font-serif text-2xl font-bold text-ink mt-1">
                      {selectedCategory === 'bakery'
                        ? 'Set up your Bakery Menu & Pricing'
                        : selectedCategory === 'cafe'
                        ? 'Set up your Cafe Menu & Beverages'
                        : selectedCategory === 'salon'
                        ? 'Set up your Salon Services & Pricing'
                        : selectedCategory === 'gym'
                        ? 'Set up your Gym Memberships & Trainers'
                        : 'Set up your Courses & Fee Structure'}
                    </h2>
                    <p className="text-xs text-ink-muted mt-1">
                      Your AI agent uses these exact line-items to answer price queries and confirm bookings/orders on WhatsApp.
                    </p>
                  </div>

                  {selectedCategory === 'bakery' && <BakeryForm />}
                  {selectedCategory === 'cafe' && <CafeForm />}
                  {selectedCategory === 'salon' && <SalonForm />}
                  {selectedCategory === 'gym' && <GymForm />}
                  {selectedCategory === 'tuition' && <TuitionForm />}
                </div>
              )}

              {/* STEP 3: WHATSAPP CONNECTION */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <span className="text-[11px] font-mono text-teal font-semibold tracking-wider uppercase">
                      STEP 3 OF 4 — WHATSAPP PHONE CONNECTION
                    </span>
                    <h2 className="font-serif text-2xl font-bold text-ink mt-1">
                      Connect your Business WhatsApp Number
                    </h2>
                    <p className="text-xs text-ink-muted mt-1">
                      Enter the dedicated WhatsApp number that customers text for inquiries and bookings.
                    </p>
                  </div>

                  <div className="bg-paper border border-warm-border rounded-lg p-6 space-y-4">
                    <div>
                      <label className="block text-xs font-mono text-ink-light uppercase mb-1.5">
                        Business WhatsApp Number (with Country Code)
                      </label>
                      <div className="relative">
                        <PhoneCall className="w-5 h-5 text-teal absolute left-3.5 top-3" />
                        <input
                          {...methods.register('whatsapp_number')}
                          placeholder="+91 9876543210"
                          className="w-full text-base font-mono font-bold pl-11 pr-4 py-2.5 bg-paper border border-warm-border rounded-md focus:border-teal"
                        />
                      </div>
                      {errors.whatsapp_number && (
                        <p className="text-xs text-red-600 mt-1">{errors.whatsapp_number.message}</p>
                      )}
                    </div>

                    <div className="p-4 bg-warm-card border border-warm-border rounded-md text-xs space-y-2">
                      <div className="flex items-center space-x-2 text-teal font-bold font-serif">
                        <Info className="w-4 h-4 text-teal" />
                        <span>How Meta WhatsApp Integration Works</span>
                      </div>
                      <p className="text-ink-muted leading-relaxed">
                        We connect your number to Meta WhatsApp Cloud API webhooks. Once you click "Go Live", your AI agent will automatically start responding to customer messages sent to this number.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: REVIEW & CONFIRM */}
              {currentStep === 4 && (
                <ReviewLedgerCard
                  formData={formData}
                  ownerEmail={ownerEmail}
                  onGoLive={handleSubmit(onSubmitWizard)}
                  isSubmitting={isSubmitting}
                />
              )}

              {/* Step Action Buttons (For Steps 1, 2, 3) */}
              {currentStep < 4 && (
                <div className="mt-8 pt-6 border-t border-warm-border flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    disabled={currentStep === 1}
                    className="inline-flex items-center space-x-2 text-xs font-semibold px-4 py-2.5 rounded-md border border-warm-border bg-paper text-ink hover:bg-warm-card disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Previous Step</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="inline-flex items-center space-x-2 text-xs font-serif font-bold px-6 py-2.5 rounded-md bg-teal text-paper hover:bg-teal-hover shadow-sm transition-colors"
                  >
                    <span>Save & Continue</span>
                    <ArrowRight className="w-4 h-4 text-marigold" />
                  </button>
                </div>
              )}
            </form>
          </FormProvider>
        </div>
      </div>
    </main>
  );
}
