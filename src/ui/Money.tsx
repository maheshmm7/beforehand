import { money, moneyShort, signedMoney } from '@/lib/format';
import { useCountUp } from '@/lib/useCountUp';

type Shape = 'full' | 'short' | 'signed';

const WRITE: Readonly<Record<Shape, (amount: number) => string>> = {
  full: money,
  short: moneyShort,
  signed: signedMoney,
};

/**
 * Money that visibly travels from the old figure to the new one, so a change
 * reads as a consequence rather than a replacement. It lands on the exact
 * value, and reduced motion goes straight there.
 *
 * Not for use inside a live region: a figure that changes forty times a second
 * would be announced forty times.
 */
export function Money({
  amount,
  shape = 'full',
  className,
}: {
  amount: number;
  shape?: Shape;
  className?: string;
}): React.JSX.Element {
  const shown = useCountUp(amount);

  return <span className={className}>{WRITE[shape](Math.round(shown))}</span>;
}
