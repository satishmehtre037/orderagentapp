'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/* =========================================================================
   StatCard — dashboard KPI tile
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
  className?: string;
}

const DELTA_TONE: Record<string, string> = {
  positive: 'text-success',
  negative: 'text-danger',
  neutral: 'text-fg-muted',
};

export function StatCard({
  label,
  value,
  delta,
  deltaTone = 'neutral',
  icon,
  hint,
  loading = false,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-line bg-surface px-4 py-3',
        className,
      )}
    >
      {/* Header row: label + icon */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-fg-muted">{label}</span>
        {icon && (
          <span className="shrink-0 text-fg-subtle [&>svg]:h-4 [&>svg]:w-4" aria-hidden>
            {icon}
          </span>
        )}
      </div>

      {/* Value */}
      {loading ? (
        <div className="mt-2 h-7 w-20 animate-pulse rounded bg-surface-subtle" />
      ) : (
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-xl font-bold tabular-nums text-fg font-mono">
            {value}
          </span>
          {delta && (
            <span className={cn('text-xs font-medium', DELTA_TONE[deltaTone])}>
              {delta}
            </span>
          )}
        </div>
      )}

      {/* Hint */}
      {hint && (
        <p className="mt-1 text-[11px] text-fg-subtle">{hint}</p>
      )}
    </div>
  );
}
