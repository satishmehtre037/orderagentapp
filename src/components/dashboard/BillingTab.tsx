import React, { useState, useEffect } from 'react';
import { supabaseClient } from '../../lib/supabase/client';
import { PaymentEvent, BusinessCategory } from '../../types';
import { getCategoryDisplayMetadata } from '../../lib/constants/categoryPresets';
import { PLANS, TRIAL_DAYS, formatRupees, isPaidPlan } from '../../config/plans';
import {
  CreditCard,
  Sparkles,
  CheckCircle2,
  AlertCircle,
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
  AlertTriangle,
  Building2,
  Trash2,
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
  const meta = getCategoryDisplayMetadata(category);
  const [payments, setPayments] = useState<PaymentEvent[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true);
      const res = await fetch(`/api/business?businessId=${encodeURIComponent(businessId)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        if (typeof window !== 'undefined') {
          localStorage.clear();
        }
        await supabaseClient.auth.signOut();
        window.location.href = '/onboarding';
      }
    } catch (err) {
      console.error('Delete account error:', err);
    } finally {
      setDeleting(false);
    }
  };

  // Live countdown for the free trial.
  const [countdownText, setCountdownText] = useState('Calculating...');
  const [isTrialEnded, setIsTrialEnded] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      if (!trialEndDateStr) {
        setCountdownText('Trial length unknown');
        return;
      }

      const end = new Date(trialEndDateStr).getTime();
      const diffMs = end - Date.now();

      if (diffMs <= 0) {
        setIsTrialEnded(true);
        setCountdownText('Trial Expired');
      } else {
        setIsTrialEnded(false);
        // The trial is 30 days, so lead with days once there is more than one.
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
        if (days > 0) {
          setCountdownText(`${days}d ${hours}h ${mins}m`);
        } else if (hours > 0) {
          setCountdownText(`${hours}h ${mins}m ${secs < 10 ? '0' : ''}${secs}s`);
        } else {
          setCountdownText(`${mins}m ${secs < 10 ? '0' : ''}${secs}s`);
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [trialEndDateStr]);

  const isActive = subscriptionStatus === 'active' || isPaidPlan(plan);
  const isExpired = subscriptionStatus === 'expired' || (!isActive && isTrialEnded);

  // Fetch Payment History
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
  }, [businessId]);

  // Load Razorpay Checkout Script Dynamically
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
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

  /**
   * Launches Razorpay checkout.
   *
   * This used to post its own `amount` with the order and, if verification
   * failed, call handlePaymentSuccessFallback() — which wrote
   * subscription_status: 'active' straight into the businesses table from the
   * browser. A forged signature, or simply a network error, therefore granted a
   * Pro subscription. The server now prices the plan and is the only thing that
   * can activate it.
   */
  const handleUpgradeClick = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || typeof window.Razorpay === 'undefined') {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      const selectedPlan = selectedBillingCycle === 'annual' ? PLANS.annual_9990 : PLANS.monthly_999;
      const planLabel = `${selectedPlan.label} (${formatRupees(selectedPlan.amountPaise)}/${selectedPlan.period})`;

      console.log(`[Frontend Checkout] Requesting an order for plan ${selectedPlan.key}...`);
      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // No amount: the server prices the plan from src/config/plans.ts.
          plan: selectedPlan.key,
          businessId,
        }),
      });

      let orderData: any = {};
      try {
        orderData = await orderRes.json();
      } catch (jsonErr) {
        throw new Error('Payment service temporarily unavailable. Please try again.');
      }

      if (!orderRes.ok || !orderData.order_id) {
        throw new Error(orderData.error || 'Failed to initialize the Razorpay payment order');
      }

      if (!orderData.key_id) {
        throw new Error('Payments are not configured on this server (no Razorpay key returned).');
      }

      const chargedPaise = Math.round(Number(orderData.amount));

      const options = {
        key: orderData.key_id,
        amount: chargedPaise,
        currency: orderData.currency || 'INR',
        name: 'WebcoreStudio',
        description: `${planLabel} — WhatsApp AI Agent Plan`,
        order_id: orderData.order_id,
        notes: {
          business_id: businessId,
        },
        theme: {
          color: '#d8707d',
        },
        // Enable UPI Intent inside mobile browsers / WebViews
        webview_intent: true,
        // Explicitly force full display of all payment options with UPI prioritized
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
          console.log('[Razorpay Checkout] Payment received, verifying signature server-side...');
          setLoading(true);

          try {
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                business_id: businessId,
                plan: selectedPlan.key,
              }),
            });

            let verifyData: any = {};
            try {
              verifyData = await verifyRes.json();
            } catch (vErr) {
              verifyData = {};
            }

            if (verifyRes.ok && verifyData.success && verifyData.activated) {
              setSuccessMsg(
                `Payment of ${formatRupees(Number(verifyData.amount) || chargedPaise)} verified. Your Pro Plan is active.`
              );
              fetchPaymentHistory();
              if (onSubscriptionUpdated) onSubscriptionUpdated();
            } else {
              // The payment may well have gone through — only the activation did
              // not. Say so, with the payment id, instead of silently granting
              // access from the browser.
              setErrorMsg(
                `${
                  verifyData.error || 'We could not confirm this payment.'
                } Payment id ${response.razorpay_payment_id} — please send this to support if you were charged.`
              );
              fetchPaymentHistory();
            }
          } catch (err: any) {
            console.error('Verification error:', err);
            setErrorMsg(
              `We could not reach the server to confirm your payment. Payment id ${response.razorpay_payment_id} — please send this to support if you were charged.`
            );
          } finally {
            setLoading(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', function (response: any) {
        console.warn('[Razorpay] Payment failed:', response);
        setErrorMsg(`Payment Failed: ${response.error?.description || response.error?.reason || 'Transaction declined'}`);
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

  return (
    <div className="space-y-6">
      {/* Success Notification Banner */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-xs text-emerald-900">{successMsg}</h4>
              <p className="text-[11px] text-emerald-700">
                Official payment receipt recorded and WhatsApp agent uninterrupted.
              </p>
            </div>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 bg-white border border-emerald-300 rounded-md text-emerald-800 flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>VERIFIED</span>
          </span>
        </div>
      )}

      {/* Trial Expired Alert Banner */}
      {isExpired && !isActive && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-xs text-amber-900">Free Trial Expired — WhatsApp Agent Paused</h4>
              <p className="text-[11px] text-amber-700">
                Upgrade for {formatRupees(PLANS.monthly_999.amountPaise)}/month to resume automated customer orders,
                voice notes, and booking capture.
              </p>
            </div>
          </div>
          <button
            onClick={handleUpgradeClick}
            className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-medium rounded-lg shadow-sm transition-colors whitespace-nowrap"
          >
            Renew Now — {formatRupees(PLANS.monthly_999.amountPaise)}
          </button>
        </div>
      )}

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-700 font-medium ml-2">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Billing Card */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
        {/* Header Toolbar */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Subscription Plans & Billing</h2>
              <p className="text-xs text-slate-500">Secure 256-bit encrypted checkout via Razorpay</p>
            </div>
          </div>

          <div>
            <span
              className={`text-xs px-3 py-1 rounded-full font-medium flex items-center space-x-1.5 ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : isExpired
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              <span>
                {isActive
                  ? 'Pro Active'
                  : isExpired
                  ? 'Trial Expired'
                  : `Free Trial: ${countdownText}`}
              </span>
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-8 space-y-8">
          {/* Cycle Toggle (Monthly vs Annual) */}
          <div className="flex items-center justify-center">
            <div className="bg-slate-100 p-1 rounded-xl flex items-center space-x-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedBillingCycle('monthly')}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                  selectedBillingCycle === 'monthly'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setSelectedBillingCycle('annual')}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                  selectedBillingCycle === 'annual'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Annual Billing</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.5 rounded">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Free Trial Card */}
            <div className="border border-slate-200 rounded-xl p-6 bg-slate-50/60 space-y-5">
              <div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Evaluation</span>
                <h3 className="text-lg font-semibold text-slate-900 mt-1">{TRIAL_DAYS}-Day Free Trial</h3>
                <p className="text-xs text-slate-500 mt-1">Test all WhatsApp AI automation features risk-free.</p>
              </div>

              <div className="flex items-baseline space-x-1">
                <span className="text-3xl font-bold text-slate-900">₹0</span>
                <span className="text-xs text-slate-500">/ {TRIAL_DAYS} days</span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Automated WhatsApp order capture</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Groq Whisper Voice Note transcription</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>In-chat UPI payment pay links</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Branded PDF Invoice generator</span>
                </li>
              </ul>

              <div className="pt-2">
                <div className="w-full py-2.5 px-4 rounded-lg bg-slate-200/80 text-slate-600 text-xs font-medium text-center">
                  {isActive ? 'Trial Completed' : isExpired ? 'Expired' : `${countdownText} remaining`}
                </div>
              </div>
            </div>

            {/* Pro Plan Card */}
            <div className="border-2 border-slate-900 rounded-xl p-6 bg-white shadow-md space-y-5 relative">
              <div className="absolute -top-3 right-6 bg-slate-900 text-white text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                Most Popular
              </div>

              <div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Unlimited Commercial</span>
                <h3 className="text-lg font-semibold text-slate-900 mt-1">Agento AI Pro Plan</h3>
                <p className="text-xs text-slate-500 mt-1">Complete autonomous WhatsApp AI staff for modern businesses.</p>
              </div>

              <div className="flex items-baseline space-x-1">
                <span className="text-3xl font-bold text-slate-900">
                  {formatRupees(
                    selectedBillingCycle === 'annual' ? PLANS.annual_9990.amountPaise : PLANS.monthly_999.amountPaise
                  )}
                </span>
                <span className="text-xs text-slate-500">
                  {selectedBillingCycle === 'annual' ? '/ year' : '/ month'}
                </span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-700">
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span><strong>Unlimited</strong> AI WhatsApp Conversations</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Voice Note (Audio) & Hinglish Intelligence</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Instant Dynamic UPI Pay Link generation</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Instant Branded PDF Invoices & Booking Slips</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Automated Re-Engagement & Renewal Reminders</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>24/7 Zero Downtime Server Hosting</span>
                </li>
              </ul>

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={handleUpgradeClick}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>
                    {loading
                      ? 'Opening Checkout...'
                      : isActive
                      ? 'Renew / Extend Subscription'
                      : `Upgrade Now — ${formatRupees(
                          selectedBillingCycle === 'annual'
                            ? PLANS.annual_9990.amountPaise
                            : PLANS.monthly_999.amountPaise
                        )}/${selectedBillingCycle === 'annual' ? 'yr' : 'mo'}`}
                  </span>
                </button>

                {/*
                  A "Test Sandbox Mode / Instant Test Activate" button used to sit
                  here. It called the client-side activation path, so any visitor
                  could switch their own account to Pro without paying — and it
                  shipped in the production dashboard. Use a Razorpay test-mode key
                  pair to exercise checkout instead.
                */}
                <p className="text-[10px] text-slate-400 text-center">
                  Subscriptions are activated by our server after Razorpay confirms the payment.
                </p>
              </div>
            </div>
          </div>

          {/* Payment History Table */}
          <div className="pt-6 border-t border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Payment & Invoice History</h3>
                <p className="text-xs text-slate-500">Verified Razorpay transactions</p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-x-auto no-scrollbar">
              {paymentsLoading ? (
                <div className="p-6 text-center text-xs text-slate-500">Loading payment records...</div>
              ) : payments.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No payment transactions recorded yet.
                </div>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                    <tr>
                      <th className="px-4 py-3">Payment ID</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-mono font-medium text-slate-900">
                          {p.razorpay_payment_id || p.id.slice(0, 10)}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {new Date(p.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          ₹{(p.amount / 100).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px] font-medium">
                            <CheckCircle2 className="w-3 h-3" />
                            <span className="capitalize">{p.status}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Danger Zone / Delete Account */}
          <div className="bg-rose-500/5 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <h3 className="text-sm font-bold text-rose-950 dark:text-rose-300">Danger Zone: Delete {meta.entityName}</h3>
                </div>
                <p className="text-xs text-rose-700/80 dark:text-rose-400/80 mt-1">
                  Permanently delete this {meta.label.toLowerCase()} profile, {meta.itemDescription}, and reset your account to fresh setup.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl transition shadow-sm flex items-center space-x-1.5 whitespace-nowrap self-start sm:self-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Account & Reset</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4 text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/60 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete {meta.entityName}?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">This action is irreversible and permanent.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-rose-50 dark:bg-rose-950/30 p-3 rounded-xl border border-rose-200 dark:border-rose-900/50">
              ⚠️ Are you sure you want to permanently delete your {meta.label.toLowerCase()} profile? All {meta.itemDescription} will be wiped.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleting ? 'Deleting...' : 'Yes, Delete Everything'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
