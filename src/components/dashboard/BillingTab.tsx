'use client';

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
  IndianRupee,
  Check,
  Lock,
  Clock,
  Printer,
  Trash2,
} from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  StatCard,
  StatusBadge,
  DataTable,
  Modal,
  type Column,
} from '../ui';

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
    const targetBizId = businessId || (typeof window !== 'undefined' ? localStorage.getItem('biz_id') : '');
    if (!targetBizId) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/business?businessId=${encodeURIComponent(targetBizId)}`, {
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

  const [countdownText, setCountdownText] = useState('Calculating...');
  const [isTrialEnded, setIsTrialEnded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
        const mins = Math.floor((diffMs / 1000 / 60) % 60);

        if (days > 1) {
          setCountdownText(`${days} days, ${hours} hours remaining`);
        } else if (days === 1) {
          setCountdownText(`1 day, ${hours} hours remaining`);
        } else {
          setCountdownText(`${hours}h ${mins}m remaining`);
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [trialEndDateStr]);

  const loadPayments = async () => {
    try {
      setPaymentsLoading(true);
      const res = await fetch(`/api/billing/history?businessId=${encodeURIComponent(businessId)}`);
      const data = await res.json();
      if (data.payments) {
        setPayments(data.payments);
      }
    } catch (err) {
      console.error('Failed to load payments history:', err);
    } finally {
      setPaymentsLoading(false);
    }
  };

  useEffect(() => {
    if (businessId) {
      loadPayments();
    }
  }, [businessId]);

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const res = await fetch('/api/billing/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          plan: selectedBillingCycle === 'annual' ? 'annual_9999' : 'monthly_999',
        }),
      });

      const orderData = await res.json();
      if (!res.ok) throw new Error(orderData.error || 'Failed to initiate checkout.');

      // Sanitize prefill values so Razorpay does not reject them
      const rawContact = typeof window !== 'undefined' ? localStorage.getItem('biz_phone') || '' : '';
      const cleanContact = rawContact.replace(/\D/g, '').slice(-10);
      const prefillContact = cleanContact.length === 10 ? cleanContact : undefined;

      const rawEmail = typeof window !== 'undefined' ? localStorage.getItem('biz_email') || '' : '';
      const prefillEmail = rawEmail.includes('@') ? rawEmail.trim() : undefined;

      // 100% default Razorpay Standard Checkout — no custom config
      const options: any = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_TQ8rV6xWi4mag7',
        amount: orderData.amount,
        currency: 'INR',
        order_id: orderData.orderId,
        name: 'WebCore Studios',
        description: selectedBillingCycle === 'annual'
          ? 'Annual Pro Plan — ₹9,999/year'
          : 'Monthly Pro Plan — ₹999/month',
        prefill: {
          ...(prefillEmail ? { email: prefillEmail } : {}),
          ...(prefillContact ? { contact: prefillContact } : {}),
        },
        notes: {
          business_id: businessId || '',
          plan: selectedBillingCycle === 'annual' ? 'annual_9999' : 'monthly_999',
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch('/api/billing/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                businessId,
              }),
            });

            if (verifyRes.ok) {
              setSuccessMsg('🎉 Payment successful! Pro Plan activated.');
              if (onSubscriptionUpdated) onSubscriptionUpdated();
              loadPayments();
            } else {
              const verifyErr = await verifyRes.json().catch(() => ({}));
              setErrorMsg(verifyErr.error || 'Payment verification failed.');
            }
          } catch (e: any) {
            setErrorMsg('Payment verification failed. Please contact support.');
          } finally {
            setLoading(false);
          }
        },
      };

      const loadRazorpayScript = (): Promise<boolean> => {
        return new Promise((resolve) => {
          if (typeof window !== 'undefined' && window.Razorpay) {
            resolve(true);
            return;
          }
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.async = true;
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
      };

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || typeof window === 'undefined' || !window.Razorpay) {
        throw new Error('Unable to load Razorpay payment gateway. Please check your internet connection and try again.');
      }

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp: any) {
        setErrorMsg(`Payment failed: ${resp.error?.description || 'Transaction was not completed.'}`);
      });
      rzp.open();
    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMsg(err.message || 'Error creating payment.');
    } finally {
      setLoading(false);
    }
  };

  const isPro = subscriptionStatus === 'active' || isPaidPlan(plan);

  const paymentColumns: Column<PaymentEvent>[] = [
    {
      key: 'created_at',
      header: 'Date & Time',
      primary: true,
      render: (p) => (
        <span className="font-mono text-xs text-fg">
          {new Date(p.created_at).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'razorpay_payment_id',
      header: 'Payment Reference',
      render: (p) => (
        <span className="font-mono text-xs text-fg-muted">
          {p.razorpay_payment_id || 'RZP-DIRECT-UPI'}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount Paid',
      render: (p) => (
        <span className="font-mono font-bold text-fg">
          ₹{(p.amount / 100).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'right',
      render: (p) => <StatusBadge status={p.status === 'success' ? 'paid' : 'failed'} />,
    },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Header */}
      <Card>
        <CardHeader className="flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-accent" />
              <span>Subscription & Billing Control</span>
            </CardTitle>
            <CardDescription>
              Manage your Pro Plan, trial limits, automated WhatsApp credits, and tax invoices
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      {/* Messages */}
      {successMsg && (
        <div className="p-3.5 bg-success-subtle border border-success-border text-success rounded-md text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 bg-danger-subtle border border-danger-border text-danger rounded-md text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Current Plan & Status KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Current Subscription"
          value={isPro ? 'Pro Active' : isTrialEnded ? 'Trial Expired' : 'Free Trial'}
          deltaTone={isPro ? 'positive' : isTrialEnded ? 'negative' : 'neutral'}
          icon={<Zap className="text-accent" />}
          hint={isPro ? 'Unlimited WhatsApp AI auto-replies' : `${TRIAL_DAYS}-day full feature trial`}
        />
        <StatCard
          label="Trial Status / Expiration"
          value={countdownText}
          deltaTone={isTrialEnded ? 'negative' : 'neutral'}
          icon={<Clock className="text-warning" />}
          hint={isTrialEnded ? 'Upgrade to keep WhatsApp active' : 'Full access to all modules'}
        />
        <StatCard
          label="Plan Pricing"
          value={`₹${PLANS.monthly_999.amountPaise / 100} / mo`}
          icon={<IndianRupee className="text-success" />}
          hint="Zero commission on customer orders"
        />
      </div>

      {/* Pro Plan Upgrade Container */}
      {!isPro && (
        <Card className="border-accent/40 bg-accent-subtle/10">
          <CardHeader className="flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-accent text-accent-fg">
                  Recommended
                </span>
                <CardTitle className="text-base">Agento AI Pro Staff Plan</CardTitle>
              </div>
              <CardDescription className="mt-1">
                Everything you need to automate orders, appointments, document checklists, and fee collection 24/7 on WhatsApp.
              </CardDescription>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-2xl font-bold text-fg font-mono">
                  ₹{PLANS.monthly_999.amountPaise / 100}
                </div>
                <div className="text-[10px] text-fg-muted">per month • cancel anytime</div>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={handleUpgrade}
                loading={loading}
                leftIcon={<Zap className="w-4 h-4" />}
              >
                Upgrade to Pro
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-4 border-t border-line text-xs text-fg">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success shrink-0" />
                <span>Unlimited 24/7 WhatsApp AI replies</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success shrink-0" />
                <span>Automated UPI payment links & PDFs</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success shrink-0" />
                <span>Continuous background cron engines</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History DataTable */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Payment & Invoice History</CardTitle>
          <CardDescription>Official GST-compliant receipts and transaction records</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          <DataTable
            columns={paymentColumns}
            rows={payments}
            getRowKey={(p) => p.id}
            loading={paymentsLoading}
            empty={
              <div className="py-10 text-center text-xs text-fg-muted">
                No past billing transactions on record.
              </div>
            }
          />
        </CardContent>
      </Card>

      {/* Danger Zone: Delete Business Account */}
      <Card className="border-danger-border bg-danger-subtle/10">
        <CardHeader className="flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-sm text-danger flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              <span>Danger Zone: Delete Account & Data</span>
            </CardTitle>
            <CardDescription>
              Permanently purge this business record, catalog, order ledger, and disconnect WhatsApp bot.
            </CardDescription>
          </div>

          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Delete Account
          </Button>
        </CardHeader>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Permanently Delete Account?"
        description="This action cannot be undone. All your business configuration, transactions, and WhatsApp bot links will be permanently deleted."
        icon={<Trash2 className="text-danger" />}
        size="sm"
        mobile="center"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteAccount}
              loading={deleting}
            >
              Yes, Delete Permanently
            </Button>
          </>
        }
      >
        <p className="text-xs text-fg-muted">
          Are you sure you want to proceed? You will be signed out and redirected to onboarding.
        </p>
      </Modal>
    </div>
  );
};
