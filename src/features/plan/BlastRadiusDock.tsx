import type { BlastRadius } from '@shared/engine';
import { money, plural, shortDate, signedMoney } from '@/lib/format';
import { Button } from '@/ui/controls';
import { cx } from '@/ui/cx';
import styles from './BlastRadiusDock.module.css';

/**
 * Counts in the words a person would use. "0 deadlines shifted" is a reading
 * off a gauge; "no deadline moves" is what somebody would actually say about
 * their own wedding.
 */
function tally(count: number, none: string, one: string, many: string): string {
  if (count === 0) return none;
  if (count === 1) return one;
  return many.replace('#', String(count));
}

/** The dock lists what fits in its own height and counts the rest. Nothing in
 *  the dock scrolls: a scrollbar inside a strip this size is noise, and a row
 *  half-cut by the strip's own edge is worse than one the count stands in
 *  for. Three rows is what the height holds. */
const SHOWN = 3;

interface Row {
  readonly key: string;
  readonly what: string;
  readonly detail: string;
  readonly ring: Ring;
}

type Ring = 'money' | 'time' | 'work';

/**
 * Ordered by how surprising it is, not by category. A task that appeared out
 * of nowhere matters more than the sixth cost line, so the gotchas come first
 * and the money detail is what scrolls out of sight.
 */
function rowsFor(radius: BlastRadius): Row[] {
  return [
    ...radius.newTasks.map((task) => ({
      key: `new-${task.id}`,
      what: task.label,
      detail: 'new task',
      ring: 'work' as const,
    })),
    ...radius.movedDeadlines.map((deadline) => ({
      key: deadline.id,
      what: `${deadline.label} deadline`,
      detail: `${shortDate(deadline.from)} → ${shortDate(deadline.to)}`,
      ring: 'time' as const,
    })),
    ...radius.resolvedTasks.map((task) => ({
      key: `done-${task.id}`,
      what: task.label,
      detail: 'no longer needed',
      ring: 'work' as const,
    })),
    ...radius.addedLines.map((line) => ({
      key: `added-${line.ruleId}`,
      what: line.label,
      detail: `new · ${money(line.amount)}`,
      ring: 'money' as const,
    })),
    ...radius.removedLines.map((line) => ({
      key: `gone-${line.ruleId}`,
      what: line.label,
      detail: 'no longer needed',
      ring: 'money' as const,
    })),
    ...radius.changedLines.map((line) => ({
      key: `changed-${line.ruleId}`,
      what: line.label,
      detail: `${money(line.from)} → ${money(line.to)}`,
      ring: 'money' as const,
    })),
  ];
}

/**
 * The emblem: rings radiating from the change. The inner ring is money, the
 * middle one the calendar, the outer one work somebody now has to do. How far
 * out the light reaches is how far the change reached.
 */
function Rings({
  counts,
  live,
}: {
  counts: Record<Ring, number>;
  live: boolean;
}): React.JSX.Element {
  return (
    <svg className={styles.rings} viewBox="0 0 72 72" aria-hidden="true">
      {live ? <circle className={styles.ripple} cx="36" cy="36" r="8" /> : null}
      <circle
        className={cx(styles.ring, styles.ringWork, counts.work > 0 && styles.ringOn)}
        cx="36"
        cy="36"
        r="26"
      />
      <circle
        className={cx(styles.ring, styles.ringTime, counts.time > 0 && styles.ringOn)}
        cx="36"
        cy="36"
        r="19"
      />
      <circle
        className={cx(styles.ring, styles.ringMoney, counts.money > 0 && styles.ringOn)}
        cx="36"
        cy="36"
        r="12"
      />
      <circle className={cx(styles.core, live && styles.coreLive)} cx="36" cy="36" r="4.5" />
    </svg>
  );
}

/**
 * Always in view, never in the way: the dock sits in its own row under the
 * workspace, so the consequences of a change can never move the control that
 * caused it. Its height is the same resting as it is full.
 */
export function BlastRadiusDock({
  radius,
  onKeep,
  onUndo,
}: {
  radius: BlastRadius;
  onKeep: () => void;
  onUndo: () => void;
}): React.JSX.Element {
  const all = rowsFor(radius);
  const rows = all.length > SHOWN ? all.slice(0, SHOWN - 1) : all;
  const hidden = all.length - rows.length;
  const live = !radius.isEmpty;
  const counts: Record<Ring, number> = {
    money: radius.changedLines.length + radius.addedLines.length + radius.removedLines.length,
    time: radius.movedDeadlines.length,
    work: radius.newTasks.length + radius.resolvedTasks.length,
  };
  // Replays the ripple whenever the shape of the change moves on.
  const pulse = `${String(radius.totalDelta)}-${String(rows.length)}`;

  return (
    <section className={cx(styles.dock, live && styles.dockLive)} aria-label="Blast radius">
      <div className={styles.inner}>
        <div className={styles.gauge} key={pulse}>
          <Rings counts={counts} live={live} />
        </div>

        <div className={styles.readout} role="status" aria-live="polite">
          <p className={styles.caption}>{live ? 'Pending change' : 'Blast radius'}</p>
          <p
            className={cx(
              styles.delta,
              live && radius.totalDelta > 0 && styles.deltaUp,
              live && radius.totalDelta < 0 && styles.deltaDown,
            )}
          >
            {live ? signedMoney(radius.totalDelta) : 'Nothing pending'}
          </p>
          {live ? (
            <p className={styles.counts}>
              <span className={cx(styles.tagMoney, counts.money === 0 && styles.tagQuiet)}>
                {tally(counts.money, 'no cost changes', 'one cost changes', '# costs change')}
              </span>
              <span className={cx(styles.tagTime, counts.time === 0 && styles.tagQuiet)}>
                {tally(counts.time, 'no date moves', 'a date moves', '# dates move')}
              </span>
              <span className={cx(styles.tagWork, counts.work === 0 && styles.tagQuiet)}>
                {tally(
                  counts.work,
                  'nothing new to do',
                  'one new thing to do',
                  '# new things to do',
                )}
              </span>
              {radius.newViolations.length > 0 ? (
                <span className={styles.tagBroken}>
                  {tally(
                    radius.newViolations.length,
                    '',
                    'something no longer works',
                    '# things no longer work',
                  )}
                </span>
              ) : null}
            </p>
          ) : (
            <p className={styles.counts}>
              <span>Move a lever to see what it sets off: money, dates, work.</span>
            </p>
          )}
        </div>

        <div className={styles.consequences}>
          {live ? (
            <ul className={styles.list}>
              {radius.newViolations.map((violation) => (
                <li key={violation.id} className={cx(styles.row, styles.rowBroken)}>
                  <span className={styles.what}>{violation.message}</span>
                  <span className={styles.detail}>{violation.hint}</span>
                </li>
              ))}
              {rows.map((row) => (
                <li key={row.key} className={cx(styles.row, styles[row.ring])}>
                  <span className={styles.what}>{row.what}</span>
                  <span className={styles.detail}>{row.detail}</span>
                </li>
              ))}
              {hidden > 0 ? (
                <li className={cx(styles.row, styles.rowMore)}>
                  <span className={styles.what}>and {plural(hidden, 'other change')}</span>
                  <span className={styles.detail} />
                </li>
              ) : null}
            </ul>
          ) : null}
        </div>

        <div className={styles.actions}>
          <Button variant="primary" onClick={onKeep} disabled={!live}>
            Keep this change
          </Button>
          <Button onClick={onUndo} disabled={!live}>
            Undo
          </Button>
        </div>
      </div>
    </section>
  );
}
