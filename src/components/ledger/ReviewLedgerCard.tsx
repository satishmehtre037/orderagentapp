import React from 'react';
import { OnboardingWizardFormData } from '../../lib/validations/onboarding';
import { ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface ReviewLedgerCardProps {
  formData?: OnboardingWizardFormData;
  ownerEmail?: string;
  onGoLive: () => void;
  isSubmitting: boolean;
}

export const ReviewLedgerCard: React.FC<ReviewLedgerCardProps> = ({
  formData = {} as OnboardingWizardFormData,
  ownerEmail = 'owner@bizbotos.in',
  onGoLive,
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
      : category === 'gym'
      ? 'Gym & Fitness (Memberships)'
      : 'Tuition & Coaching (Leads)';

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
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
              Configuration Review
            </span>
            <h2 className="text-lg font-bold text-white">{businessName}</h2>
          </div>
          <div className="text-right">
            <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              1-Day Free Trial
            </span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="p-6 space-y-6">
          {/* Core Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 text-xs">
            <div>
              <span className="text-[11px] text-slate-400 block mb-0.5">BUSINESS CATEGORY</span>
              <span className="font-semibold text-slate-900">{categoryLabel}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-0.5">REGISTERED OWNER EMAIL</span>
              <span className="font-mono text-slate-900">{ownerEmail}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-0.5">WHATSAPP AGENT NUMBER</span>
              <span className="font-mono font-semibold text-slate-900">{displayPhone}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-0.5">BUSINESS HOURS</span>
              <span className="font-medium text-slate-900">{formData?.hours || 'Standard Hours'}</span>
            </div>
          </div>

          {/* Catalog Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase flex justify-between">
              <span>Catalog & Price Line Items</span>
              <span>{category.toUpperCase()}</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs bg-white">
              {category === 'bakery' && formData?.menu_items && (
                <div>
                  {formData.menu_items.map((item, idx) => (
                    <div key={idx} className="flex justify-between px-4 py-2.5 hover:bg-slate-50/50">
                      <span className="font-medium text-slate-800">{item.name} ({item.unit})</span>
                      <span className="font-mono font-semibold text-slate-900">₹{item.price}</span>
                    </div>
                  ))}
                </div>
              )}

              {category === 'cafe' && formData?.cafe_menu && (
                <div>
                  {formData.cafe_menu.map((item, idx) => (
                    <div key={idx} className="flex justify-between px-4 py-2.5 hover:bg-slate-50/50">
                      <span className="font-medium text-slate-800">{item.name} {item.category ? `(${item.category})` : ''}</span>
                      <span className="font-mono font-semibold text-slate-900">₹{item.price}</span>
                    </div>
                  ))}
                </div>
              )}

              {category === 'salon' && formData?.services && (
                <div>
                  {formData.services.map((item, idx) => (
                    <div key={idx} className="flex justify-between px-4 py-2.5 hover:bg-slate-50/50">
                      <span className="font-medium text-slate-800">{item.name} ({item.duration})</span>
                      <span className="font-mono font-semibold text-slate-900">₹{item.price}</span>
                    </div>
                  ))}
                </div>
              )}

              {category === 'gym' && formData?.gym_plans && (
                <div>
                  {formData.gym_plans.map((item, idx) => (
                    <div key={idx} className="flex justify-between px-4 py-2.5 hover:bg-slate-50/50">
                      <span className="font-medium text-slate-800">{item.name} ({item.duration})</span>
                      <span className="font-mono font-semibold text-slate-900">₹{item.price}</span>
                    </div>
                  ))}
                </div>
              )}

              {category === 'tuition' && formData?.courses && (
                <div>
                  {formData.courses.map((item, idx) => (
                    <div key={idx} className="flex justify-between px-4 py-2.5 hover:bg-slate-50/50">
                      <span className="font-medium text-slate-800">{item.name} [{item.batch_timing}]</span>
                      <span className="font-mono font-semibold text-slate-900">{item.fee}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Verification Callout */}
          <div className="flex items-center space-x-3 p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="leading-snug">
              Your AI agent knowledge base will be configured automatically. You can edit items, prices, and settings anytime from your dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* Go Live CTA */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onGoLive}
          disabled={isSubmitting}
          className="w-full py-3.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm shadow-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
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
