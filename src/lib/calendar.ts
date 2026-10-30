/**
 * Calendar arithmetic on ISO dates, in UTC, matching the engine's schedule
 * module. Nothing here touches the local time zone, so a plan dated the 2nd is
 * the 2nd in Hyderabad and in Toronto alike.
 */

const DAY = 86_400_000;

function parse(iso: string): number {
  return Date.parse(`${iso}T00:00:00Z`);
}

function toIso(time: number): string {
  return new Date(time).toISOString().slice(0, 10);
}

export function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parse(value));
}

/** The first of the month a date falls in. */
export function startOfMonth(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

export function addMonths(iso: string, count: number): string {
  const at = new Date(parse(iso));
  const target = at.getUTCMonth() + count;
  const year = at.getUTCFullYear() + Math.floor(target / 12);
  const month = ((target % 12) + 12) % 12;
  const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return toIso(Date.UTC(year, month, Math.min(at.getUTCDate(), last)));
}

export function addDays(iso: string, count: number): string {
  return toIso(parse(iso) + count * DAY);
}

export function sameMonth(a: string, b: string): boolean {
  return a.slice(0, 7) === b.slice(0, 7);
}

const MONTH = new Intl.DateTimeFormat('en-GB', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export function monthLabel(iso: string): string {
  return MONTH.format(parse(iso));
}

/** Monday first, the convention almost everywhere the app is meant to work. */
export const WEEKDAYS: readonly string[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Six weeks of dates covering the month a date falls in, always 42 long so the
 * grid is the same height in February as in August and the popover never
 * changes size as you page through the year.
 */
export function monthGrid(iso: string): readonly string[] {
  const first = parse(startOfMonth(iso));
  const weekday = (new Date(first).getUTCDay() + 6) % 7;
  const start = first - weekday * DAY;
  return Array.from({ length: 42 }, (_unused, index) => toIso(start + index * DAY));
}

export function dayOfMonth(iso: string): number {
  return Number(iso.slice(8, 10));
}
