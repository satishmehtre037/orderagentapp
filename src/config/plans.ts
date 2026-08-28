/**
 * Subscription plan catalogue — the single source of truth for pricing.
 *
 * Prices used to be defined independently in six places and they had drifted
 * apart: /api/billing charged 100 paise (₹1) monthly and 1000 paise (₹10)
 * annually, /api/create-order defaulted to 99900 (₹999), routes/billing.ts
 * quoted 99900 and wrote plan 'monthly_999', while the dashboard displayed
 * "₹1/month" and posted its own amount with the order. Whatever the client sent
 * was what the customer was charged.
 *
 * Every price now comes from here, server-side. The client picks a plan *key*;
 * it never sends an amount.
 */

export type PlanKey = 'monthly_999' | 'annual_9990';

export interface Plan {
  key: PlanKey;
  /** Charge in paise. Razorpay works in the smallest currency unit. */
  amountPaise: number;
  currency: 'INR';
  /** Days of access one payment buys. */
  durationDays: number;
  label: string;
  /** Shown next to the price, e.g. "₹999 / month". */
  period: string;
}

export const PLANS: Record<PlanKey, Plan> = {
  monthly_999: {
    key: 'monthly_999',
    amountPaise: 99900,
    currency: 'INR',
    durationDays: 30,
    label: 'Pro Monthly',
    period: 'month',
  },
  annual_9990: {
    key: 'annual_9990',
    amountPaise: 999000,
    currency: 'INR',
    durationDays: 365,
    label: 'Annual Saver',
    period: 'year',
  },
};

export const DEFAULT_PLAN_KEY: PlanKey = 'monthly_999';

/** Free trial length. Must match businesses.trial_end_date's column default. */
export const TRIAL_DAYS = 30;

/**
 * Plan keys that earlier builds wrote into businesses.plan. Existing rows still
 * carry them, so both the paywall check and the renewal date need to understand
 * them. New payments never create them.
 */
const LEGACY_PLAN_KEYS: Record<string, PlanKey> = {
  monthly_1: 'monthly_999',
  annual_10: 'annual_9990',
  monthly: 'monthly_999',
  annual: 'annual_9990',
};

/** Resolves a plan key from untrusted input. Returns null if it is not a real plan. */
export function resolvePlan(key: unknown): Plan | null {
  if (typeof key !== 'string') return null;
  const trimmed = key.trim();
  if (trimmed in PLANS) return PLANS[trimmed as PlanKey];
  const legacy = LEGACY_PLAN_KEYS[trimmed];
  return legacy ? PLANS[legacy] : null;
}

/** ISO timestamp for when access bought now would lapse. */
export function accessEndDate(plan: Plan, from: Date = new Date()): string {
  return new Date(from.getTime() + plan.durationDays * 24 * 60 * 60 * 1000).toISOString();
}

/** ₹999 — for display only. Never derive a charge from this. */
export function formatRupees(amountPaise: number): string {
  return `₹${(amountPaise / 100).toLocaleString('en-IN')}`;
}

/** True if businesses.plan names a paid plan (including the legacy keys). */
export function isPaidPlan(planKey?: string | null): boolean {
  return resolvePlan(planKey) !== null;
}
