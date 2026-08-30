'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * One input surface, replacing the four incompatible strings previously in use
 * (auth / hospital modal / CA modal / ledger form), which disagreed on radius,
 * padding, dark background and whether focus drew a ring or a border.
 *
 * `text-base sm:text-sm` is deliberate: 16px on phones stops mobile browsers
 * auto-zooming the viewport on focus, 14px keeps desktop dense.
 */
const FIELD_BASE = cn(
  'w-full rounded-md border bg-surface-subtle text-fg',
  'text-base sm:text-sm placeholder:text-fg-subtle',
  'transition-colors duration-150',
  'focus:border-accent focus:bg-surface',
  'disabled:cursor-not-allowed disabled:opacity-60',
);

const INVALID = 'border-danger focus:border-danger';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Icon rendered inside the field on the left. */
  icon?: React.ReactNode;
  /** Element rendered inside the field on the right (unit, clear button…). */
  suffix?: React.ReactNode;
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, suffix, invalid, ...props }, ref) => {
    const field = (
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          FIELD_BASE,
          'h-11 border-line px-3 sm:h-10',
          icon && 'pl-9',
          suffix && 'pr-9',
          invalid && INVALID,
          className,
        )}
        {...props}
      />
    );

    if (!icon && !suffix) return field;

    return (
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle [&>svg]:h-4 [&>svg]:w-4">
            {icon}
          </span>
        ) : null}
        {field}
        {suffix ? (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-subtle [&>svg]:h-4 [&>svg]:w-4">
            {suffix}
          </span>
        ) : null}
      </div>
    );
  },
);
Input.displayName = 'Input';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, rows = 3, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(
        FIELD_BASE,
        'resize-y border-line px-3 py-2.5 leading-relaxed',
        invalid && INVALID,
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

/**
 * Native <select> — intentionally. On Android it opens the OS picker, which is
 * a better mobile experience than any custom dropdown and needs no JS.
 * The chevron is ours; the browser's is removed via `appearance-none`.
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, invalid, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          FIELD_BASE,
          'h-11 appearance-none border-line pl-3 pr-9 sm:h-10',
          invalid && INVALID,
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle"
        aria-hidden
      />
    </div>
  ),
);
Select.displayName = 'Select';

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }
>(({ className, required, children, ...props }, ref) => (
  <label
    ref={ref}
    className={cn('block text-xs font-medium text-fg-muted', className)}
    {...props}
  >
    {children}
    {required ? (
      <span className="ml-0.5 text-danger" aria-hidden>
        *
      </span>
    ) : null}
  </label>
));
Label.displayName = 'Label';

export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  required?: boolean;
  /** Validation message. When set, it replaces `hint` and colours red. */
  error?: string;
  hint?: string;
  /** Links label → control → message. Falls back to an auto-generated id. */
  htmlFor?: string;
}

/**
 * Label + control + one message slot. Using this everywhere is what makes
 * validation errors look the same on every form — they are currently
 * `text-red-600` in the ledger forms and `text-rose-*` everywhere else.
 */
export function Field({
  label,
  required,
  error,
  hint,
  htmlFor,
  className,
  children,
  ...props
}: FieldProps) {
  const autoId = React.useId();
  const id = htmlFor ?? autoId;
  const messageId = `${id}-message`;

  return (
    <div className={cn('space-y-1.5', className)} {...props}>
      {label ? (
        <Label htmlFor={id} required={required}>
          {label}
        </Label>
      ) : null}

      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement, {
            id: (children as React.ReactElement).props.id ?? id,
            'aria-describedby':
              error || hint
                ? (children as React.ReactElement).props['aria-describedby'] ??
                  messageId
                : undefined,
          })
        : children}

      {error ? (
        <p id={messageId} className="text-xs font-medium text-danger-fg">
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="text-xs text-fg-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Checkbox / radio sized for touch, with the label as the hit target.
 */
export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, type = 'checkbox', ...props }, ref) => {
    const autoId = React.useId();
    const id = props.id ?? autoId;

    return (
      <div className="flex items-start gap-2.5">
        <input
          ref={ref}
          id={id}
          type={type}
          className={cn(
            'mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded-sm border-line',
            'text-accent accent-accent',
            'disabled:cursor-not-allowed disabled:opacity-60',
            className,
          )}
          {...props}
        />
        {label ? (
          <label
            htmlFor={id}
            className="cursor-pointer select-none text-xs leading-relaxed text-fg-muted"
          >
            {label}
          </label>
        ) : null}
      </div>
    );
  },
);
Checkbox.displayName = 'Checkbox';
