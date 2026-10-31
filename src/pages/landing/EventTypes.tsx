import { packList } from '@shared/packs';
import { cx } from '@/ui/cx';
import { Reveal } from './Reveal';
import styles from './landing.module.css';

/** Counted from the packs themselves, so the figures cannot go stale. */
export function EventTypes(): React.JSX.Element {
  return (
    <Reveal id="kinds" className={cx(styles.section, styles.wrap)}>
      <div className={styles.sectionHead}>
        <p className={styles.kicker}>Event types</p>
        <h2 className={styles.sectionTitle}>One engine, three very different problems</h2>
        <p className={styles.sectionLead}>
          The difference between them is data, not code — and each has its own master variable.
        </p>
      </div>

      <div className={styles.kinds}>
        {packList.map((pack) => (
          <article key={pack.kind} className={styles.kind}>
            <h3 className={styles.kindName}>{pack.label}</h3>
            <p className={styles.kindBlurb}>{pack.blurb}</p>
            <p className={styles.kindMeta}>
              <span className={styles.kindTag}>{pack.costRules.length} cost rules</span>
              <span className={styles.kindTag}>{pack.variables.length} levers</span>
              <span className={styles.kindTag}>{pack.constraints.length} warnings</span>
            </p>
          </article>
        ))}
      </div>
    </Reveal>
  );
}
