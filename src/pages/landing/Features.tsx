import { hrefFor } from '@/lib/router';
import { cx } from '@/ui/cx';
import { Reveal } from './Reveal';
import { FEATURES } from './content';
import styles from './landing.module.css';

export function Features(): React.JSX.Element {
  return (
    <Reveal id="what" className={cx(styles.section, styles.wrap)}>
      <div className={styles.sectionHead}>
        <p className={styles.kicker}>What you get</p>
        <h2 className={styles.sectionTitle}>Six things no other planner does</h2>
        <p className={styles.sectionLead}>
          A language model reads what you paste and proposes ideas. It never does the arithmetic:
          every figure is computed by ordinary code, which is why each one can show its working.{' '}
          <a className={styles.inlineLink} href={hrefFor({ name: 'about' })}>
            How that works
          </a>
          .
        </p>
      </div>

      <div className={styles.features}>
        {FEATURES.map((feature) => (
          <article key={feature.title} className={styles.feature}>
            <span className={styles.featureIcon}>{feature.icon}</span>
            <h3 className={styles.featureTitle}>{feature.title}</h3>
            <p className={styles.featureText}>{feature.text}</p>
          </article>
        ))}
      </div>
    </Reveal>
  );
}
