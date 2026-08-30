'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useDragScroll } from '@/hooks/useDragScroll';

/* =========================================================================
   Tabs — single-accent pill strip with roving tabIndex & touch/mouse drag scroll
   ========================================================================= */
export interface TabItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  count?: number;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (key: string) => void;
  variant?: 'pill';
  className?: string;
}

export function Tabs({
  items,
  value,
  onChange,
  className,
}: TabsProps) {
  const tabRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map());
  const { ref, isDragging, dragProps } = useDragScroll<HTMLDivElement>();

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    let next = idx;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      next = (idx + 1) % items.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      next = (idx - 1 + items.length) % items.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      next = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      next = items.length - 1;
    } else {
      return;
    }
    const nextItem = items[next];
    onChange(nextItem.key);
    tabRefs.current.get(nextItem.key)?.focus();
  };

  return (
    <div
      ref={ref}
      {...dragProps}
      role="tablist"
      aria-orientation="horizontal"
      style={{ WebkitOverflowScrolling: 'touch' }}
      className={cn(
        'flex gap-1 overflow-x-auto no-scrollbar overscroll-x-contain touch-pan-x bg-surface-subtle p-1 rounded-md cursor-grab active:cursor-grabbing select-none',
        isDragging && 'select-none',
        className,
      )}
    >
      {items.map((item, idx) => {
        const isActive = item.key === value;
        return (
          <button
            key={item.key}
            ref={(el) => {
              if (el) tabRefs.current.set(item.key, el);
              else tabRefs.current.delete(item.key);
            }}
            role="tab"
            type="button"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(item.key)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5',
              'text-xs font-medium transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
              isActive
                ? 'bg-surface text-fg shadow-xs border border-line'
                : 'text-fg-muted hover:text-fg hover:bg-surface-hover border border-transparent',
            )}
          >
            {item.icon && (
              <span className="shrink-0 [&>svg]:h-3.5 [&>svg]:w-3.5 pointer-events-none" aria-hidden>
                {item.icon}
              </span>
            )}
            <span className="pointer-events-none">{item.label}</span>
            {item.count !== undefined && (
              <span
                className={cn(
                  'ml-0.5 inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none pointer-events-none',
                  isActive
                    ? 'bg-accent text-accent-fg'
                    : 'bg-surface-subtle text-fg-muted',
                )}
              >
                {item.count}
              </span>
            )}
            {item.badge}
          </button>
        );
      })}
    </div>
  );
}
