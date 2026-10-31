import { cx } from '@/ui/cx';
import { Reveal } from './Reveal';
import { STEPS } from './content';
import styles from './landing.module.css';

export function HowItWorks(): React.JSX.Element {
  return (
    <Reveal id="how" className={cx(styles.section, styles.wrap)}>
      <div className={styles.sectionHead}>
        <p className={styles.kicker}>How it works</p>
        <h2 className={styles.sectionTitle}>Three steps, and the third is the one that counts</h2>
        <p className={styles.sectionLead}>
          An event is not a checklist. It is a graph of decisions that pull on each other, and the
          pull is what nobody models.
        </p>
      </div>

      <ol className={styles.steps}>
        {STEPS.map((step, index) => (
          <li key={step.title} className={styles.step}>
            <span className={styles.stepNumber}>{index + 1}</span>
            <h3 className={styles.stepTitle}>{step.title}</h3>
            <p className={styles.stepText}>{step.text}</p>
          </li>
        ))}
      </ol>
    </Reveal>
  );
}
