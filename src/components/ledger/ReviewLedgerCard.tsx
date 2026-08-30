'use client';

import React from 'react';
import { OnboardingWizardFormData } from '../../lib/validations/onboarding';
import { ArrowRight, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface ReviewLedgerCardProps {
  formData?: OnboardingWizardFormData;
  ownerEmail?: string;
  onGoLive: () => void;
  onBack?: () => void;
  isSubmitting: boolean;
}

export const ReviewLedgerCard: React.FC<ReviewLedgerCardProps> = ({
  formData = {} as OnboardingWizardFormData,
  ownerEmail = 'owner@bizbotos.in',
  onGoLive,
  onBack,
  isSubmitting,
}) => {
  const category = formData?.category || 'bakery';
  const categoryLabel =
    category === 'bakery'
      ? 'Bakery & Cakes (Orders)'
      : category === 'cafe'
      ? 'Cafe & Dining (Orders)'
      : category === 'salon'
      ? 'Salon & Spa (Bookings)'
      : category === 'clinic'
      ? 'Clinic & Healthcare (Appointments)'
      : category === 'hospital'
      ? 'Hospital & Multi-Specialty (OPD/IPD)'
      : category === 'gym'
      ? 'Gym & Fitness (Memberships)'
      : category === 'tuition'
      ? 'Tuition & Coaching (Leads)'
      : category === 'retail'
      ? 'Boutique & Retail (Orders)'
      : category === 'real_estate'
      ? 'Real Estate & Property (Leads)'
      : category === 'ca_firm'
      ? 'CA & Tax Consulting (Compliance)'
      : 'General Business (Custom AI)';

  const businessName = formData?.business_name || 'My Business';
  const rawNumber = formData?.whatsapp_number || '';
  const displayPhone = rawNumber
    ? rawNumber.startsWith('+91')
      ? rawNumber
      : `+91 ${rawNumber}`
    : 'Not provided';

  return (
    <div className="space-y-6">
      {/* Review Card */}
      <div className="bg-surface border border-line rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-surface-elevated px-6 py-4 flex items-center justify-between border-b border-line">
          <div>
            <span className="text-[10px] font-medium tracking-wider text-fg-muted uppercase">
              Configuration Review
            </span>
            <h2 className="text-lg font-bold text-fg">{businessName}</h2>
          </div>
          <div className="text-right">
            <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-md bg-success-subtle text-success border border-success-border">
              30-Day Free Trial
            </span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="p-6 space-y-6">
          {/* Core Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface-subtle p-4 rounded-xl border border-line text-xs">
            <div>
              <span className="text-[11px] text-fg-muted block mb-0.5">BUSINESS CATEGORY</span>
              <span className="font-semibold text-fg">{categoryLabel}</span>
            </div>
            <div>
              <span className="text-[11px] text-fg-muted block mb-0.5">REGISTERED OWNER EMAIL</span>
              <span className="font-mono text-fg">{ownerEmail}</span>
            </div>
            <div>
              <span className="text-[11px] text-fg-muted block mb-0.5">WHATSAPP AGENT NUMBER</span>
              <span className="font-mono font-semibold text-fg">{displayPhone}</span>
            </div>
            <div>
              <span className="text-[11px] text-fg-muted block mb-0.5">BUSINESS HOURS</span>
              <span className="font-medium text-fg">{formData?.hours || 'Standard Hours'}</span>
            </div>
          </div>

          {/* Catalog Table */}
          <div className="border border-line rounded-xl overflow-hidden">
            <div className="bg-surface-subtle px-4 py-2.5 border-b border-line text-xs font-semibold text-fg-muted uppercase flex justify-between">
              <span>Catalog & Price Line Items</span>
              <span className="text-accent">{category.toUpperCase()}</span>
            </div>

            <div className="divide-y divide-line text-xs bg-surface">
              {category === 'bakery' && formData?.menu_items && (
                <div>
                  {formData.menu_items.map((item, idx) => (
                    <div key={idx} className="flex justify-between px-4 py-2.5 hover:bg-surface-subtle/50">
                      <span className="font-medium text-fg">{item.name} ({item.unit})</span>
                      <span className="font-mono font-semibold text-accent">₹{item.price}</span>
                    </div>
                  ))}
                </div>
              )}

              {category === 'cafe' && formData?.cafe_menu && (
                <div>
                  {formData.cafe_menu.map((item, idx) => (
                    <div key={idx} className="flex justify-between px-4 py-2.5 hover:bg-surface-subtle/50">
                      <span className="font-medium text-fg">{item.name} {item.category ? `(${item.category})` : ''}</span>
                      <span className="font-mono font-semibold text-accent">₹{item.price}</span>
                    </div>
                  ))}
                </div>
              )}

              {(category === 'salon' || category === 'clinic' || category === 'hospital' || category === 'real_estate' || category === 'ca_firm' || category === 'custom') && formData?.services && (
                <div>
                  {formData.services.map((item, idx) => (
                    <div key={idx} className="flex justify-between px-4 py-2.5 hover:bg-surface-subtle/50">
                      <span className="font-medium text-fg">{item.name} {item.duration ? `(${item.duration})` : ''}</span>
                      <span className="font-mono font-semibold text-accent">₹{item.price}</span>
                    </div>
                  ))}
                </div>
              )}

              {(category === 'retail') && formData?.menu_items && (
                <div>
                  {formData.menu_items.map((item, idx) => (
                    <div key={idx} className="flex justify-between px-4 py-2.5 hover:bg-surface-subtle/50">
                      <span className="font-medium text-fg">{item.name} ({item.unit})</span>
                      <span className="font-mono font-semibold text-accent">₹{item.price}</span>
                    </div>
                  ))}
                </div>
              )}

              {category === 'gym' && formData?.gym_plans && (
                <div>
                  {formData.gym_plans.map((item, idx) => (
                    <div key={idx} className="flex justify-between px-4 py-2.5 hover:bg-surface-subtle/50">
                      <span className="font-medium text-fg">{item.name} ({item.duration})</span>
                      <span className="font-mono font-semibold text-accent">₹{item.price}</span>
                    </div>
                  ))}
                </div>
              )}

              {category === 'tuition' && formData?.courses && (
                <div>
                  {formData.courses.map((item, idx) => (
                    <div key={idx} className="flex justify-between px-4 py-2.5 hover:bg-surface-subtle/50">
                      <span className="font-medium text-fg">{item.name} [{item.batch_timing}]</span>
                      <span className="font-mono font-semibold text-accent">{item.fee}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Verification Callout */}
          <div className="flex items-center space-x-3 p-3.5 bg-success-subtle border border-success-border rounded-xl text-xs text-success">
            <ShieldCheck className="w-5 h-5 text-success flex-shrink-0" />
            <p className="leading-snug">
              Your AI agent knowledge base will be configured automatically. You can edit items, prices, and settings anytime from your dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* Go Live & Back Actions */}
      <div className="pt-2 flex items-center space-x-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="py-3.5 px-5 rounded-xl border border-line bg-surface hover:bg-surface-subtle text-fg font-semibold text-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-[0.98] shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        )}
        <button
          type="button"
          onClick={onGoLive}
          disabled={isSubmitting}
          className="flex-1 py-3.5 px-6 rounded-xl bg-accent hover:bg-accent-hover text-accent-fg font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-[0.98]"
        >
          {isSubmitting ? (
            <span>Activating Your AI Agent...</span>
          ) : (
            <>
              <span>Activate AI Agent & Go Live</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
