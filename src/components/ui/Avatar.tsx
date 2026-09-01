'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string;
  src?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  status?: 'online' | 'offline' | 'busy';
}

const SIZE_STYLES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-9 w-9 text-xs',
  lg: 'h-11 w-11 text-sm font-semibold',
};

const STATUS_STYLES = {
  online: 'bg-success',
  offline: 'bg-fg-subtle',
  busy: 'bg-warning',
};

function getInitials(name?: string): string {
  if (!name) return '';
  const clean = name.trim();
  if (!clean) return '';
  
  // If phone number
  if (/^\+?\d+$/.test(clean)) {
    return clean.slice(-2);
  }

  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  src,
  size = 'md',
  status,
  className,
  ...props
}) => {
  const initials = getInitials(name);

  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-full bg-surface-subtle font-mono font-medium text-fg border border-line select-none overflow-hidden',
        SIZE_STYLES[size],
        className
      )}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          className="h-full w-full object-cover"
        />
      ) : initials ? (
        <span>{initials}</span>
      ) : (
        <User className="h-1/2 w-1/2 text-fg-muted" />
      )}

      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-surface',
            STATUS_STYLES[status]
          )}
          aria-hidden
        />
      )}
    </div>
  );
};
