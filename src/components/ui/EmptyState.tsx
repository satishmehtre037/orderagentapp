'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/* =========================================================================
   EmptyState — centered placeholder for zero-data views
   ========================================================================= */
export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-surface/40 py-12 px-6 text-center shadow-xs',
        className,
      )}
    >
      {icon && (
        <div
          className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-subtle border border-line text-fg-subtle shadow-xs [&>svg]:h-5 [&>svg]:w-5"
          aria-hidden
        >
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-fg">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-xs text-fg-muted leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

