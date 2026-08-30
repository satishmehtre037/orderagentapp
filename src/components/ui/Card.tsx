'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * The single card surface. Replaces the four competing strings that were in
 * use (glass / flat / dashboard-stat / ledger), which disagreed on radius,
 * border opacity and background.
 *
 * In this design a hairline border does the separating; `elevated` adds a
 * shadow and is reserved for things that float (modals, popovers, dropdowns).
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  /** Adds hover feedback. Only use on cards that are actually clickable. */
  interactive?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, elevated, interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border border-line bg-surface',
        elevated && 'shadow-md',
        interactive &&
          'transition-colors hover:border-line-strong hover:bg-surface-hover',
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { bordered?: boolean }
>(({ className, bordered = true, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-start justify-between gap-3 px-4 py-3 sm:px-5',
      bordered && 'border-b border-line',
      className,
    )}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-sm font-semibold leading-tight text-fg', className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('mt-0.5 text-xs leading-relaxed text-fg-muted', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('px-4 py-4 sm:px-5', className)} {...props} />
));
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { bordered?: boolean }
>(({ className, bordered = true, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center justify-end gap-2 px-4 py-3 sm:px-5',
      bordered && 'border-t border-line',
      className,
    )}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

/**
 * Groups a heading and optional action above a block of content — the
 * "section header" pattern repeated 3–4× in every ledger form.
 */
export interface SectionHeaderProps
  extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function SectionHeader({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-3 border-b border-line pb-3',
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 items-start gap-2">
        {icon ? (
          <span className="mt-0.5 shrink-0 text-fg-muted [&>svg]:h-4 [&>svg]:w-4">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold leading-tight text-fg">
            {title}
          </h3>
          {description ? (
            <p className="mt-0.5 text-xs text-fg-muted">{description}</p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
