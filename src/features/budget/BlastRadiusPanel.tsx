import type { BlastRadius } from '@shared/engine';
import { money, plural, shortDate, signedMoney } from '@/lib/format';
import { Button, Card } from '@/ui/controls';
import { cx } from '@/ui/cx';
import styles from './budget.module.css';

/** At most this many consequences are listed, so the panel's height stays
 *  steady instead of jumping as a lever moves. The rest are counted. */
const SHOWN = 7;

interface Row {
  readonly key: string;
  readonly what: string;
  readonly detail: string;
}

/**
 * Ordered by how surprising it is, not by category. A task that appeared out
 * of nowhere matters more than the sixth cost line, so the gotchas are listed
 * first and the money detail is what gets truncated.
 */
function rowsFor(radius: BlastRadius): Row[] {
  return [
    ...radius.newTasks.map((task) => ({
      key: `new-${task.id}`,
      what: `+ ${task.label}`,
      detail: 'new task',
    })),
    ...radius.movedDeadlines.map((deadline) => ({
      key: deadline.id,
      what: `${deadline.label} deadline`,
      detail: `${shortDate(deadline.from)} → ${shortDate(deadline.to)}`,
    })),
    ...radius.resolvedTasks.map((task) => ({
      key: `done-${task.id}`,
      what: `− ${task.label}`,
      detail: 'no longer needed',
    })),
    ...radius.addedLines.map((line) => ({
      key: `added-${line.ruleId}`,
      what: `+ ${line.label}`,
      detail: money(line.amount),
    })),
    ...radius.removedLines.map((line) => ({
      key: `gone-${line.ruleId}`,
      what: `− ${line.label}`,
      detail: 'no longer needed',
    })),
    ...radius.changedLines.map((line) => ({
      key: `changed-${line.ruleId}`,
      what: line.label,
      detail: `${money(line.from)} → ${money(line.to)}`,
    })),
  ];
}

/**
 * The point of the whole application: not the new total, but everything the
 * change set off, stated before it is accepted.
 *
 * It lives beside the levers rather than above them, and lists a fixed number
 * of consequences, so moving a lever can never move the lever.
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
  const rows = rowsFor(radius);
  const shown = rows.slice(0, SHOWN);
  const hidden = rows.length - shown.length;

  return (
    <Card title="Blast radius" className={cx(styles.radius, radius.isEmpty && styles.radiusEmpty)}>
      <div className={styles.radiusBody} role="status" aria-live="polite">
        {radius.isEmpty ? (
          <p className={styles.radiusQuiet}>
            Move a lever to see what it costs before you commit to it.
          </p>
        ) : (
          <>
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
              {plural(
                radius.changedLines.length + radius.addedLines.length + radius.removedLines.length,
                'line',
              )}{' '}
              moved · {plural(radius.movedDeadlines.length, 'deadline')} shifted ·{' '}
              {plural(radius.newTasks.length, 'new task')} ·{' '}
              {plural(radius.newViolations.length, 'constraint')} broken
            </p>

            {radius.newViolations.map((violation) => (
              <p key={violation.id} className={styles.alert}>
                {violation.message}
                <span className={styles.alertHint}>{violation.hint}</span>
              </p>
            ))}

            <ul className={styles.radiusList}>
              {shown.map((row) => (
                <li key={row.key} className={styles.radiusRow}>
                  <span>{row.what}</span>
                  <span>{row.detail}</span>
                </li>
              ))}
              {hidden > 0 ? (
                <li className={cx(styles.radiusRow, styles.radiusMore)}>
                  <span>and {plural(hidden, 'other change')}</span>
                  <span />
                </li>
              ) : null}
            </ul>
          </>
        )}
      </div>

      <div className={styles.actions}>
        <Button variant="primary" onClick={onKeep} disabled={radius.isEmpty}>
          Keep this change
        </Button>
        <Button onClick={onUndo} disabled={radius.isEmpty}>
          Undo
        </Button>
      </div>
    </Card>
  );
}
