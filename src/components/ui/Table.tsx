'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/* =========================================================================
   Column definition
   ========================================================================= */
export interface Column<T> {
  key: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
  /** Drop this column below the breakpoint on mobile */
  hideBelow?: 'sm' | 'md' | 'lg';
  render?: (row: T) => React.ReactNode;
  /** Becomes the card title on mobile card view */
  primary?: boolean;
  /** Override header label in mobile card view */
  mobileLabel?: string;
}

/* =========================================================================
   DataTable — config-driven responsive table
   ========================================================================= */
export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => string | number;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  empty?: React.ReactNode;
  dense?: boolean;
}

const HIDE_BELOW: Record<string, string> = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
};

const HIDE_BELOW_CARD: Record<string, string> = {
  sm: 'hidden sm:flex',
  md: 'hidden md:flex',
  lg: 'hidden lg:flex',
};

const ALIGN: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  onRowClick,
  loading = false,
  empty,
  dense = false,
}: DataTableProps<T>) {
  const primaryCol = columns.find((c) => c.primary) || columns[0];
  const detailCols = columns.filter((c) => c !== primaryCol);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded-md bg-surface-subtle"
          />
        ))}
      </div>
    );
  }

  if (rows.length === 0 && empty) {
    return <>{empty}</>;
  }

  const cellPad = dense ? 'px-3 py-2' : 'px-4 py-3';

  return (
    <>
      {/* ── Desktop table (md+) ────────────────────────────────── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-subtle">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    cellPad,
                    'text-[11px] font-semibold uppercase tracking-wide text-fg-muted',
                    ALIGN[col.align || 'left'],
                    col.hideBelow && HIDE_BELOW[col.hideBelow],
                  )}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={getRowKey(row, idx)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'border-b border-line transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-surface-hover',
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      cellPad,
                      'text-fg',
                      ALIGN[col.align || 'left'],
                      col.hideBelow && HIDE_BELOW[col.hideBelow],
                    )}
                  >
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile card list (<md) ─────────────────────────────── */}
      <div className="space-y-2 md:hidden">
        {rows.map((row, idx) => (
          <div
            key={getRowKey(row, idx)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={cn(
              'rounded-lg border border-line bg-surface p-3',
              onRowClick && 'cursor-pointer active:bg-surface-hover',
            )}
          >
            {/* Primary column as heading */}
            <div className="mb-2 text-sm font-semibold text-fg">
              {primaryCol.render
                ? primaryCol.render(row)
                : String(
                    (row as Record<string, unknown>)[primaryCol.key] ?? '',
                  )}
            </div>
            {/* Detail rows */}
            <div className="space-y-1">
              {detailCols.map((col) => (
                <div
                  key={col.key}
                  className={cn(
                    'flex items-center justify-between gap-2 text-xs',
                    col.hideBelow && HIDE_BELOW_CARD[col.hideBelow],
                  )}
                >
                  <span className="text-fg-muted">
                    {col.mobileLabel || col.header}
                  </span>
                  <span className="text-right text-fg">
                    {col.render
                      ? col.render(row)
                      : String(
                          (row as Record<string, unknown>)[col.key] ?? '',
                        )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* =========================================================================
   Raw primitives for irregular tables
   ========================================================================= */
export const Table = React.forwardRef<
  HTMLTableElement,
  React.TableHTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="overflow-x-auto">
    <table
      ref={ref}
      className={cn('w-full text-sm', className)}
      {...props}
    />
  </div>
));
Table.displayName = 'Table';

export const THead = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      'border-b border-line bg-surface-subtle text-[11px] font-semibold uppercase tracking-wide text-fg-muted',
      className,
    )}
    {...props}
  />
));
THead.displayName = 'THead';

export const TBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn('[&>tr]:border-b [&>tr]:border-line', className)} {...props} />
));
TBody.displayName = 'TBody';

export const TR = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn('transition-colors hover:bg-surface-hover', className)}
    {...props}
  />
));
TR.displayName = 'TR';

export const TH = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn('px-4 py-3 text-left font-semibold', className)}
    {...props}
  />
));
TH.displayName = 'TH';

export const TD = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn('px-4 py-3 text-fg', className)}
    {...props}
  />
));
TD.displayName = 'TD';
