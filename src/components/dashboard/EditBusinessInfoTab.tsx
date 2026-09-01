'use client';

import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { BusinessCategory } from '../../types';
import {
  onboardingWizardSchema,
  OnboardingWizardFormData,
} from '../../lib/validations/onboarding';
import { BakeryForm } from '../ledger/BakeryForm';
import { CafeForm } from '../ledger/CafeForm';
import { SalonForm } from '../ledger/SalonForm';
import { ClinicForm } from '../ledger/ClinicForm';
import { GymForm } from '../ledger/GymForm';
import { TuitionForm } from '../ledger/TuitionForm';
import { RetailForm } from '../ledger/RetailForm';
import { RealEstateForm } from '../ledger/RealEstateForm';
import { CAForm } from '../ledger/CAForm';
import { CATEGORY_PRESETS, resolveCategoryFromNameOrType } from '../../lib/constants/categoryPresets';
import {
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  QrCode,
  Store,
  MessageSquare,
  ExternalLink,
  ShieldCheck,
  Trash2,
  PhoneCall,
  CreditCard,
} from 'lucide-react';
import { useToast } from '../ui/ToastContext';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  Label,
  FormSkeleton,
} from '../ui';

interface EditBusinessInfoTabProps {
  businessId: string;
  category: BusinessCategory;
  onUpdated?: () => void;
}

const CATEGORY_OPTIONS: { id: BusinessCategory; label: string; icon: string; desc: string }[] = [
  { id: 'bakery', label: 'Bakery & Cakes', icon: '🍰', desc: 'Menu items, weights, and cake pre-orders' },
  { id: 'cafe', label: 'Cafe & Dining', icon: '☕', desc: 'Food & drinks, reservations, dine-in & takeaway' },
  { id: 'salon', label: 'Salon & Spa', icon: '💇', desc: 'Grooming tariffs, duration, and stylists' },
  { id: 'clinic', label: 'Clinic & Doctors', icon: '🩺', desc: 'OPD tariffs, doctor rosters, and slots' },
  { id: 'hospital', label: 'Hospital & Healthcare', icon: '🏥', desc: 'Specialties, consultants, and patient care' },
  { id: 'gym', label: 'Gym & Fitness', icon: '🏋️', desc: 'Membership packages, trainer coaching' },
  { id: 'tuition', label: 'Tuition & Coaching', icon: '🎓', desc: 'Batches, monthly fees, and demo class terms' },
  { id: 'retail', label: 'Boutique & Retail', icon: '🛍️', desc: 'Apparel variants, sizes, and return policies' },
  { id: 'real_estate', label: 'Real Estate & Properties', icon: '🏢', desc: 'Unit configurations, site tours, and advisors' },
  { id: 'ca_firm', label: 'CA & Tax Consulting', icon: '⚖️', desc: 'GST/ITR filings, CA partners, and checklists' },
];

export const EditBusinessInfoTab: React.FC<EditBusinessInfoTabProps> = ({
  businessId,
  category,
  onUpdated,
}) => {
  const router = useRouter();
  const { showToast, showConfirm } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const methods = useForm<OnboardingWizardFormData>({
    resolver: zodResolver(onboardingWizardSchema),
    defaultValues: {
      business_name: 'Business',
      category: category,
      whatsapp_number: '8108313063',
      owner_personal_phone: '',
      hours: 'Mon - Sun, 9:00 AM - 9:00 PM',
      menu_items: [],
      cafe_menu: [],
      services: [],
      gym_plans: [],
      staff: [],
      courses: [],
      admission_process: '',
      faqs: [],
      upi_id: '',
      auto_send_payment_link: true,
      payment_note: 'Please pay via GPay, PhonePe, or Paytm.',
    },
  });

  const { handleSubmit, reset, setValue, watch } = methods;

  useEffect(() => {
    if (!businessId) return;
    async function loadConfig() {
      try {
        setLoading(true);
        const res = await fetch(`/api/business?id=${encodeURIComponent(businessId)}`);
        const data = await res.json();
        if (data.business) {
          const bus = data.business;
          const configMap = data.configs || {};
          const rawPhone = bus.whatsapp_number ? bus.whatsapp_number.replace(/\D/g, '') : '';
          const tenDigitPhone = rawPhone.startsWith('91') && rawPhone.length > 10 ? rawPhone.slice(2, 12) : rawPhone.slice(0, 10);

          const rawPersonal = configMap.owner_personal_phone ? String(configMap.owner_personal_phone).replace(/\D/g, '') : '';
          const tenDigitPersonal = rawPersonal.startsWith('91') && rawPersonal.length > 10 ? rawPersonal.slice(2, 12) : rawPersonal.slice(0, 10);

          const effectiveCategory = resolveCategoryFromNameOrType(configMap.category || bus.category || category, bus.name);
          const preset = CATEGORY_PRESETS[effectiveCategory] || CATEGORY_PRESETS.bakery;

          reset({
            business_name: bus.name || 'My Business',
            category: effectiveCategory,
            whatsapp_number: tenDigitPhone,
            owner_personal_phone: tenDigitPersonal,
            hours: configMap.hours || preset.hours || 'Mon - Sun, 9:00 AM - 9:00 PM',
            menu_items: configMap.menu_items || preset.menu_items || [],
            services: configMap.services || preset.services || [],
            gym_plans: configMap.gym_plans || preset.gym_plans || [],
            cafe_menu: configMap.cafe_menu || preset.cafe_menu || [],
            staff: configMap.staff || preset.staff || [],
            courses: configMap.course_list || preset.courses || [],
            admission_process: configMap.admission_process || preset.admission_process || '',
            faqs: configMap.faqs || preset.faqs || [],
            upi_id: configMap.upi_id || '',
            upi_name: configMap.upi_name || bus.name || '',
            qr_image_url: configMap.qr_image_url || '',
            address: configMap.address || '',
            gst_number: configMap.gst_number || '',
            invoice_prefix: configMap.invoice_prefix || 'INV',
            invoice_notes: configMap.invoice_notes || 'Thank you for your business! Goods once sold cannot be returned without original receipt.',
            reengagement_nudge_text: configMap.reengagement_nudge_text || '',
            auto_send_payment_link: configMap.auto_send_payment_link !== false,
            payment_note: configMap.payment_note || 'Please pay via GPay, PhonePe, or Paytm.',
          } as any);
        }
      } catch (err) {
        console.error('Failed to load business configuration:', err);
        setErrorMessage('Failed to load business configuration.');
      } finally {
        setLoading(false);
      }
    }

    if (businessId) {
      loadConfig();
    }
  }, [businessId, category, reset]);

  const onSubmit = async (formData: OnboardingWizardFormData) => {
    try {
      setSaving(true);
      setErrorMessage(null);
      setShowSuccessToast(false);

      const res = await fetch('/api/business/save-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          formData,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update business configuration.');

      showToast({
        title: 'Settings Saved!',
        message: 'Your AI agent catalog & prompt instructions updated successfully.',
        type: 'success',
      });
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 5000);
      if (onUpdated) onUpdated();
    } catch (err: any) {
      console.error('Error saving business info:', err);
      setErrorMessage(err.message || 'Error updating configuration.');
      showToast({
        title: 'Save Failed',
        message: err.message,
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBusiness = async () => {
    const confirmed = await showConfirm({
      title: 'Delete Business Profile?',
      message: 'Are you sure you want to permanently delete this business? All orders, appointments, catalog items, and configurations will be permanently removed. This action cannot be undone.',
      confirmText: 'Yes, Delete Business',
      cancelText: 'Cancel',
      isDestructive: true,
    });

    if (!confirmed) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/business?id=${encodeURIComponent(businessId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete business.');

      showToast({
        title: 'Business Deleted',
        message: 'Your business profile and settings have been permanently removed.',
        type: 'info',
      });

      localStorage.clear();
      router.push('/signup');
    } catch (err: any) {
      console.error('Error deleting business:', err);
      showToast({
        title: 'Delete Failed',
        message: err.message,
        type: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  const selectedCategory = watch('category') || category;
  const currentBizName = watch('business_name') || 'Business';
  const effectiveCategory = resolveCategoryFromNameOrType(selectedCategory, currentBizName);
  const botNumber = (watch('whatsapp_number') || '').replace(/\D/g, '').slice(-10);
  const isBotNumberValid = /^[6-9]\d{9}$/.test(botNumber);

  const renderCategorySpecificForm = () => {
    switch (effectiveCategory) {
      case 'bakery':
        return <BakeryForm />;
      case 'cafe':
        return <CafeForm />;
      case 'salon':
        return <SalonForm />;
      case 'clinic':
        return <ClinicForm />;
      case 'hospital':
        return <ClinicForm />;
      case 'gym':
        return <GymForm />;
      case 'tuition':
        return <TuitionForm />;
      case 'retail':
        return <RetailForm />;
      case 'real_estate':
        return <RealEstateForm />;
      case 'ca_firm':
        return <CAForm />;
      default:
        return <SalonForm />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <FormSkeleton />
        <FormSkeleton />
      </div>
    );
  }

  const activeCategoryMeta = CATEGORY_OPTIONS.find((c) => c.id === effectiveCategory) || CATEGORY_OPTIONS[0];

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 animate-in fade-in duration-150">
        {/* Header */}
        <Card>
          <CardHeader className="flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                <span>Store Catalog & AI Knowledge Base</span>
              </CardTitle>
              <CardDescription>
                Customize items, services, staff, operational timings, and payment options for your AI assistant.
              </CardDescription>
            </div>

            <Button
              variant="primary"
              size="sm"
              type="submit"
              loading={saving}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save & Sync AI Agent
            </Button>
          </CardHeader>
        </Card>

        {showSuccessToast && (
          <div className="p-3.5 bg-success-subtle border border-success-border text-success rounded-md text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Settings saved successfully! AI staff is updated with your latest products and guidelines.</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 bg-danger-subtle border border-danger-border text-danger rounded-md text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1. Business Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Store className="w-4 h-4 text-accent" />
              <span>1. Business & Contact Profile</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block">Business Name *</Label>
                <Input
                  {...methods.register('business_name')}
                  placeholder="e.g. Elegance Salon & Spa"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="block">Business WhatsApp Number *</Label>
                  {isBotNumberValid ? (
                    <span className="text-[10px] font-semibold text-success flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Connected
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-danger">Invalid 10-Digit Mobile</span>
                  )}
                </div>
                <div className="flex rounded-md border border-line bg-surface overflow-hidden focus-within:ring-2 focus-within:ring-accent shadow-xs">
                  <div className="flex items-center gap-1 px-2.5 py-1.5 bg-surface-subtle border-r border-line text-fg font-mono text-xs select-none">
                    <span>🇮🇳</span>
                    <span className="font-semibold">+91</span>
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    value={watch('whatsapp_number') || ''}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setValue('whatsapp_number', digits, { shouldValidate: true });
                    }}
                    placeholder="8108313063"
                    className="flex-1 px-3 py-1.5 text-xs font-mono font-semibold text-fg bg-transparent focus:outline-none placeholder:text-fg-subtle"
                  />
                </div>
                <p className="text-[10px] text-fg-muted mt-1">
                  Connected to Meta WhatsApp Cloud API webhooks.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block">Store Address / Location</Label>
                <Input
                  {...methods.register('address' as any)}
                  placeholder="e.g. Shop 4, Station Road, Thane West, Mumbai"
                />
              </div>

              <div>
                <Label className="mb-1 block">GSTIN / Tax ID (Optional for Invoices)</Label>
                <Input
                  {...methods.register('gst_number' as any)}
                  placeholder="e.g. 27AAAAA0000A1Z5"
                  className="font-mono uppercase"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. In-Chat UPI & Payment Automation (Positioned directly below Business & Contact Profile) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <QrCode className="w-4 h-4 text-accent" />
              <span>2. In-Chat UPI & Payment Automation</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Configure store UPI payment collection, automatic link dispatch, and bank verification details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block">Store UPI ID / VPA</Label>
                <Input
                  {...methods.register('upi_id' as any)}
                  placeholder="e.g. yourstore@okhdfcbank or 8108313063@paytm"
                  className="font-mono"
                />
                <p className="text-[10px] text-fg-muted mt-1">Leave blank if accepting cash / counter payment only.</p>
              </div>

              <div>
                <Label className="mb-1 block">Payment Note / Instructions</Label>
                <Input
                  {...methods.register('payment_note')}
                  placeholder="Please pay via GPay, PhonePe, or Paytm."
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="auto_send_payment_link"
                {...methods.register('auto_send_payment_link')}
                className="w-4 h-4 rounded border-line text-accent focus:ring-accent bg-surface"
              />
              <label htmlFor="auto_send_payment_link" className="text-xs text-fg cursor-pointer select-none">
                Automatically generate clickable UPI pay link for exact order / service total in WhatsApp
              </label>
            </div>
          </CardContent>
        </Card>

        {/* 3. Owner Personal WhatsApp Sandbox Test Card */}
        <Card className="border-accent/30 bg-surface">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-accent" />
                <span>3. Owner Personal WhatsApp & Live Testing Sandbox</span>
              </CardTitle>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-accent/15 text-accent border border-accent/20">
                Sandbox Mode
              </span>
            </div>
            <CardDescription className="text-xs">
              Add your personal phone number so you can test and talk to your AI agent directly on WhatsApp without affecting customer records.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-7">
                <Label className="mb-1 block">Your Personal WhatsApp Mobile</Label>
                <div className="flex rounded-md border border-line bg-surface overflow-hidden focus-within:ring-2 focus-within:ring-accent shadow-xs">
                  <div className="flex items-center gap-1 px-2.5 py-1.5 bg-surface-subtle border-r border-line text-fg font-mono text-xs select-none">
                    <span>🇮🇳</span>
                    <span className="font-semibold">+91</span>
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    value={watch('owner_personal_phone') || ''}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setValue('owner_personal_phone', digits, { shouldValidate: true });
                    }}
                    placeholder="9876543210"
                    className="flex-1 px-3 py-1.5 text-xs font-mono font-semibold text-fg bg-transparent focus:outline-none placeholder:text-fg-subtle"
                  />
                </div>
                <p className="text-[10px] text-fg-muted mt-1">
                  Messages from this number will be flagged as Owner Admin Test chats.
                </p>
              </div>

              <div className="sm:col-span-5">
                {isBotNumberValid ? (
                  <a
                    href={`https://wa.me/91${botNumber}?text=Hi%20I%20am%20testing%20my%20Agento%20AI%20staff`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-success hover:bg-success-hover text-white text-xs font-bold transition-all shadow-xs active:scale-[0.98]"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Open WhatsApp & Test Bot</span>
                    <ExternalLink className="w-3 h-3 opacity-80" />
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="w-full py-2 px-3 rounded-lg bg-surface-subtle text-fg-subtle text-xs font-medium border border-line cursor-not-allowed"
                  >
                    Enter valid business number first
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. Category Specific Catalog / Services */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm flex items-center gap-2">
                  <span>{activeCategoryMeta.icon}</span>
                  <span>4. {activeCategoryMeta.label} — Catalog & Pricing Details</span>
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Items, rates, specialists, and FAQ responses configured specifically for {activeCategoryMeta.label}.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            {renderCategorySpecificForm()}
          </CardContent>
        </Card>

        {/* Bottom Save Bar */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            variant="primary"
            size="md"
            type="submit"
            loading={saving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save All Changes & Sync AI Agent
          </Button>
        </div>

        {/* 5. Danger Zone: Delete Account */}
        <Card className="border-danger/30 bg-surface mt-8">
          <CardHeader>
            <CardTitle className="text-sm text-danger flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              <span>Danger Zone: Delete Business</span>
            </CardTitle>
            <CardDescription className="text-xs text-fg-muted">
              Permanently remove this business and all associated catalog, customer chat history, and configuration records.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-end">
            <Button
              type="button"
              variant="danger"
              size="sm"
              loading={deleting}
              onClick={handleDeleteBusiness}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Delete Business Profile
            </Button>
          </CardContent>
        </Card>
      </form>
    </FormProvider>
  );
};
