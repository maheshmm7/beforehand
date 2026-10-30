import { useEffect, useRef, useState } from 'react';
import {
  WEEKDAYS,
  addDays,
  addMonths,
  dayOfMonth,
  monthGrid,
  monthLabel,
  sameMonth,
  startOfMonth,
} from '@/lib/calendar';
import { countdown, longDate, todayIso } from '@/lib/format';
import { cx } from './cx';
import { IconCalendar, IconChevron } from './icons';
import { Popover } from './Popover';
import styles from './pickers.module.css';

/** Six weeks of seven days, so every month fills the same box. */
function weeksOf(iso: string): string[][] {
  const days = monthGrid(iso);
  return Array.from({ length: 6 }, (_unused, week) => [...days.slice(week * 7, week * 7 + 7)]);
}

/** The distances people actually pick when a date is still loose. */
const QUICK = [
  { days: 30, label: '1 mo', spoken: 'In one month' },
  { days: 90, label: '3 mo', spoken: 'In three months' },
  { days: 180, label: '6 mo', spoken: 'In six months' },
] as const;

/** How far an arrow key moves, in days. */
const STEPS: Readonly<Record<string, number>> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -7,
  ArrowDown: 7,
};

/**
 * A calendar in the application's own hand rather than the browser's. The
 * native control paints its own blue grid in its own font, which looked
 * borrowed from another product in the middle of this one.
 *
 * Every month is drawn as six weeks, so the panel is one size forever.
 */
export function DateField({
  id,
  value,
  onChange,
  min,
  label,
  note = true,
}: {
  id: string;
  value: string;
  onChange: (iso: string) => void;
  /** The earliest selectable day, if there is one. */
  min?: string;
  /** Names the panel; the visible label belongs to the field around it. */
  label: string;
  /** Whether the closed field also says how far away the date is. Off where
   *  something nearby already says it. */
  note?: boolean;
}): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(value);
  const grid = useRef<HTMLDivElement>(null);
  const today = todayIso();

  useEffect(() => {
    if (!open) return;
    const cell = grid.current?.querySelector<HTMLButtonElement>(`[data-iso="${cursor}"]`);
    cell?.focus();
  }, [open, cursor]);

  const blocked = (iso: string): boolean => min !== undefined && iso < min;

  function move(to: string): void {
    setCursor(blocked(to) && min !== undefined ? min : to);
  }

  function pick(iso: string): void {
    if (blocked(iso)) return;
    onChange(iso);
    setOpen(false);
  }

  return (
    <Popover
      id={id}
      open={open}
      onOpenChange={(next) => {
        if (next) setCursor(value);
        setOpen(next);
      }}
      title={label}
      trigger={
        <>
          <IconCalendar size={17} />
          <span className={styles.triggerText}>{longDate(value)}</span>
          {note ? <span className={styles.triggerNote}>{countdown(today, value)}</span> : null}
        </>
      }
    >
      <div className={styles.panelHead}>
        <button
          type="button"
          className={styles.step}
          aria-label="Previous month"
          onClick={() => {
            move(addMonths(startOfMonth(cursor), -1));
          }}
        >
          <span className={styles.stepBack}>
            <IconChevron size={16} />
          </span>
        </button>
        <span className={styles.panelTitle} aria-live="polite">
          {monthLabel(cursor)}
        </span>
        <button
          type="button"
          className={styles.step}
          aria-label="Next month"
          onClick={() => {
            move(addMonths(startOfMonth(cursor), 1));
          }}
        >
          <IconChevron size={16} />
        </button>
      </div>

      <div className={styles.weekdays} aria-hidden="true">
        {WEEKDAYS.map((day) => (
          <span key={day}>{day.slice(0, 2)}</span>
        ))}
      </div>

      <div className={styles.days} role="grid" aria-label={monthLabel(cursor)} ref={grid}>
        {weeksOf(cursor).map((week) => (
          <div key={week[0]} className={styles.week} role="row">
            {week.map((iso) => (
              <button
                key={iso}
                type="button"
                role="gridcell"
                data-iso={iso}
                tabIndex={iso === cursor ? 0 : -1}
                disabled={blocked(iso)}
                aria-selected={iso === value}
                aria-current={iso === today ? 'date' : undefined}
                // The number alone says "5" twice in a month that shows two
                // fifths; the whole date says which one.
                aria-label={longDate(iso)}
                className={cx(
                  styles.day,
                  !sameMonth(iso, cursor) && styles.dayOutside,
                  iso === value && styles.daySelected,
                  iso === today && styles.dayToday,
                )}
                onClick={() => {
                  pick(iso);
                }}
                onKeyDown={(event) => {
                  const step = STEPS[event.key];
                  if (step !== undefined) {
                    event.preventDefault();
                    move(addDays(cursor, step));
                    return;
                  }
                  if (event.key === 'PageUp' || event.key === 'PageDown') {
                    event.preventDefault();
                    move(addMonths(cursor, event.key === 'PageUp' ? -1 : 1));
                  }
                }}
              >
                <span aria-hidden="true">{dayOfMonth(iso)}</span>
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className={styles.panelFoot}>
        <button
          type="button"
          className={styles.quick}
          onClick={() => {
            pick(blocked(today) && min !== undefined ? min : today);
          }}
        >
          Today
        </button>
        {QUICK.map((jump) => (
          <button
            key={jump.days}
            type="button"
            className={styles.quick}
            aria-label={jump.spoken}
            onClick={() => {
              pick(addDays(today, jump.days));
            }}
          >
            {jump.label}
          </button>
        ))}
      </div>
    </Popover>
  );
}
