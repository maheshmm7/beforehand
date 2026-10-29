import { LogoMark } from './Logo';
import styles from './LoadingScreen.module.css';

/** The same mark as the inline splash in index.html, so a lazy route loads
 *  exactly the way a cold refresh does. */
export function LoadingScreen({ label = 'Loading' }: { label?: string }): React.JSX.Element {
  return (
    <div className={styles.screen} role="status" aria-live="polite">
      <LogoMark size={64} pulsing />
      <p className={styles.label}>{label}</p>
    </div>
  );
}
