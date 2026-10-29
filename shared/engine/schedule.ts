import { evaluateCondition } from './expr';
import type { EvalContext } from './context';
import { EngineError } from './errors';
import type { ActiveTask, CostLine, Deadline, EventPack, ScheduledSegment } from './types';

const DAY_MS = 86_400_000;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Date arithmetic in UTC only, so a plan never shifts by a day across zones. */
export function shiftDays(dateIso: string, days: number): string {
  if (!DATE_PATTERN.test(dateIso)) throw new EngineError(`Not a plain date: "${dateIso}"`);
  const base = Date.parse(`${dateIso}T00:00:00Z`);
  if (Number.isNaN(base)) throw new EngineError(`Not a real date: "${dateIso}"`);
  return new Date(base + days * DAY_MS).toISOString().slice(0, 10);
}

export function daysBetween(fromIso: string, toIso: string): number {
  const from = Date.parse(`${fromIso}T00:00:00Z`);
  const to = Date.parse(`${toIso}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to)) throw new EngineError('Not a real date');
  return Math.round((to - from) / DAY_MS);
}

function toMinutes(time: string): number {
  const match = TIME_PATTERN.exec(time);
  if (match === null) throw new EngineError(`Not a time of day: "${time}"`);
  return Number(match[1]) * 60 + Number(match[2]);
}

function toTime(minutes: number): string {
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  const hours = Math.floor(wrapped / 60);
  return `${String(hours).padStart(2, '0')}:${String(wrapped % 60).padStart(2, '0')}`;
}

/**
 * Decision deadlines, not task deadlines: the date by which a choice has to be
 * made for the plan behind it to still be possible. A decision with money
 * already paid against it is marked locked.
 */
export function deadlinesFor(
  lines: readonly CostLine[],
  tasks: readonly ActiveTask[],
  eventDateIso: string,
): readonly Deadline[] {
  const byDecision = new Map<string, { days: number; locked: boolean }>();

  for (const line of lines) {
    const current = byDecision.get(line.decision);
    byDecision.set(line.decision, {
      days: Math.max(current?.days ?? 0, line.leadTimeDays),
      locked: (current?.locked ?? false) || line.state === 'paid',
    });
  }

  const fromDecisions = [...byDecision].map(([decision, { days, locked }]) => ({
    id: `decision:${decision}`,
    label: decision,
    dateIso: shiftDays(eventDateIso, -days),
    daysBefore: days,
    locked,
  }));

  const fromTasks = tasks.map((task) => ({
    id: `task:${task.id}`,
    label: task.label,
    dateIso: shiftDays(eventDateIso, -task.leadTimeDays),
    daysBefore: task.leadTimeDays,
    locked: false,
  }));

  return [...fromDecisions, ...fromTasks].sort(
    (a, b) => a.dateIso.localeCompare(b.dateIso) || a.label.localeCompare(b.label),
  );
}

/** The day itself, laid out backwards from the one fixed moment. */
export function runOfShowFor(
  pack: EventPack,
  ctx: EvalContext,
  anchorTime: string,
): readonly ScheduledSegment[] {
  const active = pack.runOfShow.filter(
    (segment) => segment.when === undefined || evaluateCondition(segment.when, ctx),
  );
  const total = active.reduce((sum, segment) => sum + segment.durationMin, 0);

  let cursor = toMinutes(anchorTime) - total;

  return active.map((segment) => {
    const startsAt = toTime(cursor);
    cursor += segment.durationMin;
    return {
      id: segment.id,
      label: segment.label,
      startsAt,
      endsAt: toTime(cursor),
      durationMin: segment.durationMin,
    };
  });
}
