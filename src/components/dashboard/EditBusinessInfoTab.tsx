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
import { GymForm } from '../ledger/GymForm';
import { TuitionForm } from '../ledger/TuitionForm';
import { FormSkeleton } from './SkeletonLoaders';
import { Save, CheckCircle2, AlertCircle, Sparkles, Trash2, AlertTriangle, QrCode, IndianRupee, BellRing, FileText, RefreshCw, Clock } from 'lucide-react';

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
  const [deleting, setDeleting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

          reset({
            business_name: bus.name || 'My Business',
            category: category,
            whatsapp_number: bus.whatsapp_number || '',
            hours: configMap.hours || 'Mon - Sun, 9:00 AM - 9:00 PM',
            menu_items: configMap.menu_items || [
              { name: 'Fresh Chocolate Truffle Cake (1kg)', price: 650, unit: 'kg' },
              { name: 'Red Velvet Pastry', price: 120, unit: 'pcs' },
              { name: 'Butter Croissant', price: 80, unit: 'pcs' },
            ],
            services: configMap.services || [
              { name: 'Deluxe Haircut & Blowdry', price: 450, duration: '45 mins' },
            ],
            gym_plans: configMap.gym_plans || [
              { name: 'Monthly Membership', price: 1000, duration: '1 Month' },
              { name: 'Yearly Membership', price: 8000, duration: '1 Year' },
            ],
            cafe_menu: configMap.cafe_menu || [
              { name: 'Cold Brew Coffee', price: 150, category: 'Beverage' },
              { name: 'Avocado Toast', price: 220, category: 'Food' },
            ],
            staff: configMap.staff || [{ name: 'Trainer/Stylist' }],
            courses: configMap.course_list || [
              { name: 'Class 10th CBSE Mathematics', fee: '₹2,500/month', batch_timing: 'Mon-Fri 5:00 PM' },
            ],
            admission_process: configMap.admission_process || 'Free trial demo class available.',
            faqs: configMap.faqs || [
              { question: 'What are your working hours?', answer: '9:00 AM to 9:00 PM.' },
            ],
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
    setSaving(true);
    setErrorMessage(null);
    setShowSuccessToast(false);

    try {
      console.log('Updating business_config for ID:', businessId);

      // Prepare config updates array
      const updates: Array<{ config_key: string; config_value: any }> = [
        { config_key: 'hours', config_value: formData.hours || '' },
        { config_key: 'faqs', config_value: formData.faqs || [] },
        { config_key: 'upi_id', config_value: formData.upi_id || '' },
        { config_key: 'auto_send_payment_link', config_value: formData.auto_send_payment_link ?? true },
        { config_key: 'payment_note', config_value: formData.payment_note || '' },
        { config_key: 'gst_number', config_value: formData.gst_number || '' },
        { config_key: 'store_address', config_value: formData.store_address || '' },
        { config_key: 'enable_reminders', config_value: formData.enable_reminders ?? true },
        { config_key: 'reminder_days', config_value: formData.reminder_days || 27 },
        { config_key: 'reminder_template', config_value: formData.reminder_template || '' },
      ];

      if (category === 'bakery') {
        updates.push({ config_key: 'menu_items', config_value: formData.menu_items || [] });
      } else if (category === 'salon') {
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
      }

      const res = await fetch('/api/business', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          name: formData.business_name,
          whatsapp_number: formData.whatsapp_number,
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
      console.error('Failed to save configuration:', err);
      setErrorMessage(err.message || 'Failed to update business configuration.');
    } finally {
      setSaving(false);
    }
  };

  // Handle Delete Business Account
  const handleDeleteBusiness = async () => {
    const confirmed = window.confirm(
      '⚠️ PERMANENT ACCOUNT DELETION\n\nAre you sure you want to delete this business account?\n\nThis will permanently delete:\n• All WhatsApp conversations & chat logs\n• All orders, bookings, and lead ledger entries\n• All business catalog configurations and pricing\n• Payment records and subscription data\n\nThis action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/business?businessId=${encodeURIComponent(businessId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete business account');
      }

      alert('✅ Your business account and all records have been completely deleted.');
      window.location.href = '/onboarding';
    } catch (err: any) {
      console.error('Delete business error:', err);
      alert(`Error deleting business: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <FormSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Sage Green Success Toast Banner */}
      {showSuccessToast && (
        <div className="p-4 bg-sage-light border-2 border-sage text-ink rounded-lg shadow-sm flex items-center justify-between animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-sage fill-sage text-paper" />
            <div>
              <h4 className="font-serif font-bold text-sm text-teal">Settings Saved Successfully!</h4>
              <p className="text-xs text-ink-muted">
                Your AI agent system prompt has been updated with your latest prices and hours.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 bg-paper border border-sage/40 rounded text-sage font-bold">
            PROMPT RE-HYDRATED
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="bg-paper border-2 border-warm-border rounded-lg shadow-ledger overflow-hidden">
        {/* Passbook Stub Header */}
        <div className="bg-warm-stub px-6 py-4 border-b border-warm-border flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-ink-light uppercase block">
              CONFIG EDITOR
            </span>
            <h2 className="font-serif text-lg font-bold text-ink">
              Edit Business Catalog & Agent Configuration
            </h2>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 bg-paper border border-warm-border rounded text-teal font-semibold">
            {category.toUpperCase()} MODE
          </span>
        </div>

        <div className="p-6 sm:p-8">
          <FormProvider {...methods}>
            <form
              onSubmit={handleSubmit(onSaveConfig, (validationErrors) => {
                console.error('Validation errors:', validationErrors);
                setErrorMessage('Please ensure all item names, prices, and units are filled in.');
              })}
              className="space-y-6"
            >
              {/* Core Info & Tax Invoicing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-warm-card p-4 rounded-md border border-warm-border">
                <div>
                  <label className="block text-xs font-mono text-ink-light uppercase mb-1">
                    Business Name
                  </label>
                  <input
                    {...methods.register('business_name')}
                    className="w-full text-sm font-serif font-bold px-3 py-2 bg-paper border border-warm-border rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-ink-light uppercase mb-1">
                    WhatsApp Agent Number
                  </label>
                  <input
                    {...methods.register('whatsapp_number')}
                    className="w-full text-sm font-mono font-bold px-3 py-2 bg-paper border border-warm-border rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-ink-light uppercase mb-1">
                    Store Address / Location (For Invoices)
                  </label>
                  <input
                    {...methods.register('store_address')}
                    placeholder="e.g. Shop 4, Station Road, Thane West, Mumbai"
                    className="w-full text-xs px-3 py-2 bg-paper border border-warm-border rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-ink-light uppercase mb-1">
                    GSTIN / Tax ID (Optional for Invoices)
                  </label>
                  <input
                    {...methods.register('gst_number')}
                    placeholder="e.g. 27AAAAA0000A1Z5"
                    className="w-full text-xs font-mono px-3 py-2 bg-paper border border-warm-border rounded"
                  />
                </div>
              </div>

              {/* UPI & In-Chat Payment Settings */}
              <div className="bg-paper border border-warm-border rounded-lg p-5 shadow-sm space-y-4">
                <div className="flex items-center space-x-2 pb-3 border-b border-warm-border">
                  <div className="p-1.5 bg-teal-light text-teal rounded">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif text-sm font-bold text-ink">In-Chat UPI & Payment Automation</h3>
                    <p className="text-[11px] text-ink-muted">
                      When customers confirm orders or bookings, the AI automatically sends them your direct UPI pay link.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-ink-light uppercase mb-1">
                      Store UPI ID / VPA
                    </label>
                    <div className="relative">
                      <IndianRupee className="w-3.5 h-3.5 text-ink-light absolute left-3 top-3" />
                      <input
                        {...methods.register('upi_id')}
                        placeholder="e.g. yourstore@okhdfcbank or 9876543210@paytm"
                        className="w-full pl-8 pr-3 py-2 text-xs font-mono bg-warm-card/40 border border-warm-border rounded focus:border-teal"
                      />
                    </div>
                    <span className="text-[10px] text-ink-muted mt-1 block">
                      Leave blank if you accept cash/counter payments only.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-ink-light uppercase mb-1">
                      Payment Note / Instructions
                    </label>
                    <input
                      {...methods.register('payment_note')}
                      placeholder="e.g. Please share screenshot of UPI payment"
                      className="w-full px-3 py-2 text-xs bg-warm-card/40 border border-warm-border rounded focus:border-teal"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="auto_send_payment_link"
                    {...methods.register('auto_send_payment_link')}
                    className="rounded border-warm-border text-teal focus:ring-teal"
                  />
                  <label htmlFor="auto_send_payment_link" className="text-xs text-ink font-medium cursor-pointer">
                    Automatically generate clickable UPI pay link with exact order total in WhatsApp
                  </label>
                </div>
              </div>

              {/* Smart Customer Re-Engagement & Renewal Reminders */}
              <div className="bg-paper border border-warm-border rounded-lg p-5 shadow-sm space-y-4">
                <div className="flex items-center space-x-2 pb-3 border-b border-warm-border">
                  <div className="p-1.5 bg-marigold-light text-ink rounded">
                    <BellRing className="w-4 h-4 text-marigold" />
                  </div>
                  <div>
                    <h3 className="font-serif text-sm font-bold text-ink">Smart Customer Re-Engagement & Refill Reminders</h3>
                    <p className="text-[11px] text-ink-muted">
                      Automatically nudge past customers on WhatsApp before memberships expire or when they are due for their next salon/bakery order.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-ink-light uppercase mb-1">
                      Reminder Interval (Days after last visit/order)
                    </label>
                    <input
                      type="number"
                      {...methods.register('reminder_days')}
                      placeholder={category === 'salon' ? '25' : category === 'gym' ? '27' : '7'}
                      className="w-full px-3 py-2 text-xs font-mono bg-warm-card/40 border border-warm-border rounded focus:border-teal"
                    />
                    <span className="text-[10px] text-ink-muted mt-1 block">
                      e.g. 27 days for monthly gym renewal, 25 days for salon trim, 7 days for cafe/bakery refill.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-ink-light uppercase mb-1">
                      Custom Reminder Message Template (Optional)
                    </label>
                    <input
                      {...methods.register('reminder_template')}
                      placeholder="e.g. Hi! Your gym pass expires in 3 days. Would you like to renew?"
                      className="w-full px-3 py-2 text-xs bg-warm-card/40 border border-warm-border rounded focus:border-teal"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="enable_reminders"
                    {...methods.register('enable_reminders')}
                    className="rounded border-warm-border text-teal focus:ring-teal"
                  />
                  <label htmlFor="enable_reminders" className="text-xs text-ink font-medium cursor-pointer">
                    Enable automated smart re-engagement reminders for inactive customers
                  </label>
                </div>
              </div>

              {/* Dynamic Category Forms */}
              {category === 'bakery' && <BakeryForm />}
              {category === 'cafe' && <CafeForm />}
              {category === 'salon' && <SalonForm />}
              {category === 'gym' && <GymForm />}
              {category === 'tuition' && <TuitionForm />}

              {/* Save CTA Button */}
              <div className="pt-4 border-t border-warm-border flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 rounded-md bg-teal text-paper font-serif font-bold text-sm hover:bg-teal-hover shadow-ledger transition-all flex items-center space-x-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4 text-marigold" />
                  <span>{saving ? 'Updating System Prompt...' : 'Save Configuration Changes'}</span>
                </button>
              </div>
            </form>
          </FormProvider>
        </div>
      </div>

      {/* Danger Zone: Permanent Account Deletion */}
      <div className="bg-red-50/50 border-2 border-red-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center space-x-2 text-red-700">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h3 className="font-serif font-bold text-base">Danger Zone: Permanent Business Deletion</h3>
        </div>
        <p className="text-xs text-ink-muted leading-relaxed">
          Deleting your business account will permanently wipe all registered catalogs, conversations, orders ledger,
          pricing configs, and customer history from the database. This action is irreversible.
        </p>
        <div className="pt-2 flex justify-start">
          <button
            type="button"
            onClick={handleDeleteBusiness}
            disabled={deleting}
            className="px-4 py-2.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-serif font-bold shadow-sm transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4 text-red-100" />
            <span>{deleting ? 'Deleting Account & Data...' : 'Delete Business Account & Reset Data'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
