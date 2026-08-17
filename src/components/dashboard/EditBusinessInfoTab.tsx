import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabaseClient } from '../../lib/supabase/client';
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
import { CATEGORY_PRESETS } from '../../lib/constants/categoryPresets';
import { FormSkeleton } from './SkeletonLoaders';
import {
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Trash2,
  AlertTriangle,
  QrCode,
  IndianRupee,
  BellRing,
  FileText,
  Building2,
  ShieldAlert,
} from 'lucide-react';

interface EditBusinessInfoTabProps {
  businessId: string;
  category: BusinessCategory;
  onUpdated?: () => void;
}

export const EditBusinessInfoTab: React.FC<EditBusinessInfoTabProps> = ({
  businessId,
  category,
  onUpdated,
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const methods = useForm<OnboardingWizardFormData>({
    resolver: zodResolver(onboardingWizardSchema),
    defaultValues: {
      business_name: 'Business',
      category: category,
      whatsapp_number: '+91 9876543210',
      hours: 'Mon - Sun, 9:00 AM - 9:00 PM',
      menu_items: [],
      services: [],
      staff: [],
      courses: [],
      admission_process: '',
      faqs: [],
    },
  });

  const { handleSubmit, reset } = methods;

  // Fetch business & config from server API route
  useEffect(() => {
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

          const preset = CATEGORY_PRESETS[category] || CATEGORY_PRESETS.bakery;

          reset({
            business_name: bus.name || 'My Business',
            category: category,
            whatsapp_number: tenDigitPhone,
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
            auto_send_payment_link: configMap.auto_send_payment_link !== false,
            payment_note: configMap.payment_note || 'Please pay via GPay, PhonePe, or Paytm.',
            gst_number: configMap.gst_number || '',
            store_address: configMap.store_address || '',
            enable_reminders: configMap.enable_reminders !== false,
            reminder_days: configMap.reminder_days || (category === 'salon' ? 25 : category === 'gym' ? 27 : 7),
            reminder_template: configMap.reminder_template || '',
          });
        }
      } catch (err) {
        console.error('Config load error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadConfig();
  }, [businessId, category, reset]);

  // Handle Save / Update via server API
  const onSaveConfig = async (formData: OnboardingWizardFormData) => {
    try {
      setSaving(true);
      setErrorMessage(null);

      // Build updates array
      const updates: Array<{ config_key: string; config_value: any }> = [
        { config_key: 'hours', config_value: formData.hours || '' },
        { config_key: 'faqs', config_value: formData.faqs || [] },
        { config_key: 'upi_id', config_value: formData.upi_id || '' },
        { config_key: 'auto_send_payment_link', config_value: formData.auto_send_payment_link !== false },
        { config_key: 'payment_note', config_value: formData.payment_note || '' },
        { config_key: 'gst_number', config_value: formData.gst_number || '' },
        { config_key: 'store_address', config_value: formData.store_address || '' },
        { config_key: 'enable_reminders', config_value: formData.enable_reminders !== false },
        { config_key: 'reminder_days', config_value: formData.reminder_days || 7 },
        { config_key: 'reminder_template', config_value: formData.reminder_template || '' },
      ];

      if (category === 'bakery') {
        updates.push({ config_key: 'menu_items', config_value: formData.menu_items || [] });
      } else if (category === 'salon' || category === 'clinic' || category === 'real_estate' || category === 'custom') {
        updates.push({ config_key: 'services', config_value: formData.services || [] });
        updates.push({ config_key: 'staff', config_value: formData.staff || [] });
      } else if (category === 'gym') {
        updates.push({ config_key: 'gym_plans', config_value: formData.gym_plans || [] });
        updates.push({ config_key: 'staff', config_value: formData.staff || [] });
      } else if (category === 'cafe') {
        updates.push({ config_key: 'cafe_menu', config_value: formData.cafe_menu || [] });
      } else if (category === 'tuition') {
        updates.push({ config_key: 'course_list', config_value: formData.courses || [] });
        updates.push({ config_key: 'admission_process', config_value: formData.admission_process || '' });
      } else if (category === 'retail') {
        updates.push({ config_key: 'menu_items', config_value: formData.menu_items || [] });
        updates.push({ config_key: 'staff', config_value: formData.staff || [] });
      }

      const cleanDigits = (formData.whatsapp_number || '').replace(/\D/g, '').replace(/^91/, '');
      const fullWhatsAppNumber = cleanDigits ? `+91${cleanDigits}` : '';

      const res = await fetch('/api/business', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          name: formData.business_name,
          whatsapp_number: fullWhatsAppNumber,
          category,
          configs: updates,
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || 'Failed to update business configuration');
      }

      setShowSuccessToast(true);
      if (onUpdated) onUpdated();
      setTimeout(() => setShowSuccessToast(false), 5000);
    } catch (err: any) {
      console.error('Update config error:', err);
      setErrorMessage(err.message || 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBusiness = async () => {
    const confirmed = window.confirm(
      'Are you absolutely sure? This will permanently wipe all orders, catalog items, and customer conversations.'
    );
    if (!confirmed) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/business?id=${encodeURIComponent(businessId)}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete business');
      }

      await supabaseClient.auth.signOut();
      window.location.href = '/signup';
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
        <FormSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      {showSuccessToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl shadow-sm flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-medium">
            Store configuration saved! Your WhatsApp AI assistant is updated with your latest changes.
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
        {/* Header Toolbar */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Store Catalog & AI Knowledge Base
              </h2>
              <p className="text-xs text-slate-500">
                Update prices, items, UPI IDs, address, and automated follow-up rules
              </p>
            </div>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-md text-slate-700 capitalize">
            {category} Mode
          </span>
        </div>

        <div className="p-6 sm:p-8">
          <FormProvider {...methods}>
            <form
              onSubmit={handleSubmit(onSaveConfig, (validationErrors) => {
                console.error('Validation errors:', validationErrors);
                setErrorMessage('Please check your form entries and ensure required fields are filled.');
              })}
              className="space-y-6"
            >
              {/* Core Business Information */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                  1. Business & Contact Profile
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Business Name *
                    </label>
                    <input
                      {...methods.register('business_name')}
                      className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      WhatsApp Connected Number *
                    </label>
                    <div className="flex rounded-lg border border-slate-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-slate-900/10 focus-within:border-slate-900 shadow-sm">
                      <div className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100/90 border-r border-slate-200 text-slate-700 select-none">
                        <span className="text-sm leading-none">🇮🇳</span>
                        <span className="text-xs font-mono font-semibold text-slate-800">+91</span>
                      </div>
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={10}
                        autoComplete="tel-national"
                        value={methods.watch('whatsapp_number') || ''}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                          methods.setValue('whatsapp_number', digits, { shouldValidate: true });
                        }}
                        placeholder="9876543210"
                        className="flex-1 px-3 py-2 text-xs font-mono font-semibold text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-400 placeholder:font-normal"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Store Address / Pickup Location (For Invoices)
                    </label>
                    <input
                      {...methods.register('store_address')}
                      placeholder="e.g. Shop 4, Station Road, Thane West, Mumbai"
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      GSTIN / Tax ID (Optional for Invoices)
                    </label>
                    <input
                      {...methods.register('gst_number')}
                      placeholder="e.g. 27AAAAA0000A1Z5"
                      className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* UPI & In-Chat Payment Settings */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                  2. In-Chat UPI & Payment Automation
                </h3>

                <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Store UPI ID / VPA
                      </label>
                      <div className="relative">
                        <IndianRupee className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                        <input
                          {...methods.register('upi_id')}
                          placeholder="e.g. yourstore@okhdfcbank or 9876543210@paytm"
                          className="w-full pl-8 pr-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                        />
                      </div>
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Leave blank if accepting counter / cash only.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Payment Note / Instructions
                      </label>
                      <input
                        {...methods.register('payment_note')}
                        placeholder="e.g. Please share screenshot of UPI payment"
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="checkbox"
                      id="auto_send_payment_link"
                      {...methods.register('auto_send_payment_link')}
                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    <label htmlFor="auto_send_payment_link" className="text-xs text-slate-700 font-medium cursor-pointer">
                      Automatically generate clickable UPI pay link for exact order total in WhatsApp
                    </label>
                  </div>
                </div>
              </div>

              {/* Smart Customer Re-Engagement & Renewal Reminders */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                  3. Automated Re-Engagement & Refill Reminders
                </h3>

                <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Reminder Interval (Days after last visit)
                      </label>
                      <input
                        type="number"
                        {...methods.register('reminder_days')}
                        placeholder={category === 'salon' ? '25' : category === 'gym' ? '27' : '7'}
                        className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                      />
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        e.g. 27 days for monthly gym pass, 25 days for salon trim, 7 days for cafe/bakery refill.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Custom Reminder Template (Optional)
                      </label>
                      <input
                        {...methods.register('reminder_template')}
                        placeholder="e.g. Hi! Time for your regular visit? We have slots available this week!"
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="checkbox"
                      id="enable_reminders"
                      {...methods.register('enable_reminders')}
                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    <label htmlFor="enable_reminders" className="text-xs text-slate-700 font-medium cursor-pointer">
                      Enable automated smart re-engagement reminders for returning customers
                    </label>
                  </div>
                </div>
              </div>

              {/* Dynamic Category Catalog Forms */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                  4. Menu, Pricing & Services Catalog
                </h3>

                {category === 'bakery' && <BakeryForm />}
                {category === 'cafe' && <CafeForm />}
                {category === 'salon' && <SalonForm />}
                {category === 'clinic' && <ClinicForm />}
                {category === 'gym' && <GymForm />}
                {category === 'tuition' && <TuitionForm />}
                {category === 'retail' && <RetailForm />}
                {category === 'real_estate' && <RealEstateForm />}
                {category === 'custom' && <SalonForm />}
              </div>

              {/* Save CTA Button */}
              <div className="pt-4 border-t border-slate-200 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-sm transition-all flex items-center space-x-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Updating Knowledge Base...' : 'Save Configuration Changes'}</span>
                </button>
              </div>
            </form>
          </FormProvider>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50/50 border border-red-200 rounded-xl p-6 space-y-3">
        <div className="flex items-center space-x-2 text-red-700">
          <AlertTriangle className="w-4 h-4" />
          <h3 className="font-semibold text-sm">Danger Zone: Permanent Business Account Deletion</h3>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Deleting your business account will permanently wipe all registered catalogs, conversations, orders ledger,
          pricing configs, and customer history. This action cannot be undone.
        </p>
        <div className="pt-1">
          <button
            type="button"
            onClick={handleDeleteBusiness}
            disabled={deleting}
            className="px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium shadow-sm transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{deleting ? 'Deleting Account...' : 'Delete Business Account'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
