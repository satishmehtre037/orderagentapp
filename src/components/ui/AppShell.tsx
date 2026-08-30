'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/* =========================================================================
   AppShell — native-feeling mobile layout wrapper
   ========================================================================= */
export interface AppShellProps {
  /** Rendered inside the sticky header bar */
  header?: React.ReactNode;
  children: React.ReactNode;
  /** Pass a <BottomNav /> to render a fixed bottom dock */
  bottomNav?: React.ReactNode;
  /** Optional banner bar between header and content */
  banners?: React.ReactNode;
  className?: string;
}

export function AppShell({
  header,
  children,
  bottomNav,
  banners,
  className,
}: AppShellProps) {
  return (
    <div className={cn('relative flex min-h-[100dvh] flex-col bg-base', className)}>
      {/* Sticky header */}
      {header && (
        <header className="sticky top-0 z-30 shrink-0 border-b border-line bg-surface/85 pt-safe backdrop-blur-xl">
          <div className="flex h-12 items-center gap-3 px-4 sm:h-14 sm:px-6">
            {header}
          </div>
        </header>
      )}

      {/* Banners */}
      {banners}

      {/* Main content */}
      <main
        className={cn(
          'flex-1',
          bottomNav && 'pb-safe-gutter',
        )}
      >
        {children}
      </main>

      {/* Bottom navigation */}
      {bottomNav}
    </div>
  );
}

/* =========================================================================
   BottomNav — fixed mobile dock
   ========================================================================= */
export interface BottomNavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

export interface BottomNavProps {
  items: BottomNavItem[];
  value: string;
  onChange: (key: string) => void;
  /** A floating action button rendered center-above the nav bar */
  fab?: React.ReactNode;
  className?: string;
}

export function BottomNav({
  items,
  value,
  onChange,
  fab,
  className,
}: BottomNavProps) {
  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-surface/90 pb-safe backdrop-blur-xl',
        className,
      )}
    >
      {/* FAB */}
      {fab && (
        <div className="absolute left-1/2 -top-7 -translate-x-1/2">
          {fab}
        </div>
      )}

      <div className="flex items-stretch justify-around">
        {items.slice(0, 5).map((item) => {
          const isActive = item.key === value;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              className={cn(
                'relative flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 py-1.5',
                'text-[10px] font-medium transition-colors',
                isActive ? 'text-accent' : 'text-fg-muted',
              )}
            >
              <span className="relative [&>svg]:h-5 [&>svg]:w-5" aria-hidden>
                {item.icon}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-danger px-0.5 text-[9px] font-bold text-white">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
