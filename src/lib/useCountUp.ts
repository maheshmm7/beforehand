import { useEffect, useRef, useState } from 'react';

const DURATION_MS = 520;
const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);

function skipsAnimation(): boolean {
  if (typeof requestAnimationFrame === 'undefined') return true;
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Counts from the previous value to the new one, so money visibly moves when a
 * lever changes rather than snapping. Reduced motion returns the exact value
 * and never animates at all.
 */
export function useCountUp(target: number): number {
  const [skip] = useState(skipsAnimation);
  const [shown, setShown] = useState(target);
  const from = useRef(target);
  const frame = useRef(0);

  useEffect(() => {
    if (skip) return;

    const start = from.current;
    if (start === target) return;

    const began = performance.now();
    const step = (now: number): void => {
      const progress = Math.min(1, (now - began) / DURATION_MS);
      const value = start + (target - start) * easeOut(progress);
      setShown(progress === 1 ? target : value);
      if (progress < 1) frame.current = requestAnimationFrame(step);
      else from.current = target;
    };

    frame.current = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frame.current);
      from.current = target;
    };
  }, [target, skip]);

  return skip ? target : shown;
}
