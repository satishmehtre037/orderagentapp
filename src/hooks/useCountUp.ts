'use client';

import { useState, useEffect, useRef } from 'react';

interface UseCountUpOptions {
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}

/**
 * Lightweight numeric count-up hook using requestAnimationFrame.
 * Automatically respects prefers-reduced-motion and handles formatting.
 */
export function useCountUp(
  targetValue: number | string,
  options: UseCountUpOptions = {}
): string {
  const { duration = 650, decimals = 0, prefix = '', suffix = '' } = options;

  // Extract pure number if given string like "₹12,400" or "48"
  const parseNum = (val: number | string): number => {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    const clean = String(val).replace(/[^0-9.-]+/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  const finalNum = parseNum(targetValue);
  const [displayValue, setDisplayValue] = useState<number>(finalNum);
  const prevValueRef = useRef<number>(finalNum);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setDisplayValue(finalNum);
      prevValueRef.current = finalNum;
      return;
    }

    const startVal = prevValueRef.current;
    const endVal = finalNum;
    if (startVal === endVal) {
      setDisplayValue(endVal);
      return;
    }

    const startTime = performance.now();
    let animId: number;

    const easeOutExpo = (x: number): number => {
      return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
    };

    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);
      const current = startVal + (endVal - startVal) * easedProgress;

      setDisplayValue(current);

      if (progress < 1) {
        animId = requestAnimationFrame(update);
      } else {
        setDisplayValue(endVal);
        prevValueRef.current = endVal;
      }
    };

    animId = requestAnimationFrame(update);

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [finalNum, duration]);

  // Format with commas and decimals
  const formatted = Math.round(displayValue).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${prefix}${formatted}${suffix}`;
}
