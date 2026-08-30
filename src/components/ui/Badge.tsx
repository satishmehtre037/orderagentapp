'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type BadgeTone =
  | 'neutral'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

const TONE: Record<BadgeTone, string> = {
  neutral: 'bg-surface-subtle text-fg-muted border-line',
  accent: 'bg-accent-subtle text-accent border-accent-border',
  success: 'bg-success-subtle text-success-fg border-success-border',
  warning: 'bg-warning-subtle text-warning-fg border-warning-border',
  danger: 'bg-danger-subtle text-danger-fg border-danger-border',
  info: 'bg-info-subtle text-info-fg border-info-border',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  /** Adds a filled dot — useful for live/idle states in dense tables. */
  dot?: boolean;
  icon?: React.ReactNode;
}

export function Badge({
  tone = 'neutral',
  dot,
  icon,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm border px-2 py-0.5',
        'text-xs font-medium leading-5',
        TONE[tone],
        className,
      )}
      {...props}
    >
      {dot ? (
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-current"
          aria-hidden
        />
      ) : null}
      {icon ? (
        <span className="shrink-0 [&>svg]:h-3 [&>svg]:w-3" aria-hidden>
          {icon}
        </span>
      ) : null}
      {children}
    </span>
  );
}

/**
 * Maps the status strings this app actually stores in Supabase onto tones.
 *
 * Before this existed, six components each carried their own `getStatusBadge`
 * switch, and the same status could render a different colour depending on
 * which tab you were looking at.
 */
const STATUS_TONE: Record<string, BadgeTone> = {
  // Appointments & bookings
  confirmed: 'success',
  completed: 'success',
  attended: 'success',
  pending: 'warning',
  scheduled: 'info',
  rescheduled: 'warning',
  cancelled: 'danger',
  canceled: 'danger',
  'no-show': 'danger',
  no_show: 'danger',
  missed: 'danger',

  // Payments & billing
  paid: 'success',
  captured: 'success',
  unpaid: 'warning',
  due: 'warning',
  overdue: 'danger',
  failed: 'danger',
  refunded: 'neutral',
  trial: 'info',
  expired: 'danger',

  // Messaging & delivery
  sent: 'info',
  delivered: 'success',
  read: 'success',
  queued: 'neutral',
  replied: 'accent',

  // Records & leads
  active: 'success',
  inactive: 'neutral',
  archived: 'neutral',
  draft: 'neutral',
  new: 'info',
  hot: 'danger',
  warm: 'warning',
  cold: 'neutral',
  converted: 'success',
  lost: 'neutral',

  // Documents & compliance
  verified: 'success',
  processed: 'success',
  processing: 'info',
  uploaded: 'info',
  rejected: 'danger',
  filed: 'success',
};

export function statusTone(status?: string | null): BadgeTone {
  if (!status) return 'neutral';
  return STATUS_TONE[status.trim().toLowerCase()] ?? 'neutral';
}

/** Title-cases a snake_case / kebab-case status for display. */
function humanize(status: string): string {
  return status
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface StatusBadgeProps extends Omit<BadgeProps, 'tone' | 'children'> {
  status?: string | null;
  /** Overrides the automatic label. */
  label?: string;
  fallback?: string;
}

export function StatusBadge({
  status,
  label,
  fallback = 'Unknown',
  ...props
}: StatusBadgeProps) {
  return (
    <Badge tone={statusTone(status)} {...props}>
      {label ?? (status ? humanize(status) : fallback)}
    </Badge>
  );
}
