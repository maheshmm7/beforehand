import type { Plan } from '@shared/plan';
import { money, moneyShort } from '@/lib/format';
import { usePlanModel } from '@/state/usePlanModel';
import { useWorkspace } from '@/state/useWorkspace';
import { Card, Stat } from '@/ui/controls';
import { BlastRadiusPanel } from './BlastRadiusPanel';
import { CostLines } from './CostLines';
import { Levers } from './Levers';
import styles from './budget.module.css';

export function BudgetView({ plan }: { plan: Plan }): React.JSX.Element {
  const { dispatch } = useWorkspace();
  const { pack, scenario, current, radius } = usePlanModel(plan);
  const { totals, violations } = current;

  const span = Math.max(totals.paid + totals.quoted + Math.max(totals.estimated, 0), 1);
  const width = (part: number): string => `${String(Math.max(0, (part / span) * 100))}%`;

  return (
    <div className={styles.columns}>
      <div className={styles.left}>
        <BlastRadiusPanel
          radius={radius}
          onKeep={() => {
            dispatch({ type: 'keepChanges', planId: plan.id });
          }}
          onUndo={() => {
            dispatch({ type: 'revertChanges', planId: plan.id });
          }}
        />

        <Card title="Levers">
          <Levers
            pack={pack}
            values={scenario.values}
            onChange={(variableId, value) => {
              dispatch({ type: 'setValue', planId: plan.id, variableId, value });
            }}
          />
        </Card>
      </div>

      <div className={styles.right}>
        <Card title="Where the money stands">
          <div className={styles.stats}>
            <Stat label="Total" value={moneyShort(totals.all)} note={money(totals.all)} live />
            <Stat label="Paid" value={moneyShort(totals.paid)} note="gone, not reversible" />
            <Stat label="Quoted" value={moneyShort(totals.quoted)} note="promised by a vendor" />
            <Stat
              label="Still movable"
              value={moneyShort(totals.movable)}
              note="only an estimate"
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
          <p className={styles.legend}>
            <span>
              <span className={styles.swatch} style={{ background: 'var(--state-paid-ink)' }} />
              Paid {money(totals.paid)}
            </span>
            <span>
              <span className={styles.swatch} style={{ background: 'var(--state-quoted-ink)' }} />
              Quoted {money(totals.quoted)}
            </span>
            <span>
              <span className={styles.swatch} style={{ background: 'var(--border-strong)' }} />
              Estimated {money(totals.estimated)}
            </span>
          </p>
        </Card>

        {violations.length === 0 ? null : (
          <Card title="Worth knowing">
            {violations.map((violation) => (
              <p key={violation.id} className={styles.alert}>
                {violation.message}
                <span className={styles.alertHint}>{violation.hint}</span>
              </p>
            ))}
          </Card>
        )}

        <Card title="Every line, and how we got there">
          <CostLines model={current} />
        </Card>
      </div>
    </div>
  );
}
