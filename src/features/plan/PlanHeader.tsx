import { packFor } from '@shared/packs';
import { activeScenarioOf, type Plan } from '@shared/plan';
import { countdown, todayIso } from '@/lib/format';
import { useWorkspace } from '@/state/useWorkspace';
import { DateField } from '@/ui/DateField';
import { TimeField } from '@/ui/TimeField';
import { controlStyles } from '@/ui/controlStyles';
import styles from './PlanHeader.module.css';

/**
 * One bar, not a block: who and what on the left, the three facts that move
 * everything else on the right. It stays the same height on every view, so
 * switching between them does not shift the page.
 */
export function PlanHeader({ plan }: { plan: Plan }): React.JSX.Element {
  const { dispatch } = useWorkspace();
  const pack = packFor(plan.kind);
  const scenario = activeScenarioOf(plan);

  return (
    <header className={styles.header}>
      <div className={styles.who}>
        <h1 className={styles.title}>{plan.name}</h1>
        {/* The date and the place are editable fields an inch to the right.
            Printing them again here was the same fact three times over. */}
        <p className={styles.meta}>
          {pack.label} · {countdown(todayIso(), plan.eventDateIso)} away ·{' '}
          <span className={styles.scenarioTag}>{scenario.name}</span>
        </p>
      </div>

      <div className={styles.fields}>
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="plan-date">
            Date
          </label>
          <DateField
            id="plan-date"
            label="Choose the date of the event"
            note={false}
            value={plan.eventDateIso}
            onChange={(eventDateIso) => {
              dispatch({ type: 'setPlanDate', planId: plan.id, eventDateIso });
            }}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="plan-anchor">
            {pack.anchorLabel}
          </label>
          <TimeField
            id="plan-anchor"
            label={`Choose when ${pack.anchorLabel.toLowerCase()} happens`}
            note={false}
            value={plan.anchorTime}
            onChange={(anchorTime) => {
              dispatch({ type: 'setAnchorTime', planId: plan.id, anchorTime });
            }}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="plan-place">
            Where
          </label>
          <input
            id="plan-place"
            className={controlStyles.input}
            type="text"
            maxLength={60}
            placeholder="Hyderabad"
            value={plan.place}
            onChange={(event) => {
              dispatch({ type: 'setPlace', planId: plan.id, place: event.target.value });
            }}
          />
        </div>
      </div>
    </header>
  );
}
