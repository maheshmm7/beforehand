import type { Plan } from '@shared/plan';
import { money, moneyShort } from '@/lib/format';
import { usePlanModel } from '@/state/usePlanModel';
import { useWorkspace } from '@/state/useWorkspace';
import { Card, Stat } from '@/ui/controls';
import { IconLock, IconReceipt, IconRipple, IconScale } from '@/ui/icons';
import { Levers } from './Levers';
import { MoneySplit } from './MoneySplit';
import styles from './budget.module.css';

/**
 * Four figures and anything the levers broke along the top, because together
 * they are the answer the rest of the screen is working towards. Under them,
 * the levers take the width they need and where the money goes sits in a
 * narrower column beside them. Everything is on the screen at once and at a
 * fixed height: nothing here folds, grows or scrolls while it is read.
 */
export function BudgetView({ plan }: { plan: Plan }): React.JSX.Element {
  const { dispatch } = useWorkspace();
  const { pack, scenario, current } = usePlanModel(plan);
  const { totals, violations } = current;

  return (
    <div className={styles.board}>
      <section className={styles.stats} aria-label="Where the money stands">
        <Stat
          label="Total"
          value={moneyShort(totals.all)}
          note={money(totals.all)}
          icon={<IconScale size={17} />}
          live
        />
        <Stat
          label="Paid"
          value={moneyShort(totals.paid)}
          note="gone, not reversible"
          icon={<IconLock size={17} />}
          tone="quiet"
        />
        <Stat
          label="Quoted"
          value={moneyShort(totals.quoted)}
          note="promised by a vendor"
          icon={<IconReceipt size={17} />}
          tone="work"
        />
        <Stat
          label="Movable"
          value={moneyShort(totals.movable)}
          note="only an estimate"
          icon={<IconRipple size={17} />}
          live
        />
      </section>

      <Card
        title="Levers"
        tone="accent"
        icon={<IconScale size={18} />}
        className={styles.leversCard}
      >
        <Levers
          pack={pack}
          values={scenario.values}
          onChange={(variableId, value) => {
            dispatch({ type: 'setValue', planId: plan.id, variableId, value });
          }}
        />
      </Card>

      {/* After the levers, not before them: on one column a warning that
          appears mid-drag would push the slider out from under the thumb. On
          two it is placed beside the figures, where it is read first. */}
      {violations.length === 0 ? null : (
        <div className={styles.alerts}>
          {violations.map((violation) => (
            <p key={violation.id} className={styles.alert}>
              {violation.message}
              <span className={styles.alertHint}>{violation.hint}</span>
            </p>
          ))}
        </div>
      )}
      <Card
        title="Where the money goes"
        tone="money"
        icon={<IconReceipt size={18} />}
        className={styles.breakdown}
      >
        <MoneySplit model={current} />
      </Card>
    </div>
  );
}
