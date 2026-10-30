/**
 * Times are stored as 24-hour `HH:MM`, which is what the schedule works in,
 * and shown in whichever form a person reads fastest: 5:00 pm, not 17:00.
 */

export interface Clock {
  readonly hour12: number;
  readonly minute: number;
  readonly meridiem: 'am' | 'pm';
}

export function isTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function minutesOf(hhmm: string): number {
  const hours = Number(hhmm.slice(0, 2));
  const minutes = Number(hhmm.slice(3, 5));
  return hours * 60 + minutes;
}

function fromMinutes(total: number): string {
  const wrapped = ((total % 1440) + 1440) % 1440;
  const hours = Math.floor(wrapped / 60);
  const minutes = wrapped % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function readClock(hhmm: string): Clock {
  const hours = Number(hhmm.slice(0, 2));
  return {
    hour12: hours % 12 === 0 ? 12 : hours % 12,
    minute: Number(hhmm.slice(3, 5)),
    meridiem: hours < 12 ? 'am' : 'pm',
  };
}

export function writeClock(clock: Clock): string {
  const base = clock.hour12 % 12;
  const hours = clock.meridiem === 'pm' ? base + 12 : base;
  return fromMinutes(hours * 60 + clock.minute);
}

/** Moves by a number of minutes, wrapping past midnight rather than clamping. */
export function shiftMinutes(hhmm: string, delta: number): string {
  return fromMinutes(minutesOf(hhmm) + delta);
}

export function timeLabel(hhmm: string): string {
  const clock = readClock(hhmm);
  return `${String(clock.hour12)}:${String(clock.minute).padStart(2, '0')} ${clock.meridiem}`;
}

export const HOURS: readonly number[] = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
export const MINUTES: readonly number[] = [0, 15, 30, 45];
