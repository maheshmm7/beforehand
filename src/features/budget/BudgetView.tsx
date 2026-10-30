import type { Plan } from '@shared/plan';
import { money, moneyShort } from '@/lib/format';
import { usePlanModel } from '@/state/usePlanModel';
import { useWorkspace } from '@/state/useWorkspace';
import { Card, Stat } from '@/ui/controls';
import { IconLock, IconReceipt, IconRipple, IconScale } from '@/ui/icons';
import { CostLines } from './CostLines';
import { Levers } from './Levers';
import styles from './budget.module.css';

/**
 * The levers take the width they need, the money and anything broken sit in a
 * narrow column beside them, and the breakdown runs the full width beneath. Two columns of very different
 * lengths left a window-sized hole beside the short one.
 */
export function BudgetView({ plan }: { plan: Plan }): React.JSX.Element {
  const { dispatch } = useWorkspace();
  const { pack, scenario, current } = usePlanModel(plan);
  const { totals, violations } = current;

  const span = Math.max(totals.paid + totals.quoted + Math.max(totals.estimated, 0), 1);
  const width = (part: number): string => `${String(Math.max(0, (part / span) * 100))}%`;

  return (
    <div className={styles.board}>
      <Card title="Levers" tone="accent" icon={<IconScale size={18} />}>
        <Levers
          pack={pack}
          values={scenario.values}
          onChange={(variableId, value) => {
            dispatch({ type: 'setValue', planId: plan.id, variableId, value });
          }}
        />
      </Card>

      <div className={styles.side}>
        <section className={styles.money} aria-label="Where the money stands">
          <div className={styles.stats}>
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
          </div>

          <div className={styles.bar}>
            <div className={styles.barPaid} style={{ width: width(totals.paid) }} />
            <div className={styles.barQuoted} style={{ width: width(totals.quoted) }} />
            <div
              className={styles.barEstimated}
              style={{ width: width(Math.max(totals.estimated, 0)) }}
            />
          </div>
        </section>

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
      </div>

      <Card
        title="Every line, and how we got there"
        tone="money"
        icon={<IconReceipt size={18} />}
        className={styles.breakdown}
      >
        <CostLines model={current} />
      </Card>
    </div>
  );
}
