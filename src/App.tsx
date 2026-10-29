import { useLayoutEffect } from 'react';
import { Logo } from './ui/Logo';
import { cx } from './ui/cx';
import styles from './App.module.css';

export function App(): React.JSX.Element {
  // Set before paint so assistive technology never announces the old language.
  useLayoutEffect(() => {
    document.documentElement.lang = 'en';
  }, []);

  return (
    <main className={styles.page}>
      <Logo size={40} />
      <h1 className={styles.title}>Know what a decision costs before you make it</h1>
      <p className={styles.tagline}>
        Weddings, birthdays and community events. Change one thing and see every cost, deadline and
        task it moves.
      </p>
      <p className={styles.swatches}>
        <span className={cx(styles.swatch, styles.estimated)}>estimated</span>
        <span className={cx(styles.swatch, styles.quoted)}>quoted</span>
        <span className={cx(styles.swatch, styles.paid)}>paid</span>
      </p>
    </main>
  );
}
