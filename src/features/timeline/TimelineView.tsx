import type { Plan } from '@shared/plan';
import { countdown, longDate, todayIso } from '@/lib/format';
import { usePlanModel } from '@/state/usePlanModel';
import { Card, Chip, EmptyState } from '@/ui/controls';
import { cx } from '@/ui/cx';
import styles from './timeline.module.css';

const SOON_DAYS = 21;

export function TimelineView({ plan }: { plan: Plan }): React.JSX.Element {
  const { pack, current } = usePlanModel(plan);
  const today = todayIso();

  return (
    <div className={styles.grid}>
      <Card title="Decisions, in the order they have to be made">
        <p className={styles.intro}>
          Not a task list. Each date is the last day a choice can be made for the plan behind it to
          still be possible, worked out from how much notice it needs.
        </p>

        {current.deadlines.length === 0 ? (
          <EmptyState title="Nothing to decide yet." />
        ) : (
          current.deadlines.map((deadline) => {
            const away = countdown(today, deadline.dateIso);
            const urgent = away === 'past' || away === 'today' || away === 'tomorrow';
            const days = Number.parseInt(away, 10);
            const soon = urgent || (Number.isFinite(days) && days <= SOON_DAYS);

            return (
              <div key={deadline.id} className={styles.row}>
                <div>
                  <span className={styles.label}>
                    {deadline.label}
                    {deadline.locked ? <Chip tone="paid">money paid</Chip> : null}
                  </span>
                  <span className={styles.note}>
                    {deadline.daysBefore === 0
                      ? 'No notice needed'
                      : `Needs ${String(deadline.daysBefore)} days of notice`}
                  </span>
                </div>
                <div className={cx(styles.when, soon && styles.whenSoon)}>
                  {longDate(deadline.dateIso)}
                  <span className={styles.away}>{away}</span>
                </div>
              </div>
            );
          })
        )}
      </Card>

      <Card title="The day itself">
        <p className={styles.intro}>
          Built backwards from {pack.anchorLabel.toLowerCase()} at {plan.anchorTime}, so the fixed
          moment stays fixed and everything else gives way.
        </p>

        {current.runOfShow.map((segment) => (
          <div key={segment.id} className={styles.row}>
            <span>{segment.label}</span>
            <span className={styles.slot}>
              {segment.startsAt}–{segment.endsAt}
            </span>
          </div>
        ))}

        <div className={styles.anchor}>
          <span>{pack.anchorLabel}</span>
          <span className={styles.slot}>{plan.anchorTime}</span>
        </div>
      </Card>
    </div>
  );
}
