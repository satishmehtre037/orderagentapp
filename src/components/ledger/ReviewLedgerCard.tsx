import React from 'react';
import { OnboardingWizardFormData } from '../../lib/validations/onboarding';
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';

interface ReviewLedgerCardProps {
  formData: OnboardingWizardFormData;
  ownerEmail: string;
  onGoLive: () => void;
  isSubmitting: boolean;
}

export const ReviewLedgerCard: React.FC<ReviewLedgerCardProps> = ({
  formData,
  ownerEmail,
  onGoLive,
  isSubmitting,
}) => {
  const categoryLabel =
    formData.category === 'bakery'
      ? 'Bakery & Cakes (Orders)'
      : formData.category === 'cafe'
      ? 'Cafe & Dining (Orders)'
      : formData.category === 'salon'
      ? 'Salon & Spa (Bookings)'
      : formData.category === 'gym'
      ? 'Gym & Fitness (Memberships)'
      : 'Tuition & Coaching (Leads)';

  return (
    <div className="space-y-6">
      {/* Physical Passbook Entry Card */}
      <div className="bg-paper border-2 border-warm-border rounded-lg shadow-ledger overflow-hidden">
        {/* Passbook Top Banner */}
        <div className="bg-teal text-paper px-6 py-4 flex items-center justify-between border-b border-teal-hover">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-teal-light uppercase">
              PASSBOOK ENTRY #BIZ-808
            </span>
            <h2 className="font-serif text-xl font-bold text-paper">{formData.business_name || 'Business Name'}</h2>
          </div>
          <div className="text-right">
            <span className="inline-block text-xs font-mono px-2.5 py-1 rounded bg-teal-hover text-marigold font-semibold border border-marigold/30">
              30-DAY TRIAL READY
            </span>
          </div>
        </div>

        {/* Ledger Details Grid */}
        <div className="p-6 space-y-6">
          {/* Business Core Ledger Rows */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-warm-card p-4 rounded-md border border-warm-border/80 text-xs">
            <div>
              <span className="text-[11px] font-mono text-ink-light block mb-0.5">BUSINESS CATEGORY</span>
              <span className="font-serif text-sm font-bold text-ink">{categoryLabel}</span>
            </div>
            <div>
              <span className="text-[11px] font-mono text-ink-light block mb-0.5">REGISTERED OWNER EMAIL</span>
              <span className="font-mono text-sm font-medium text-ink">{ownerEmail}</span>
            </div>
            <div>
              <span className="text-[11px] font-mono text-ink-light block mb-0.5">WHATSAPP AGENT NUMBER</span>
              <span className="font-mono text-sm font-bold text-teal">{formData.whatsapp_number}</span>
            </div>
            <div>
              <span className="text-[11px] font-mono text-ink-light block mb-0.5">BUSINESS HOURS</span>
              <span className="font-medium text-ink">{formData.hours || 'Standard Business Hours'}</span>
            </div>
          </div>

          {/* Category Items Ruled Ledger Table */}
          <div className="border border-warm-border rounded-md overflow-hidden">
            <div className="bg-warm-stub px-4 py-2 border-b border-warm-border text-xs font-mono font-semibold text-ink-muted uppercase flex justify-between">
              <span>Catalog & Price Ledger Entry</span>
              <span>{formData.category.toUpperCase()} CONFIG</span>
            </div>

            <div className="divide-y divide-warm-border text-xs bg-paper">
              {/* Bakery Menu Items */}
              {formData.category === 'bakery' && formData.menu_items && (
                <div>
                  {formData.menu_items.map((item, idx) => (
                    <div key={idx} className="flex justify-between px-4 py-2.5 hover:bg-warm-card/40">
                      <span className="font-medium text-ink">{item.name} ({item.unit})</span>
                      <span className="font-mono tabular-nums font-semibold text-teal">₹{item.price}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Cafe Menu Items */}
              {formData.category === 'cafe' && formData.cafe_menu && (
                <div>
                  {formData.cafe_menu.map((item, idx) => (
                    <div key={idx} className="flex justify-between px-4 py-2.5 hover:bg-warm-card/40">
                      <span className="font-medium text-ink">{item.name} {item.category ? `(${item.category})` : ''}</span>
                      <span className="font-mono tabular-nums font-semibold text-teal">₹{item.price}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Salon Services */}
              {formData.category === 'salon' && formData.services && (
                <div>
                  {formData.services.map((item, idx) => (
                    <div key={idx} className="flex justify-between px-4 py-2.5 hover:bg-warm-card/40">
                      <span className="font-medium text-ink">{item.name} ({item.duration})</span>
                      <span className="font-mono tabular-nums font-semibold text-teal">₹{item.price}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Gym Plans */}
              {formData.category === 'gym' && formData.gym_plans && (
                <div>
                  {formData.gym_plans.map((item, idx) => (
                    <div key={idx} className="flex justify-between px-4 py-2.5 hover:bg-warm-card/40">
                      <span className="font-medium text-ink">{item.name} ({item.duration})</span>
                      <span className="font-mono tabular-nums font-semibold text-teal">₹{item.price}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tuition Courses */}
              {formData.category === 'tuition' && formData.courses && (
                <div>
                  {formData.courses.map((item, idx) => (
                    <div key={idx} className="flex justify-between px-4 py-2.5 hover:bg-warm-card/40">
                      <span className="font-medium text-ink">{item.name} [{item.batch_timing}]</span>
                      <span className="font-mono tabular-nums font-semibold text-teal">{item.fee}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* FAQs Summary */}
          {formData.faqs && formData.faqs.length > 0 && (
            <div className="border border-warm-border rounded-md p-4 bg-warm-card/40 space-y-2">
              <span className="text-[11px] font-mono font-semibold text-ink-light uppercase block">
                CONFIGURED FAQS ({formData.faqs.length} ITEMS)
              </span>
              <div className="space-y-1 text-xs">
                {formData.faqs.map((faq, idx) => (
                  <div key={idx} className="flex space-x-2">
                    <span className="text-teal font-bold font-mono">Q:</span>
                    <span className="text-ink font-medium">{faq.question}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verification & Trust Callout */}
          <div className="flex items-center space-x-3 p-3.5 bg-sage-light/60 border border-sage/30 rounded-md text-xs text-ink">
            <ShieldCheck className="w-5 h-5 text-sage flex-shrink-0" />
            <p className="leading-snug">
              Your AI agent prompt will be generated automatically. You can edit your menu, hours, and answers anytime from your owner dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* Signature Go Live CTA Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onGoLive}
          disabled={isSubmitting}
          className="w-full py-4 px-6 rounded-lg bg-marigold text-ink font-serif text-lg font-bold shadow-ledger hover:bg-marigold-hover active:translate-y-0.5 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <span>Creating Your WhatsApp AI Agent...</span>
          ) : (
            <>
              <span>Go Live — Start 30-Day Free Trial</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
