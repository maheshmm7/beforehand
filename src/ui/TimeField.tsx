import { useState } from 'react';
import { HOURS, MINUTES, readClock, shiftMinutes, timeLabel, writeClock } from '@/lib/clock';
import { cx } from './cx';
import { IconClock } from './icons';
import { Popover } from './Popover';
import styles from './pickers.module.css';

/**
 * Hours down one column, minutes down another, am or pm either side. The
 * browser's own time control is a spinner that reads like a form from 1998
 * and renders differently in every engine; this one is the same everywhere and
 * can be nudged from the keyboard without opening anything.
 */
export function TimeField({
  id,
  value,
  onChange,
  label,
  note = true,
}: {
  id: string;
  value: string;
  onChange: (hhmm: string) => void;
  label: string;
  note?: boolean;
}): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const clock = readClock(value);

  function set(part: Partial<typeof clock>): void {
    onChange(writeClock({ ...clock, ...part }));
  }

  return (
    <Popover
      id={id}
      open={open}
      onOpenChange={setOpen}
      title={label}
      trigger={
        <>
          <IconClock size={17} />
          <span className={styles.triggerText}>{timeLabel(value)}</span>
          {note ? (
            <span className={styles.triggerNote}>
              {clock.meridiem === 'am' ? 'morning' : clock.hour12 < 6 ? 'afternoon' : 'evening'}
            </span>
          ) : null}
        </>
      }
    >
      <div className={styles.clock}>
        <div className={styles.column} role="group" aria-label="Hour">
          {HOURS.map((hour) => (
            <button
              key={hour}
              type="button"
              aria-pressed={hour === clock.hour12}
              className={cx(styles.tick, hour === clock.hour12 && styles.tickOn)}
              onClick={() => {
                set({ hour12: hour });
              }}
            >
              {hour}
            </button>
          ))}
        </div>

        <div className={styles.columnWide} role="group" aria-label="Minutes">
          {MINUTES.map((minute) => (
            <button
              key={minute}
              type="button"
              aria-pressed={minute === clock.minute}
              className={cx(styles.tick, minute === clock.minute && styles.tickOn)}
              onClick={() => {
                set({ minute });
              }}
            >
              :{String(minute).padStart(2, '0')}
            </button>
          ))}
          <div className={styles.meridiem} role="group" aria-label="Morning or afternoon">
            {(['am', 'pm'] as const).map((meridiem) => (
              <button
                key={meridiem}
                type="button"
                aria-pressed={meridiem === clock.meridiem}
                className={cx(styles.tick, meridiem === clock.meridiem && styles.tickOn)}
                onClick={() => {
                  set({ meridiem });
                }}
              >
                {meridiem}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.panelFoot}>
        <button
          type="button"
          className={styles.quick}
          onClick={() => {
            onChange(shiftMinutes(value, -15));
          }}
        >
          −15 min
        </button>
        <button
          type="button"
          className={styles.quick}
          onClick={() => {
            onChange(shiftMinutes(value, 15));
          }}
        >
          +15 min
        </button>
      </div>
    </Popover>
  );
}
