'use client';

import { useRef, useState, useCallback } from 'react';

/**
 * Custom hook that enables both touch sliding and mouse press-and-drag horizontal scrolling
 * for tab bars, step indicators, and horizontal lists.
 */
export function useDragScroll<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    setIsDragging(true);
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - ref.current.offsetLeft;
    scrollLeftRef.current = ref.current.scrollLeft;
  }, []);

  const onMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    // Check if primary mouse button is pressed (buttons === 1)
    if (e.buttons !== 1) {
      if (isDragging) setIsDragging(false);
      return;
    }
    const x = e.pageX - ref.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5; // Scroll speed factor
    if (Math.abs(walk) > 4) {
      hasDraggedRef.current = true;
      ref.current.scrollLeft = scrollLeftRef.current - walk;
    }
  }, [isDragging]);

  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (hasDraggedRef.current) {
      e.stopPropagation();
      e.preventDefault();
      hasDraggedRef.current = false;
    }
  }, []);

  return {
    ref,
    isDragging,
    dragProps: {
      onMouseDown,
      onMouseLeave,
      onMouseUp,
      onMouseMove,
      onClickCapture,
    },
  };
}
