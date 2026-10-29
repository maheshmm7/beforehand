import type { ReactNode } from 'react';
import { useReveal } from '@/lib/useReveal';

/** Settles its children in when they first scroll into view. */
export function Reveal({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}): React.JSX.Element {
  const ref = useReveal<HTMLElement>();

  return (
    <section ref={ref} id={id} className={className} data-reveal="">
      {children}
    </section>
  );
}
