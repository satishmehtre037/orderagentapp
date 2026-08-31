'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
import { CAForm } from '../../components/ledger/CAForm';
import { ReviewLedgerCard } from '../../components/ledger/ReviewLedgerCard';
import { CATEGORY_PRESETS } from '../../lib/constants/categoryPresets';
import { BusinessCategory } from '../../types';
import { Bot, ArrowRight, ArrowLeft, Info, AlertCircle, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react';
import { ThemeToggle } from '../../components/ui/ThemeContext';
import {
  Button,
  Card,
  CardContent,
  Input,
  Label,
} from '../../components/ui';

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [ownerEmail, setOwnerEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [phoneChecking, setPhoneChecking] = useState(false);
  const [phoneStatus, setPhoneStatus] = useState<{
    available?: boolean;
    error?: string;
    message?: string;
  } | null>(null);
  const [metaLinkedNotice, setMetaLinkedNotice] = useState<string | null>(null);

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
      }
    }
    checkAuth();
  }, [router]);

  // Handle Meta OAuth Code from popup postMessage or direct redirect
  const handleMetaCodeExchange = async (code: string) => {
    setCurrentStep(3);
    setPhoneChecking(true);
    try {
      const email = ownerEmail || (typeof window !== 'undefined' ? localStorage.getItem('biz_email') : '') || '';
      const res = await fetch('/api/meta/embedded-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          email,
          redirect_uri: window.location.origin + '/meta-callback',
        }),
      });
      const data = await res.json();
      if (data?.whatsapp_number && /^[6-9]\d{9}$/.test(data.whatsapp_number)) {
        setValue('whatsapp_number', data.whatsapp_number, { shouldValidate: true });
        setMetaLinkedNotice(null);
        setPhoneStatus({
          available: true,
          message: '✅ WhatsApp Business Account Verified & Connected via Meta!',
        });
      } else {
        setValue('whatsapp_number', '', { shouldValidate: false });
        setMetaLinkedNotice('✅ Meta Account Linked! Please enter your 10-digit WhatsApp mobile number below.');
      }
    } catch (err) {
      console.error('Embedded signup exchange error:', err);
      setPhoneStatus({
        available: false,
        error: 'Failed to complete Meta onboarding. Please try again.',
      });
    } finally {
      setPhoneChecking(false);
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  };

  useEffect(() => {
    // 1. Check for URL redirect code
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      if (code) {
        handleMetaCodeExchange(code);
      }
    }

    // 2. Listen for popup postMessage and Meta Embedded Signup events
    const messageListener = (event: MessageEvent) => {
      if (event.data?.type === 'META_AUTH_CALLBACK' && event.data?.code) {
        handleMetaCodeExchange(event.data.code);
      }

      // Catch WA_EMBEDDED_SIGNUP sessionInfo from Meta
      if (
        event.origin === 'https://www.facebook.com' ||
        event.origin === 'https://web.facebook.com'
      ) {
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (data?.type === 'WA_EMBEDDED_SIGNUP') {
            console.log('[Meta Embedded Signup Session Info]:', data.data);
            const { phone_number_id, waba_id } = data.data || {};
            if (phone_number_id) {
              const email = ownerEmail || (typeof window !== 'undefined' ? localStorage.getItem('biz_email') : '') || '';
              fetch('/api/meta/embedded-signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone_number_id, waba_id, email }),
              })
                .then((res) => res.json())
                .then((resData) => {
                  if (resData?.whatsapp_number && /^[6-9]\d{9}$/.test(resData.whatsapp_number)) {
                    setValue('whatsapp_number', resData.whatsapp_number, { shouldValidate: true });
                  }
                })
                .catch(console.error);
            }
          }
        } catch {}
      }
    };

    window.addEventListener('message', messageListener);

    // 3. Initialize official Facebook JavaScript SDK
    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '4476606339291818';
    (window as any).fbAsyncInit = function() {
      (window as any).FB?.init({
        appId: appId,
        cookie: true,
        xfbml: true,
        version: 'v20.0'
      });
    };

    if (!document.getElementById('facebook-jssdk')) {
      const js = document.createElement('script');
      js.id = 'facebook-jssdk';
      js.src = 'https://connect.facebook.net/en_US/sdk.js';
      document.body.appendChild(js);
    }

    return () => window.removeEventListener('message', messageListener);
  }, [ownerEmail, setValue]);

  const watchedPhone = watch('whatsapp_number');
  useEffect(() => {
    const num = (watchedPhone || '').replace(/\D/g, '').slice(-10);
    if (num.length === 10 && /^[6-9]\d{9}$/.test(num)) {
      let active = true;
      const timeout = setTimeout(async () => {
        setPhoneChecking(true);
        try {
          const email = ownerEmail || (typeof window !== 'undefined' ? localStorage.getItem('biz_email') : '') || '';
          const res = await fetch(`/api/business/check-number?number=${encodeURIComponent(num)}&email=${encodeURIComponent(email)}`);
          const data = await res.json();
          if (active) {
            if (!data.available) {
              setPhoneStatus({
                available: false,
                error: data.error || 'This number is already registered to another account.',
              });
            } else {
              setPhoneStatus({
                available: true,
                message: 'Available & Ready for 24/7 AI Staff!',
              });
            }
          }
        } catch (e) {
          // ignore
        } finally {
          if (active) setPhoneChecking(false);
        }
      }, 300);
      return () => {
        active = false;
        clearTimeout(timeout);
      };
    } else {
      setPhoneStatus(null);
    }
  }, [watchedPhone, ownerEmail]);

  const handleNextStep = async () => {
    setSubmitError(null);
    let valid = true;

    if (currentStep === 1) {
      valid = await trigger(['business_name', 'category']);
    } else if (currentStep === 2) {
      valid = await trigger(['hours']);
    } else if (currentStep === 3) {
      valid = await trigger(['whatsapp_number']);
      if (!valid) return;

      const num = (watch('whatsapp_number') || '').replace(/\D/g, '').slice(-10);
      if (!num || !/^[6-9]\d{9}$/.test(num)) {
        setPhoneStatus({ available: false, error: 'Please enter a valid 10-digit Indian mobile number.' });
        return;
      }

      if (phoneStatus && phoneStatus.available === false) {
        return;
      }
    }

    if (valid) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrevStep = () => {
    setSubmitError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmitWizard = async (validData: OnboardingWizardFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const targetEmail = ownerEmail || (typeof window !== 'undefined' ? localStorage.getItem('biz_email') : null) || 'owner@mybusiness.com';
      const cleanPhone = (validData.whatsapp_number || '').replace(/\D/g, '');
      const tenDigitPhone = cleanPhone.startsWith('91') && cleanPhone.length === 12
        ? cleanPhone.slice(2)
        : cleanPhone.slice(0, 10);
      const internationalPhone = `+91 ${tenDigitPhone}`;

      const res = await fetch('/api/business/save-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData: {
            ...validData,
            name: validData.business_name,
            business_name: validData.business_name,
            whatsapp_number: internationalPhone,
          },
          name: validData.business_name,
          business_name: validData.business_name,
          businessName: validData.business_name,
          ownerEmail: targetEmail,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to save configuration.');

      if (typeof window !== 'undefined') {
        const generatedBizId = resData.businessId || resData.business?.id;
        if (generatedBizId) {
          localStorage.setItem('biz_id', generatedBizId);
        }
        localStorage.setItem('biz_email', targetEmail);
        localStorage.setItem('onboarding_completed', 'true');
        localStorage.setItem('biz_name', validData.business_name);
        localStorage.setItem('biz_category', validData.category);
        localStorage.setItem('biz_phone', internationalPhone);
      }

      router.push('/dashboard');
    } catch (err: any) {
      console.error('Onboarding submission error:', err);
      setSubmitError(err.message || 'An error occurred while launching your AI agent.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-base flex flex-col justify-center py-6 sm:py-10 px-4 sm:px-6 lg:px-8 font-sans antialiased text-fg transition-colors duration-150 relative">
      {/* Top Floating Theme Switch */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-4xl text-center space-y-2 mb-6">
        <div className="inline-flex items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-surface border border-line shadow-sm flex items-center justify-center p-2">
            <img src="/logo.png" alt="Agento AI" className="w-full h-full object-contain" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-fg tracking-tight">
          Launch Your 24/7 WhatsApp AI Staff
        </h1>
        <p className="text-xs sm:text-sm text-fg-muted max-w-md mx-auto">
          Complete the 4-step wizard to train and deploy your autonomous customer agent in under 2 minutes.
        </p>
        <div className="pt-1">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline font-semibold"
          >
            Already created your store on laptop? Sign in to Dashboard &rarr;
          </Link>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="sm:mx-auto sm:w-full sm:max-w-4xl mb-6">
        <StepIndicator currentStep={currentStep} onStepClick={(s) => s <= currentStep && setCurrentStep(s)} />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
        <FormProvider {...methods}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (currentStep < 4) handleNextStep();
            }}
          >
            <Card className="shadow-md">
              <CardContent className="p-6 sm:p-8 space-y-6">
                {submitError && (
                  <div className="p-3.5 rounded-md bg-danger-subtle border border-danger-border text-xs font-medium text-danger flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* STEP 1: Business Identity & Category */}
                {currentStep === 1 && (
                  <div className="space-y-5">
                    <div>
                      <span className="text-xs font-bold text-accent tracking-wider uppercase">
                        Step 1 of 4 — Business Setup
                      </span>
                      <h2 className="text-xl font-bold text-fg mt-1">
                        Tell us about your business
                      </h2>
                      <p className="text-xs text-fg-muted mt-0.5">
                        Your AI agent will introduce itself using this legal entity or brand name.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="mb-1.5 block">Store / Business Name *</Label>
                        <Input
                          {...methods.register('business_name')}
                          placeholder="e.g. Royal Confectionery & Cafe"
                        />
                        {errors.business_name && (
                          <p className="text-xs text-danger mt-1 font-medium">
                            {errors.business_name.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="mb-2 block">Select Business Category *</Label>
                        <CategorySelector
                          value={selectedCategory}
                          onChange={handleCategorySelect}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: Catalog & Working Hours */}
                {currentStep === 2 && (
                  <div className="space-y-5">
                    <div>
                      <span className="text-xs font-bold text-accent tracking-wider uppercase">
                        Step 2 of 4 — Products & Operational Rules
                      </span>
                      <h2 className="text-xl font-bold text-fg mt-1">
                        Define your products, prices & hours
                      </h2>
                      <p className="text-xs text-fg-muted mt-0.5">
                        These items will be recommended automatically by AI when customers chat on WhatsApp.
                      </p>
                    </div>

                    <div>
                      <Label className="mb-1.5 block">Store Working Hours *</Label>
                      <Input
                        {...methods.register('hours')}
                        placeholder="e.g. Mon - Sun, 9:00 AM - 10:00 PM"
                      />
                    </div>

                    <div className="pt-2 border-t border-line">
                      {selectedCategory === 'bakery' && <BakeryForm />}
                      {selectedCategory === 'cafe' && <CafeForm />}
                      {selectedCategory === 'salon' && <SalonForm />}
                      {selectedCategory === 'clinic' && <ClinicForm />}
                      {selectedCategory === 'hospital' && <ClinicForm />}
                      {selectedCategory === 'gym' && <GymForm />}
                      {selectedCategory === 'tuition' && <TuitionForm />}
                      {selectedCategory === 'retail' && <RetailForm />}
                      {selectedCategory === 'real_estate' && <RealEstateForm />}
                      {selectedCategory === 'ca_firm' && <CAForm />}
                      {selectedCategory === 'custom' && <CAForm />}
                    </div>
                  </div>
                )}

                {/* STEP 3: WhatsApp Number */}
                {currentStep === 3 && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div>
                      <span className="text-[11px] font-mono font-bold tracking-wider text-accent uppercase">
                        Step 3 of 4 — WhatsApp Binding
                      </span>
                      <h2 className="text-xl font-bold text-fg mt-1">
                        Connect your WhatsApp Business Account
                      </h2>
                      <p className="text-xs text-fg-muted mt-0.5">
                        Meta-verified automatic onboarding &amp; 24/7 AI staff provisioning.
                      </p>
                    </div>

                    {/* Meta Official 1-Click Embedded Signup Card */}
                    <div className="p-5 bg-gradient-to-br from-blue-500/10 via-surface to-surface border border-blue-500/30 rounded-xl space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#1877F2] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                            f
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-fg">Official Meta Embedded Signup</h3>
                            <p className="text-[11px] text-fg-muted">Meta verifies your line and Agento AI provisions your 24/7 AI staff automatically.</p>
                          </div>
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                          Recommended
                        </span>
                      </div>

                      {phoneChecking ? (
                        <div className="p-4 bg-surface border border-blue-500/30 rounded-lg space-y-2.5 animate-in fade-in duration-150">
                          <div className="flex items-center gap-2 text-xs font-bold text-accent">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Your WhatsApp is being connected and configured automatically...</span>
                          </div>
                          <div className="space-y-1.5 text-[11px] text-fg-muted">
                            <div className="flex items-center gap-1.5">
                              <span className="text-success">✓</span> Authorizing Meta Business Account
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Loader2 className="w-3 h-3 animate-spin text-accent" /> Linking WABA &amp; Registering Phone
                            </div>
                            <div className="flex items-center gap-1.5 text-fg-subtle">
                              ○ Subscribing Webhooks &amp; Loading AI Knowledge
                            </div>
                          </div>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="primary"
                          className="w-full bg-[#1877F2] hover:bg-[#166fe5] text-white font-semibold py-2.5 shadow-md flex items-center justify-center gap-2"
                          onClick={() => {
                            if (typeof window !== 'undefined') {
                              const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '1368087472137493';
                              const redirectUri = encodeURIComponent(window.location.origin + '/meta-callback');
                              const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                              
                              // Clean direct Meta OAuth dialog
                              const metaUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=whatsapp_business_management,whatsapp_business_messaging&response_type=code`;

                              if (isMobile) {
                                window.location.href = metaUrl;
                              } else {
                                window.open(metaUrl, 'meta_signup', 'width=600,height=700');
                              }
                            }
                          }}
                        >
                          <span className="text-base font-bold">f</span> Connect WhatsApp with Facebook
                        </Button>
                      )}
                    </div>

                    {/* Direct Dedicated Business Number Connection */}
                    <div className="p-5 bg-surface-subtle border border-line rounded-lg space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <Label className="block font-semibold">Dedicated Business Mobile Number *</Label>
                          {phoneChecking ? (
                            <span className="text-[11px] text-accent flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" /> Checking...
                            </span>
                          ) : phoneStatus?.available ? (
                            <span className="text-[11px] font-semibold text-success flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" /> Ready for AI Staff
                            </span>
                          ) : null}
                        </div>

                        <div className={`flex rounded-md border bg-surface overflow-hidden transition-all focus-within:ring-2 shadow-xs ${
                          phoneStatus?.available
                            ? 'border-success focus-within:ring-success'
                            : 'border-line focus-within:ring-accent'
                        }`}>
                          <div className="flex items-center gap-1.5 px-3 py-2 bg-surface-subtle border-r border-line text-fg select-none font-mono text-xs">
                            <span>🇮🇳</span>
                            <span className="font-semibold">+91</span>
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
                            placeholder="8108313063"
                            className="flex-1 px-3 py-2 text-sm font-mono font-semibold text-fg bg-transparent focus:outline-none placeholder:text-fg-subtle placeholder:font-normal"
                          />
                        </div>

                        <div className="flex items-center justify-between mt-1.5 text-[11px]">
                          <p className="text-fg-muted">Enter 10-digit dedicated SIM or business line</p>
                          <span className="font-mono text-fg-subtle">
                            {`${(watch('whatsapp_number') || '').length}/10 digits`}
                          </span>
                        </div>
                      </div>

                      {phoneStatus?.error && (
                        <div className="p-3 bg-danger-subtle border border-danger-border text-danger rounded-md text-xs font-semibold flex items-start gap-2 animate-in fade-in duration-150">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{phoneStatus.error}</span>
                        </div>
                      )}

                      {metaLinkedNotice && !phoneStatus?.available && !phoneStatus?.error && (
                        <div className="p-3.5 bg-accent/10 border border-accent/30 text-accent rounded-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>{metaLinkedNotice}</span>
                        </div>
                      )}

                      {phoneStatus?.message && (
                        <div className={`p-3.5 rounded-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150 ${
                          phoneStatus.available === true
                            ? 'bg-success-subtle border border-success-border text-success'
                            : 'bg-accent/10 border border-accent/30 text-accent'
                        }`}>
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>{phoneStatus.message}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 4: Review & Go Live */}
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

                {/* Navigation Controls */}
                {currentStep < 4 && (
                  <div className="pt-4 border-t border-line flex items-center justify-between">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handlePrevStep}
                      disabled={currentStep === 1}
                      leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                    >
                      Back
                    </Button>

                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleNextStep}
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      Save & Continue
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </form>
        </FormProvider>
      </div>
    </main>
  );
}
