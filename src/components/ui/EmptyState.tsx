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
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-line py-12 px-6 text-center',
        className,
      )}
    >
      {icon && (
        <span className="mb-3 text-fg-subtle [&>svg]:h-10 [&>svg]:w-10" aria-hidden>
          {icon}
        </span>
      )}
      <h3 className="text-sm font-semibold text-fg">{title}</h3>
      {description && (
        <p className="mt-1 max-w-xs text-xs text-fg-muted">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
