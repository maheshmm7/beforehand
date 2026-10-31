import { cx } from '@/ui/cx';
import { IconCheck, IconCross } from '@/ui/icons';
import { Reveal } from './Reveal';
import { RECORDER, SIMULATOR } from './content';
import styles from './landing.module.css';

/** The claim this product stands on, put as two lists side by side. */
export function Comparison(): React.JSX.Element {
  return (
    <Reveal className={cx(styles.section, styles.wrap)}>
      <div className={styles.sectionHead}>
        <p className={styles.kicker}>The difference</p>
        <h2 className={styles.sectionTitle}>A recorder stores. A simulator warns.</h2>
      </div>

      <div className={styles.compare}>
        <div className={styles.compareCard}>
          <p className={styles.compareLabel}>Every other planner</p>
          <h3 className={styles.compareTitle}>A spreadsheet with a nicer skin</h3>
          <ul className={styles.compareList}>
            {RECORDER.map((item) => (
              <li key={item} className={styles.compareItem}>
                <span className={styles.no}>
                  <IconCross size={18} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className={cx(styles.compareCard, styles.compareCardUs)}>
          <p className={styles.compareLabel}>Beforehand</p>
          <h3 className={styles.compareTitle}>A model that answers back</h3>
          <ul className={styles.compareList}>
            {SIMULATOR.map((item) => (
              <li key={item} className={styles.compareItem}>
                <span className={styles.yes}>
                  <IconCheck size={18} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Reveal>
  );
}
