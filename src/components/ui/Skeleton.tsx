'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/* =========================================================================
   Skeleton primitives — replaces SkeletonLoaders.tsx
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
        'animate-pulse rounded bg-surface-subtle',
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
        'rounded-lg border border-line bg-surface p-4 space-y-3',
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
