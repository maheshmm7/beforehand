const FULL = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/** Money, always whole units: nobody plans an event to the paisa. */
export function money(amount: number): string {
  return FULL.format(Math.round(amount));
}

/** Short form for headline figures: ₹15.7L, ₹1.2Cr. */
export function moneyShort(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  const size = Math.abs(amount);
  if (size >= 10_000_000) return `${sign}₹${(size / 10_000_000).toFixed(2)}Cr`;
  if (size >= 100_000) return `${sign}₹${(size / 100_000).toFixed(1)}L`;
  if (size >= 1000) return `${sign}₹${(size / 1000).toFixed(0)}k`;
  return money(amount);
}

export function signedMoney(amount: number): string {
  return amount > 0 ? `+${money(amount)}` : money(amount);
}

const DATE = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

const DATE_SHORT = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

export function longDate(iso: string): string {
  const time = Date.parse(`${iso}T00:00:00Z`);
  return Number.isNaN(time) ? iso : DATE.format(time);
}

export function shortDate(iso: string): string {
  const time = Date.parse(`${iso}T00:00:00Z`);
  return Number.isNaN(time) ? iso : DATE_SHORT.format(time);
}

export function todayIso(now: Date = new Date()): string {
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
    .toISOString()
    .slice(0, 10);
}

/** "124 days", "tomorrow", "today", "past". */
export function countdown(fromIso: string, toIso: string): string {
  const from = Date.parse(`${fromIso}T00:00:00Z`);
  const to = Date.parse(`${toIso}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to)) return '';
  const days = Math.round((to - from) / 86_400_000);
  if (days < 0) return 'past';
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  return `${String(days)} days`;
}

export function plural(count: number, one: string, many = `${one}s`): string {
  return `${String(count)} ${count === 1 ? one : many}`;
}
