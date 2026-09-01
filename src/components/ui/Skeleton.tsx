'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/* =========================================================================
   Skeleton primitives with smooth shimmer animation
   ========================================================================= */
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Override width, e.g. "w-24" */
  width?: string;
  /** Override height, e.g. "h-4" */
  height?: string;
}

export function Skeleton({ className, width, height, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded bg-surface-subtle',
        'after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer after:bg-gradient-to-r after:from-transparent after:via-white/10 after:to-transparent',
        width || 'w-full',
        height || 'h-4',
        className,
      )}
      {...props}
    />
  );
}

export interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="h-3"
          width={i === lines - 1 ? 'w-3/4' : 'w-full'}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-line bg-surface p-4 space-y-3',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <Skeleton width="w-10" height="h-10" className="rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton height="h-3" width="w-1/3" />
          <Skeleton height="h-3" width="w-1/2" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}

export function ConversationThreadSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-start gap-2.5 p-3 rounded-lg border border-line/40 bg-surface-subtle/30', className)}>
      <Skeleton width="w-8" height="h-8" className="rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5 min-w-0">
        <div className="flex items-center justify-between">
          <Skeleton width="w-24" height="h-3" />
          <Skeleton width="w-10" height="h-2.5" />
        </div>
        <Skeleton width="w-full" height="h-2.5" />
      </div>
    </div>
  );
}

export function LedgerRowSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-between p-3.5 border-b border-line bg-surface', className)}>
      <div className="flex items-center gap-3">
        <Skeleton width="w-9" height="h-9" className="rounded-lg" />
        <div className="space-y-1.5">
          <Skeleton width="w-32" height="h-3.5" />
          <Skeleton width="w-20" height="h-2.5" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Skeleton width="w-16" height="h-5" className="rounded" />
        <Skeleton width="w-20" height="h-4" />
      </div>
    </div>
  );
}

export function FormSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('p-6 bg-surface border border-line rounded-xl space-y-6', className)}>
      <Skeleton width="w-1/3" height="h-6" />
      <div className="space-y-3">
        <Skeleton width="w-1/4" height="h-4" />
        <Skeleton width="w-full" height="h-10" className="rounded-lg" />
      </div>
      <div className="space-y-3">
        <Skeleton width="w-1/4" height="h-4" />
        <Skeleton width="w-full" height="h-10" className="rounded-lg" />
      </div>
    </div>
  );
}


