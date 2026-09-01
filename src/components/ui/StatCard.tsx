'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useCountUp } from '@/hooks/useCountUp';

/* =========================================================================
   StatCard — Linear/Stripe style KPI metric card with animated count
   ========================================================================= */
export interface StatCardProps {
  label: string;
  value: string | number;
  /** e.g. "+12%" or "−3.2%" */
  delta?: string;
  deltaTone?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  hint?: string;
  loading?: boolean;
  animate?: boolean;
  className?: string;
}

const DELTA_TONE: Record<string, string> = {
  positive: 'text-success bg-success-subtle border-success-border',
  negative: 'text-danger bg-danger-subtle border-danger-border',
  neutral: 'text-fg-muted bg-surface-subtle border-line',
};

export function StatCard({
  label,
  value,
  delta,
  deltaTone = 'neutral',
  icon,
  hint,
  loading = false,
  animate = true,
  className,
}: StatCardProps) {
  const isPureNumber = typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value));
  const animatedValue = useCountUp(isPureNumber && animate ? value : 0);
  const displayVal = isPureNumber && animate ? animatedValue : value;

  return (
    <div
      className={cn(
        'group relative rounded-xl border border-line bg-surface p-4 transition-all duration-150',
        'hover:border-line-strong hover:bg-surface-raised/50 shadow-xs',
        className,
      )}
    >
      {/* Header row: label + icon */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-fg-muted uppercase tracking-wider">{label}</span>
        {icon && (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-subtle text-fg-subtle border border-line group-hover:text-accent transition-colors [&>svg]:h-3.5 [&>svg]:w-3.5" aria-hidden>
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      {loading ? (
        <div className="mt-2.5 h-8 w-24 animate-pulse rounded bg-surface-subtle" />
      ) : (
        <div className="mt-2 flex items-baseline justify-between gap-2">
          <span className="text-2xl font-bold tabular-nums text-fg font-mono tracking-tight">
            {displayVal}
          </span>
          {delta && (
            <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold border', DELTA_TONE[deltaTone])}>
              {delta}
            </span>
          )}
        </div>
      )}

      {/* Hint */}
      {hint && (
        <p className="mt-1.5 text-[11px] text-fg-subtle leading-tight">{hint}</p>
      )}
    </div>
  );
}

