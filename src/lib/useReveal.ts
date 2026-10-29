import { useEffect, useRef } from 'react';

/**
 * Marks a section as seen the first time it scrolls into view, which the
 * stylesheet turns into a settle-in. Reduced motion skips it entirely, and so
 * does a browser without an observer: the content is simply there.
 */
export function useReveal<T extends HTMLElement>(): React.RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (element === null) return;

    const show = (): void => {
      element.dataset.reveal = 'shown';
    };

    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (typeof IntersectionObserver === 'undefined' || reduced) {
      show();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            show();
            observer.disconnect();
          }
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    );

    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);

  return ref;
}
