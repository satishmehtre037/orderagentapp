'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/* =========================================================================
   Spinner — accessible loading indicator
   ========================================================================= */
export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

const SPINNER_SIZE: Record<string, string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export function Spinner({ size = 'md', label = 'Loading…', className }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('inline-flex items-center gap-2', className)}
    >
      <Loader2
        className={cn('animate-spin text-fg-muted', SPINNER_SIZE[size])}
        aria-hidden
      />
      {label && <span className="sr-only">{label}</span>}
    </div>
  );
}
