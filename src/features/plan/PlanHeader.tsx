import { packFor } from '@shared/packs';
import { activeScenarioOf, type Plan } from '@shared/plan';
import { countdown, longDate, todayIso } from '@/lib/format';
import { useWorkspace } from '@/state/useWorkspace';
import { Field } from '@/ui/controls';
import { controlStyles } from '@/ui/controlStyles';
import styles from './PlanHeader.module.css';

export function PlanHeader({ plan }: { plan: Plan }): React.JSX.Element {
  const { dispatch } = useWorkspace();
  const pack = packFor(plan.kind);
  const scenario = activeScenarioOf(plan);

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{plan.name}</h1>
          <p className={styles.meta}>
            {pack.label}
            {plan.place === '' ? '' : ` · ${plan.place}`} · {longDate(plan.eventDateIso)} ·{' '}
            {countdown(todayIso(), plan.eventDateIso)} away ·{' '}
            <span className={styles.scenarioTag}>{scenario.name}</span>
          </p>
        </div>
      </header>

      <div className={styles.fields}>
        <Field label="Date" htmlFor="plan-date">
          <input
            id="plan-date"
            className={controlStyles.input}
            type="date"
            value={plan.eventDateIso}
            onChange={(event) => {
              if (event.target.value !== '') {
                dispatch({
                  type: 'setPlanDate',
                  planId: plan.id,
                  eventDateIso: event.target.value,
                });
              }
            }}
          />
        </Field>

        <Field label={pack.anchorLabel} htmlFor="plan-anchor">
          <input
            id="plan-anchor"
            className={controlStyles.input}
            type="time"
            value={plan.anchorTime}
            onChange={(event) => {
              if (event.target.value !== '') {
                dispatch({
                  type: 'setAnchorTime',
                  planId: plan.id,
                  anchorTime: event.target.value,
                });
              }
            }}
          />
        </Field>

        <Field label="Where" htmlFor="plan-place">
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
        </Field>
      </div>
    </>
  );
}
