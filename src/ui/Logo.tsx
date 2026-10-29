import { cx } from './cx';
import styles from './Logo.module.css';

/**
 * The mark is a decision (the filled dot) and the consequences it sets off
 * (the arcs ahead of it). Pulsing them outwards turns the same mark into the
 * loading state, so the brand and the spinner are one thing.
 */
export function LogoMark({
  size = 28,
  pulsing = false,
}: {
  size?: number;
  pulsing?: boolean;
}): React.JSX.Element {
  return (
    <svg
      className={cx(styles.mark, pulsing && styles.pulsing)}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <circle className={styles.dot} cx="8.5" cy="16" r="3.2" />
      <g className={styles.arcs}>
        <path className={styles.arc1} d="M13.12 10.09 A7.5 7.5 0 0 1 13.12 21.91" />
        <path className={styles.arc2} d="M15.89 6.54 A12 12 0 0 1 15.89 25.46" />
        <path className={styles.arc3} d="M18.66 3 A16.5 16.5 0 0 1 18.66 29" />
      </g>
    </svg>
  );
}

export function Logo({ size = 28 }: { size?: number }): React.JSX.Element {
  return (
    <span className={styles.lockup}>
      <LogoMark size={size} />
      <span className={styles.word}>beforehand</span>
    </span>
  );
}
