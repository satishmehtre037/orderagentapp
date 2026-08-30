import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind class names, resolving conflicts so that later classes win.
 *
 * Without this, `cn('p-2', 'p-3')` would emit both and let CSS source order
 * decide — which is why a caller passing `className="p-3"` to a component that
 * hardcodes `p-2` currently cannot override it.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
