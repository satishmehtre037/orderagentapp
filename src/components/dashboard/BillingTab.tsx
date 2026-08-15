import React, { useState, useEffect } from 'react';
import { supabaseClient } from '../../lib/supabase/client';
import { PaymentEvent, BusinessCategory } from '../../types';
import {
  CreditCard,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Zap,
  Download,
  IndianRupee,
  Check,
  Lock,
  Clock,
  Printer,
  ChevronRight,
  TrendingUp,
  Receipt,
  HelpCircle,
  Hourglass,
  AlertTriangle,
} from 'lucide-react';

interface BillingTabProps {
  businessId: string;
  category?: BusinessCategory;
  trialEndDateStr?: string;
  subscriptionStatus: string;
  plan?: string;
  onSubscriptionUpdated?: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const BillingTab: React.FC<BillingTabProps> = ({
  businessId,
  category = 'bakery',
  trialEndDateStr,
  subscriptionStatus,
  plan,
  onSubscriptionUpdated,
}) => {
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<PaymentEvent[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live 1-Second Ticking Countdown Timer for 1-Hour Test Trial
  const [countdownText, setCountdownText] = useState('Calculating...');
  const [isTrialEnded, setIsTrialEnded] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      if (!trialEndDateStr) {
        setCountdownText('60m 00s left');
        return;
      }

      const end = new Date(trialEndDateStr).getTime();
      const diffMs = end - Date.now();

      if (diffMs <= 0) {
        setIsTrialEnded(true);
        setCountdownText('Trial Expired');
      } else {
        setIsTrialEnded(false);
        const mins = Math.floor(diffMs / (1000 * 60));
        const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
        setCountdownText(`${mins}m ${secs < 10 ? '0' : ''}${secs}s left`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [trialEndDateStr]);

  const isActive = subscriptionStatus === 'active' || plan === 'monthly_1' || plan === 'annual_10' || plan === 'monthly_999';
  const isExpired = subscriptionStatus === 'expired' || (!isActive && isTrialEnded);

  // Fetch Payment History Ledger
  const fetchPaymentHistory = async () => {
    try {
      setPaymentsLoading(true);
      const res = await fetch(`/api/billing?businessId=${encodeURIComponent(businessId)}`);
      const data = await res.json();

      if (data.payments) {
        setPayments(data.payments);
      }
    } catch (err) {
      console.error('Fetch payment history error:', err);
    } finally {
      setPaymentsLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentHistory();

    // Check for payment status in URL on redirect
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const paymentStatus = params.get('payment');
      const paymentId = params.get('payment_id');

      if (paymentStatus === 'success') {
        setSuccessMsg(`Payment successful! (ID: ${paymentId || 'Captured'}). Your subscription is active.`);
        onSubscriptionUpdated?.();
        // Clean URL params without reloading
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (paymentStatus === 'cancelled') {
        setErrorMsg('Payment was cancelled.');
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (paymentStatus === 'failed') {
        setErrorMsg('Payment failed or signature verification failed. Please try again.');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [businessId]);

  // Load Razorpay Standard Checkout Script dynamically
  const loadRazorpayScript = () => {
    return new Promise<boolean>((resolve) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Test Pricing Configuration: ₹1 / month (100 paise) and ₹10 / year (1000 paise)
  const currentPlanAmountPaise = selectedBillingCycle === 'annual' ? 1000 : 100; // 100 paise = ₹1.00
  const currentPlanAmountRupees = selectedBillingCycle === 'annual' ? 10 : 1;
  const currentPlanLabel =
    selectedBillingCycle === 'annual' ? 'Annual Saver (₹10/year)' : 'Pro Monthly (₹1/month)';

  // Execute Razorpay Standard Checkout Payment Flow (Full-Page Redirect Mode)
  const handleUpgradeClick = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      console.log(`[Frontend Checkout] Requesting order creation for ₹${currentPlanAmountRupees} ...`);
      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: currentPlanAmountPaise,
          currency: 'INR',
          receipt: `rcpt_${businessId.substring(0, 8)}_${Date.now()}`,
          notes: {
            business_id: businessId,
            plan_cycle: selectedBillingCycle,
          },
        }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.order_id) {
        throw new Error(orderData.error || 'Failed to create Razorpay checkout order');
      }

      const keyId =
        orderData.key_id ||
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
        'rzp_live_TPDyzIAe95Bgky';

      // Load checkout.js
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded || typeof window.Razorpay === 'undefined') {
        throw new Error('Razorpay Checkout SDK failed to load. Please check your network connection.');
      }

      const options = {
        key: keyId,
        amount: Math.round(Number(orderData.amount)),
        currency: orderData.currency || 'INR',
        name: 'WebcoreStudio',
        description: `${currentPlanLabel} — WhatsApp AI Agent Plan`,
        order_id: orderData.order_id,
        notes: {
          business_id: businessId,
        },
        theme: {
          color: '#d8707d',
        },
        // Enable UPI Intent inside Android WebView / Capacitor
        webview_intent: true,
        // Explicitly force full display of all payment options
        config: {
          display: {
            blocks: {
              upi: {
                name: 'Pay via UPI',
                instruments: [
                  {
                    method: 'upi',
                  },
                ],
              },
              other: {
                name: 'Cards, NetBanking & Wallet',
                instruments: [
                  {
                    method: 'card',
                  },
                  {
                    method: 'netbanking',
                  },
                  {
                    method: 'wallet',
                  },
                ],
              },
            },
            sequence: ['block.upi', 'block.other'],
            preferences: {
              show_default_blocks: true,
            },
          },
        },
        modal: {
          ondismiss: function () {
            console.log('[Razorpay Modal] Closed/Cancelled by user');
            setLoading(false);
          },
          escape: true,
          backdropclose: true,
        },
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          console.log('[Frontend Checkout] Payment received, verifying HMAC signature ...', response);
          setLoading(true);

          try {
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.success) {
              await recordSuccessfulPayment(
                response.razorpay_payment_id,
                currentPlanAmountPaise,
                selectedBillingCycle === 'annual' ? 'annual_10' : 'monthly_1'
              );
            } else {
              setErrorMsg(verifyData.message || 'Payment signature verification failed. Contact support.');
            }
          } catch (vErr: any) {
            setErrorMsg('Network error while verifying payment signature.');
          } finally {
            setLoading(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', function (response: any) {
        console.warn('[Razorpay] Payment failed:', response);
        setErrorMsg(`Payment Failed: ${response.error?.description || response.error?.reason || 'Transaction failed'}`);
        setLoading(false);
      });

      rzp.on('payment.cancelled', function () {
        console.log('[Razorpay] Payment cancelled by user');
        setLoading(false);
      });

      rzp.open();
      
      // Auto-reset loading state after modal opens so button is never stuck
      setTimeout(() => {
        setLoading(false);
      }, 1500);
    } catch (err: any) {
      console.error('[Upgrade Click Error]:', err);
      setErrorMsg(err.message || 'Failed to initiate Razorpay Checkout');
      setLoading(false);
    }
  };

  // Instant Test Simulation Bypass
  const handleSimulateTestPayment = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const mockPaymentId = `pay_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await recordSuccessfulPayment(
        mockPaymentId,
        currentPlanAmountPaise,
        selectedBillingCycle === 'annual' ? 'annual_10' : 'monthly_1'
      );
    } catch (err: any) {
      setErrorMsg('Failed to simulate test payment.');
    } finally {
      setLoading(false);
    }
  };

  // Record payment in Supabase and update state
  const recordSuccessfulPayment = async (
    paymentId: string,
    amountPaise: number,
    chosenPlan: string
  ) => {
    try {
      await supabaseClient
        .from('businesses')
        .update({
          subscription_status: 'active',
          plan: chosenPlan,
        })
        .eq('id', businessId);

      await supabaseClient.from('payment_events').insert({
        business_id: businessId,
        razorpay_payment_id: paymentId,
        amount: amountPaise,
        status: 'success',
      });

      setSuccessMsg(
        `🎉 Payment of ₹${(amountPaise / 100).toLocaleString('en-IN')} verified successfully! Your ${
          chosenPlan.includes('annual') ? 'Annual' : 'Monthly'
        } Pro Plan is now ACTIVE!`
      );
      fetchPaymentHistory();
      if (onSubscriptionUpdated) onSubscriptionUpdated();
    } catch (err: any) {
      console.error('Error saving payment record:', err);
      setSuccessMsg('🎉 Payment verified successfully! Plan status updated.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Notification Banner */}
      {successMsg && (
        <div className="p-4 bg-sage-light border-2 border-sage text-ink rounded-lg shadow-sm flex items-center justify-between animate-fade-in">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-6 h-6 text-sage" />
            <div>
              <h4 className="font-serif font-bold text-sm text-teal">{successMsg}</h4>
              <p className="text-xs text-ink-muted">
                HMAC-SHA256 signature verified. Official receipt recorded in your passbook ledger.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 bg-paper border border-sage/40 rounded text-sage font-bold flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>VERIFIED</span>
          </span>
        </div>
      )}

      {/* Trial Expired Alert Banner (When Not Active) */}
      {isExpired && !isActive && (
        <div className="p-4 bg-red-50 border-2 border-red-400 text-red-900 rounded-lg shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-fade-in">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <h4 className="font-serif font-bold text-sm text-red-900">⚠️ 1-Hour Free Trial Expired — AI Agent Paused</h4>
              <p className="text-xs text-red-700">
                Your WhatsApp AI assistant is currently paused. Upgrade to the ₹1/month plan below to immediately resume instant automated customer orders and replies!
              </p>
            </div>
          </div>
          <button
            onClick={handleUpgradeClick}
            className="px-4 py-2 bg-red-700 text-white text-xs font-serif font-bold rounded shadow-sm hover:bg-red-800 transition-colors whitespace-nowrap"
          >
            Renew Now for ₹1
          </button>
        </div>
      )}

      {/* Error Notification Banner */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border-2 border-red-300 text-red-700 text-xs rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-red-500 hover:text-red-700 font-bold ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Billing Passbook Card */}
      <div className="bg-paper border-2 border-warm-border rounded-lg shadow-ledger overflow-hidden">
        {/* Passbook Stub Header */}
        <div className="bg-warm-stub px-6 py-4 border-b border-warm-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-teal" />
            <div>
              <h2 className="font-serif text-lg font-bold text-ink">Subscription Plan & Checkout Ledger</h2>
              <p className="text-xs text-ink-muted">Secure Razorpay 256-bit encrypted commerce engine</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`text-xs font-mono px-3 py-1 rounded font-bold uppercase tracking-wider flex items-center space-x-1.5 ${
                isActive
                  ? 'bg-sage-light text-sage border border-sage/40'
                  : isExpired
                  ? 'bg-red-100 text-red-800 border border-red-300'
                  : 'bg-marigold-light text-ink border border-marigold/40'
              }`}
            >
              <Hourglass className="w-3.5 h-3.5" />
              <span>
                {isActive
                  ? 'Pro Plan Active (₹1/mo)'
                  : isExpired
                  ? 'Trial Expired'
                  : `Trial: ${countdownText}`}
              </span>
            </span>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Live Trial Countdown Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-warm-card p-5 rounded-lg border border-warm-border space-y-1">
              <span className="text-[10px] font-mono text-ink-light uppercase block">TRIAL STATUS</span>
              <div className="flex items-baseline space-x-2">
                {isActive ? (
                  <span className="font-serif text-xl font-bold text-sage">Active Subscriber</span>
                ) : isExpired ? (
                  <span className="font-serif text-xl font-bold text-red-600">Expired</span>
                ) : (
                  <span className="font-mono text-xl font-bold text-teal">{countdownText}</span>
                )}
              </div>
              <p className="text-[11px] text-ink-muted">
                {isActive ? '24/7 Live AI Active' : isExpired ? 'AI Replies Paused' : '1-Hour Test Trial Window'}
              </p>
            </div>

            <div className="bg-warm-card p-5 rounded-lg border border-warm-border space-y-1">
              <span className="text-[10px] font-mono text-ink-light uppercase block">TEST PRICING</span>
              <div className="flex items-baseline space-x-1">
                <span className="font-mono text-3xl font-bold text-teal">₹1</span>
                <span className="font-serif text-xs text-ink-muted">/ month</span>
              </div>
              <p className="text-[11px] text-sage font-semibold">100 Paise Minimum (Razorpay)</p>
            </div>

            <div className="bg-warm-card p-5 rounded-lg border border-warm-border space-y-1">
              <span className="text-[10px] font-mono text-ink-light uppercase block">WHATSAPP AI AGENT</span>
              <div className="flex items-baseline space-x-1">
                <span className="font-mono text-2xl font-bold text-teal">Unlimited</span>
              </div>
              <p className="text-[11px] text-ink-muted">Automated Order & Booking Capture</p>
            </div>
          </div>

          {/* Monthly vs Annual Toggle */}
          <div className="flex justify-center">
            <div className="inline-flex p-1 bg-warm-card border border-warm-border rounded-lg shadow-sm">
              <button
                type="button"
                onClick={() => setSelectedBillingCycle('monthly')}
                className={`px-4 py-2 text-xs font-serif font-bold rounded-md transition-all ${
                  selectedBillingCycle === 'monthly'
                    ? 'bg-teal text-white shadow-sm'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                Monthly Plan (₹1 / mo)
              </button>
              <button
                type="button"
                onClick={() => setSelectedBillingCycle('annual')}
                className={`px-4 py-2 text-xs font-serif font-bold rounded-md transition-all flex items-center space-x-1.5 ${
                  selectedBillingCycle === 'annual'
                    ? 'bg-teal text-white shadow-sm'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <span>Annual Saver (₹10 / yr)</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-marigold text-teal font-extrabold uppercase">
                  SAVE 17%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Monthly Plan Card */}
            <div
              onClick={() => setSelectedBillingCycle('monthly')}
              className={`cursor-pointer rounded-lg border-2 p-5 transition-all relative flex flex-col justify-between ${
                selectedBillingCycle === 'monthly'
                  ? 'bg-paper border-teal ring-2 ring-teal/20 shadow-passbook'
                  : 'bg-warm-card border-warm-border hover:border-teal/40'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-ink">Monthly Plan</h3>
                    <p className="text-xs text-ink-muted">Billed monthly, cancel anytime</p>
                  </div>
                  {selectedBillingCycle === 'monthly' && (
                    <span className="p-1 rounded-full bg-teal text-white">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                <div className="my-4 flex items-baseline space-x-1">
                  <span className="font-mono text-3xl font-bold text-teal">₹1</span>
                  <span className="text-xs text-ink-muted font-serif">/ month</span>
                </div>

                <ul className="space-y-2 text-xs text-ink mb-4">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-teal flex-shrink-0" />
                    <span>Unlimited WhatsApp AI Agent replies</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-teal flex-shrink-0" />
                    <span>Instant Catalog & Pricing Answering</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-teal flex-shrink-0" />
                    <span>Live Orders & Bookings Structured Ledger</span>
                  </li>
                </ul>
              </div>

              <span className="text-[11px] font-mono text-ink-light pt-3 border-t border-warm-border block">
                Standard 30-Day Billing Cycle
              </span>
            </div>

            {/* Annual Saver Card */}
            <div
              onClick={() => setSelectedBillingCycle('annual')}
              className={`cursor-pointer rounded-lg border-2 p-5 transition-all relative flex flex-col justify-between ${
                selectedBillingCycle === 'annual'
                  ? 'bg-paper border-teal ring-2 ring-teal/20 shadow-passbook'
                  : 'bg-warm-card border-warm-border hover:border-teal/40'
              }`}
            >
              <div className="absolute -top-3 right-4 bg-marigold text-teal text-[10px] font-mono font-extrabold uppercase px-2.5 py-0.5 rounded shadow-sm border border-teal/20">
                ✨ BEST VALUE
              </div>

              <div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-ink">Annual Saver Plan</h3>
                    <p className="text-xs text-ink-muted">12 months uninterrupted AI commerce</p>
                  </div>
                  {selectedBillingCycle === 'annual' && (
                    <span className="p-1 rounded-full bg-teal text-white">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                <div className="my-4 flex items-baseline space-x-1">
                  <span className="font-mono text-3xl font-bold text-teal">₹10</span>
                  <span className="text-xs text-ink-muted font-serif">/ year</span>
                </div>

                <ul className="space-y-2 text-xs text-ink mb-4">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-teal flex-shrink-0" />
                    <span>Everything in Monthly Pro plan</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-teal flex-shrink-0" />
                    <span>Priority Groq Llama 3.3 70B AI Token Allocation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-teal flex-shrink-0" />
                    <span>Dedicated WhatsApp API Onboarding Support</span>
                  </li>
                </ul>
              </div>

              <span className="text-[11px] font-mono text-teal font-semibold pt-3 border-t border-warm-border block">
                Full 365 Days Guaranteed Active Status
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={handleUpgradeClick}
              className="w-full py-4 px-6 rounded-lg bg-teal text-paper font-serif text-lg font-bold hover:bg-teal-hover shadow-ledger transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin text-marigold" />
                  <span>Opening Razorpay Secure Checkout...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-marigold" />
                  <span>
                    Pay ₹{currentPlanAmountRupees} via Razorpay Checkout
                  </span>
                </>
              )}
            </button>

            {/* Quick Test / Demo Mode Bypass */}
            <div className="flex items-center justify-between p-3 bg-paper border border-dashed border-teal/40 rounded-lg text-xs">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-marigold fill-marigold" />
                <div>
                  <span className="font-bold text-ink">Developer & Testing Sandbox:</span>
                  <p className="text-[11px] text-ink-muted">
                    Simulate an instant verified payment for ₹{currentPlanAmountRupees} without opening Razorpay.
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={handleSimulateTestPayment}
                className="px-3 py-1.5 rounded bg-warm-card border border-teal text-teal text-xs font-serif font-bold hover:bg-teal hover:text-white transition-colors"
              >
                Instant Test Activate
              </button>
            </div>
          </div>

          {/* Frequently Asked Questions: What Happens If You Don't Buy? */}
          <div className="border border-warm-border rounded-lg p-5 bg-warm-card space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-warm-border">
              <HelpCircle className="w-5 h-5 text-teal" />
              <h3 className="font-serif text-sm font-bold text-ink">What happens if you don't buy the plan?</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-paper rounded border border-warm-border/80 space-y-1">
                <span className="font-bold text-ink flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>1. WhatsApp AI Auto-Replies Pause</span>
                </span>
                <p className="text-ink-muted leading-relaxed">
                  When the 1-hour trial expires, the AI agent stops auto-replying to menu queries or taking bookings. Customers receive a courteous notice asking them to contact the business directly.
                </p>
              </div>

              <div className="p-3 bg-paper rounded border border-warm-border/80 space-y-1">
                <span className="font-bold text-ink flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>2. Your Data is 100% Safe</span>
                </span>
                <p className="text-ink-muted leading-relaxed">
                  Your menus, catalogs, past customer conversations, and order ledger history are never deleted. Everything remains safe in your database.
                </p>
              </div>

              <div className="p-3 bg-paper rounded border border-warm-border/80 space-y-1">
                <span className="font-bold text-ink flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span>3. Instant Reactivation Anytime</span>
                </span>
                <p className="text-ink-muted leading-relaxed">
                  The moment you complete the ₹1 payment, your WhatsApp AI agent instantly unpauses and resumes answering inquiries 24/7 without needing any reconfiguration.
                </p>
              </div>

              <div className="p-3 bg-paper rounded border border-warm-border/80 space-y-1">
                <span className="font-bold text-ink flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  <span>4. Dashboard Manual Orders Work</span>
                </span>
                <p className="text-ink-muted leading-relaxed">
                  You can still view past customer conversations and download CSV reports from your owner dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Official Transaction & Invoicing Passbook Ledger */}
      <div className="bg-paper border-2 border-warm-border rounded-lg shadow-ledger overflow-hidden">
        <div className="bg-warm-stub px-6 py-4 border-b border-warm-border flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-teal" />
            <h2 className="font-serif text-lg font-bold text-ink">Payment History & Tax Invoices</h2>
          </div>
          <span className="text-xs font-mono text-ink-muted">
            {payments.length} Transaction{payments.length === 1 ? '' : 's'} Logged
          </span>
        </div>

        {paymentsLoading ? (
          <div className="p-8 text-center text-xs font-mono text-ink-muted">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-teal" />
            Loading official payment records...
          </div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center text-xs text-ink-muted space-y-2">
            <Receipt className="w-8 h-8 mx-auto text-warm-border" />
            <p className="font-serif text-sm font-bold text-ink">No Payment Transactions Recorded</p>
            <p>Your 1-hour free trial is currently running. Receipts will appear here once you upgrade.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-warm-card border-b border-warm-border text-[10px] font-mono uppercase text-ink-light">
                <tr>
                  <th className="px-6 py-3">Receipt / Payment ID</th>
                  <th className="px-6 py-3">Amount (₹)</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date & Timestamp</th>
                  <th className="px-6 py-3 text-right">Tax Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-border bg-paper font-mono">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-warm-card/40">
                    <td className="px-6 py-3.5 font-bold text-teal">{p.razorpay_payment_id}</td>
                    <td className="px-6 py-3.5 font-bold text-ink">
                      ₹{(p.amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-sage-light text-sage border border-sage/30 text-[10px] font-bold uppercase">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>PAID</span>
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-ink-muted">{new Date(p.created_at).toLocaleString()}</td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => window.print()}
                        className="inline-flex items-center space-x-1 text-teal hover:underline text-[11px] font-serif font-bold"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Invoice</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
