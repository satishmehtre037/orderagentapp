'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, type ButtonVariant } from './Button';

/* =========================================================================
   Scroll-lock bookkeeping
   -------------------------------------------------------------------------
   Module-level counter so nested modals don't unlock early.
   ========================================================================= */
let lockCount = 0;
let savedOverflow = '';

function lockScroll() {
  if (lockCount === 0) {
    savedOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  lockCount++;
}

function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = savedOverflow;
  }
}

/* =========================================================================
   Escape key stack — only topmost modal responds
   ========================================================================= */
const escapeStack: Array<() => void> = [];

function pushEscape(handler: () => void) {
  escapeStack.push(handler);
}

function popEscape(handler: () => void) {
  const idx = escapeStack.indexOf(handler);
  if (idx !== -1) escapeStack.splice(idx, 1);
}

function handleGlobalKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && escapeStack.length > 0) {
    e.stopPropagation();
    escapeStack[escapeStack.length - 1]();
  }
}

if (typeof window !== 'undefined') {
  document.addEventListener('keydown', handleGlobalKeyDown);
}

/* =========================================================================
   Focus trap helper
   ========================================================================= */
const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function trapFocus(container: HTMLElement, e: KeyboardEvent) {
  if (e.key !== 'Tab') return;
  const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

/* =========================================================================
   Modal sizes
   ========================================================================= */
type ModalSize = 'sm' | 'md' | 'lg' | 'xl';
const SIZE_CLASS: Record<ModalSize, string> = {
  sm: 'max-w-sm',   // 24rem
  md: 'max-w-lg',   // 32rem
  lg: 'max-w-2xl',  // 42rem
  xl: 'max-w-3xl',  // 48rem
};

/* =========================================================================
   Modal
   ========================================================================= */
export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  /** 'sheet' = bottom sheet on mobile, 'center' = always centered */
  mobile?: 'sheet' | 'center';
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  initialFocus?: React.RefObject<HTMLElement | null>;
  children?: React.ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  icon,
  footer,
  size = 'md',
  mobile = 'sheet',
  closeOnBackdrop = true,
  closeOnEscape = true,
  initialFocus,
  children,
}: ModalProps) {
  const [mounted, setMounted] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const previousFocusRef = React.useRef<HTMLElement | null>(null);

  const titleId = React.useId();
  const descId = React.useId();

  // Mount guard for SSR
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Scroll lock
  React.useEffect(() => {
    if (!open) return;
    lockScroll();
    return () => unlockScroll();
  }, [open]);

  // Escape stack
  React.useEffect(() => {
    if (!open || !closeOnEscape) return;
    pushEscape(onClose);
    return () => popEscape(onClose);
  }, [open, closeOnEscape, onClose]);

  // Focus management
  React.useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;

    // Delay to let the panel mount
    const timer = setTimeout(() => {
      if (initialFocus?.current) {
        initialFocus.current.focus();
      } else {
        const panel = panelRef.current;
        if (!panel) return;
        const firstFocusable = panel.querySelector<HTMLElement>(FOCUSABLE);
        if (firstFocusable) firstFocusable.focus();
        else panel.focus();
      }
    }, 50);

    return () => {
      clearTimeout(timer);
      previousFocusRef.current?.focus();
    };
  }, [open, initialFocus]);

  // Focus trap keydown on panel
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (panelRef.current) trapFocus(panelRef.current, e.nativeEvent);
    },
    [],
  );

  if (!mounted || !open) return null;

  const isSheet = mobile === 'sheet';

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex overflow-hidden"
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-fg/40 backdrop-blur-sm animate-fade-in"
        aria-hidden
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      {/* Positioning wrapper */}
      <div
        className={cn(
          'relative z-10 flex w-full',
          // On mobile: bottom sheet or center
          isSheet
            ? 'items-end sm:items-center sm:justify-center'
            : 'items-center justify-center',
          // Always centered on desktop
          'sm:items-center sm:justify-center',
          'p-0 sm:p-4',
        )}
      >
        {/* Panel */}
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descId : undefined}
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          className={cn(
            'relative flex w-full flex-col bg-elevated border border-line outline-none',
            SIZE_CLASS[size],
            // Mobile sheet mode
            isSheet
              ? 'max-h-[90dvh] rounded-t-2xl sm:rounded-lg sm:max-h-[85vh] animate-slide-up sm:animate-scale-in'
              : 'max-h-[85vh] rounded-lg animate-scale-in',
            // Padding
            'shadow-lg',
          )}
        >
          {/* Grab handle for mobile sheet */}
          {isSheet && (
            <div className="flex justify-center py-2 sm:hidden" aria-hidden>
              <div className="h-1 w-8 rounded-full bg-fg-subtle/50" />
            </div>
          )}

          {/* Header */}
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
            <div className="flex min-w-0 items-start gap-2.5">
              {icon && (
                <span className="mt-0.5 shrink-0 text-fg-muted [&>svg]:h-5 [&>svg]:w-5">
                  {icon}
                </span>
              )}
              <div className="min-w-0">
                <h2
                  id={titleId}
                  className="text-sm font-semibold leading-tight text-fg sm:text-base"
                >
                  {title}
                </h2>
                {description && (
                  <p
                    id={descId}
                    className="mt-0.5 text-xs leading-relaxed text-fg-muted"
                  >
                    {description}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className={cn(
                'inline-flex shrink-0 items-center justify-center rounded-md',
                'h-8 w-8 text-fg-muted transition-colors',
                'hover:bg-surface-hover hover:text-fg',
              )}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body — the ONE scroll container */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-line px-4 py-3 pb-safe sm:px-5 sm:pb-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* =========================================================================
   ConfirmDialog — wraps Modal for delete/danger/confirm patterns
   ========================================================================= */
export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  loading?: boolean;
  icon?: React.ReactNode;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  loading = false,
  icon,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      icon={icon}
      size="sm"
      mobile="center"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone as ButtonVariant}
            size="sm"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
