import type { Plan } from '@shared/plan';
import { countdown } from '@/lib/format';
import { hrefFor } from '@/lib/router';
import { cx } from '@/ui/cx';
import { IconArrow } from '@/ui/icons';
import { Reveal } from './Reveal';
import styles from './landing.module.css';

/** Shown only to somebody who has been here before. */
export function YourPlans({
  plans,
  today,
}: {
  plans: readonly Plan[];
  today: string;
}): React.JSX.Element | null {
  if (plans.length === 0) return null;

  return (
    <Reveal className={cx(styles.section, styles.wrap)}>
      <div className={styles.sectionHead}>
        <p className={styles.kicker}>Pick up where you left off</p>
        <h2 className={styles.sectionTitle}>Your plans</h2>
      </div>
      <div className={styles.plans}>
        {plans.map((plan) => (
          <a
            key={plan.id}
            className={styles.planCard}
            href={hrefFor({ name: 'plan', planId: plan.id, view: 'budget' })}
          >
            <span className={styles.planName}>{plan.name}</span>
            <span className={styles.planMeta}>
              {countdown(today, plan.eventDateIso)} away
              {plan.place === '' ? '' : ` · ${plan.place}`}
            </span>
            <span className={styles.planGo}>
              Open <IconArrow size={16} />
            </span>
          </a>
        ))}
      </div>
    </Reveal>
  );
}
