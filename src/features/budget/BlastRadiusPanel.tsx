import type { BlastRadius } from '@shared/engine';
import { money, plural, shortDate, signedMoney } from '@/lib/format';
import { Button, Card } from '@/ui/controls';
import { cx } from '@/ui/cx';
import styles from './budget.module.css';

/**
 * The point of the whole application: not the new total, but everything the
 * change set off, stated before it is accepted.
 */
export function BlastRadiusPanel({
  radius,
  onKeep,
  onUndo,
}: {
  radius: BlastRadius;
  onKeep: () => void;
  onUndo: () => void;
}): React.JSX.Element {
  if (radius.isEmpty) {
    return (
      <Card title="Blast radius">
        <p className={styles.radiusQuiet}>
          Move a lever to see what it costs before you commit to it.
        </p>
      </Card>
    );
  }

  const moved = radius.movedDeadlines.length;
  const appeared = radius.addedLines.length;
  const gone = radius.removedLines.length;

  return (
    <Card title="Blast radius" className={styles.radius}>
      <div role="status" aria-live="polite">
        <p
          className={cx(
            styles.delta,
            radius.totalDelta > 0 && styles.deltaUp,
            radius.totalDelta < 0 && styles.deltaDown,
          )}
        >
          {signedMoney(radius.totalDelta)}
        </p>
        <p className={styles.counts}>
          {plural(radius.changedLines.length + appeared + gone, 'line')} moved ·{' '}
          {plural(moved, 'deadline')} shifted · {plural(radius.newTasks.length, 'new task')} ·{' '}
          {plural(radius.newViolations.length, 'constraint')} broken
        </p>

        {radius.newViolations.map((violation) => (
          <p key={violation.id} className={styles.alert}>
            {violation.message}
            <span className={styles.alertHint}>{violation.hint}</span>
          </p>
        ))}

        <ul className={styles.radiusList}>
          {radius.changedLines.slice(0, 6).map((line) => (
            <li key={line.ruleId} className={styles.radiusRow}>
              <span>{line.label}</span>
              <span>
                {money(line.from)} → {money(line.to)}
              </span>
            </li>
          ))}
          {radius.addedLines.map((line) => (
            <li key={`added-${line.ruleId}`} className={styles.radiusRow}>
              <span>+ {line.label}</span>
              <span>{money(line.amount)}</span>
            </li>
          ))}
          {radius.removedLines.map((line) => (
            <li key={`gone-${line.ruleId}`} className={styles.radiusRow}>
              <span>− {line.label}</span>
              <span>no longer needed</span>
            </li>
          ))}
          {radius.movedDeadlines.map((deadline) => (
            <li key={deadline.id} className={styles.radiusRow}>
              <span>{deadline.label} deadline</span>
              <span>
                {shortDate(deadline.from)} → {shortDate(deadline.to)}
              </span>
            </li>
          ))}
          {radius.newTasks.map((task) => (
            <li key={task.id} className={styles.radiusRow}>
              <span>+ {task.label}</span>
              <span>new task</span>
            </li>
          ))}
          {radius.resolvedTasks.map((task) => (
            <li key={`done-${task.id}`} className={styles.radiusRow}>
              <span>− {task.label}</span>
              <span>no longer needed</span>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.actions}>
        <Button variant="primary" onClick={onKeep}>
          Keep this change
        </Button>
        <Button onClick={onUndo}>Undo</Button>
      </div>
    </Card>
  );
}
