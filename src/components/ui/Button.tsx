'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'success'
  | 'link';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    'border border-transparent bg-accent text-accent-fg hover:bg-accent-hover active:bg-accent-active',
  secondary:
    'border border-line bg-surface text-fg hover:bg-surface-hover hover:border-line-strong active:bg-surface-active',
  ghost:
    'border border-transparent text-fg-muted hover:bg-surface-hover hover:text-fg active:bg-surface-active',
  danger:
    'border border-transparent bg-danger text-white hover:bg-danger-hover dark:text-base',
  success:
    'border border-transparent bg-success text-white hover:bg-success-hover dark:text-base',
  link: 'border border-transparent text-accent underline-offset-4 hover:underline p-0 h-auto',
};

/**
 * Heights are taller on mobile than desktop on purpose: phones get a 44px
 * minimum touch target, desktop keeps the denser 32–40px rhythm.
 * `xs` is below that threshold — only use it for desktop-only affordances
 * such as inline table row actions.
 */
const SIZE: Record<ButtonSize, string> = {
  xs: 'h-8 gap-1.5 px-2.5 text-xs rounded-sm',
  sm: 'h-10 sm:h-9 gap-1.5 px-3 text-xs rounded-md',
  md: 'h-11 sm:h-10 gap-2 px-4 text-sm rounded-md',
  lg: 'h-12 sm:h-11 gap-2 px-5 text-sm rounded-lg',
  icon: 'h-11 w-11 sm:h-10 sm:w-10 rounded-md',
  'icon-sm': 'h-10 w-10 sm:h-8 sm:w-8 rounded-sm',
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and blocks clicks. Width stays stable while loading. */
  loading?: boolean;
  /** Rendered before the label. Omit when using an `icon` size. */
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'secondary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth,
      disabled,
      children,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={cn(
          'inline-flex select-none items-center justify-center whitespace-nowrap font-medium',
          'transition-colors duration-150',
          'disabled:pointer-events-none disabled:opacity-50',
          'active:scale-98 motion-reduce:active:scale-100',
          VARIANT[variant],
          SIZE[size],
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </button>
    );
  },
);
Button.displayName = 'Button';

/**
 * Anchor styled as a button — for real navigation and `tel:` / `https:` links,
 * which must stay an <a> for middle-click, long-press and screen readers.
 */
export interface ButtonLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const ButtonLink = React.forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  (
    {
      className,
      variant = 'secondary',
      size = 'md',
      leftIcon,
      rightIcon,
      fullWidth,
      children,
      ...props
    },
    ref,
  ) => (
    <a
      ref={ref}
      className={cn(
        'inline-flex select-none items-center justify-center whitespace-nowrap font-medium',
        'transition-colors duration-150',
        'active:scale-98 motion-reduce:active:scale-100',
        VARIANT[variant],
        SIZE[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </a>
  ),
);
ButtonLink.displayName = 'ButtonLink';
