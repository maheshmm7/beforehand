import { daysBetween } from './schedule';
import type { ActiveTask, CostLine, Deadline, Model, Violation } from './types';

export interface LineChange {
  readonly ruleId: string;
  readonly label: string;
  readonly from: number;
  readonly to: number;
  readonly delta: number;
}

export interface DeadlineMove {
  readonly id: string;
  readonly label: string;
  readonly from: string;
  readonly to: string;
  /** Negative when the deadline moved earlier, which is the one that hurts. */
  readonly days: number;
}

/** Everything one change set off. */
export interface BlastRadius {
  readonly totalDelta: number;
  readonly changedLines: readonly LineChange[];
  readonly addedLines: readonly CostLine[];
  readonly removedLines: readonly CostLine[];
  readonly newTasks: readonly ActiveTask[];
  readonly resolvedTasks: readonly ActiveTask[];
  readonly newViolations: readonly Violation[];
  readonly resolvedViolations: readonly Violation[];
  readonly movedDeadlines: readonly DeadlineMove[];
  readonly isEmpty: boolean;
}

function byId<T extends { readonly id: string }>(items: readonly T[]): ReadonlyMap<string, T> {
  return new Map(items.map((item) => [item.id, item]));
}

function linesById(lines: readonly CostLine[]): ReadonlyMap<string, CostLine> {
  return new Map(lines.map((line) => [line.ruleId, line]));
}

function missingFrom<T extends { readonly id: string }>(
  items: readonly T[],
  other: ReadonlyMap<string, T>,
): readonly T[] {
  return items.filter((item) => !other.has(item.id));
}

/**
 * Compares two evaluated plans. This is the product: not the new total, but
 * what the change did to everything hanging off it.
 */
export function blastRadius(before: Model, after: Model): BlastRadius {
  const beforeLines = linesById(before.lines);
  const afterLines = linesById(after.lines);

  const changedLines: LineChange[] = [];
  for (const [ruleId, line] of afterLines) {
    const previous = beforeLines.get(ruleId);
    if (previous === undefined || previous.amount === line.amount) continue;
    changedLines.push({
      ruleId,
      label: line.label,
      from: previous.amount,
      to: line.amount,
      delta: line.amount - previous.amount,
    });
  }
  changedLines.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  const beforeTasks = byId(before.tasks);
  const afterTasks = byId(after.tasks);
  const beforeViolations = byId(before.violations);
  const afterViolations = byId(after.violations);
  const beforeDeadlines = byId(before.deadlines);

  const movedDeadlines: DeadlineMove[] = [];
  for (const deadline of after.deadlines) {
    const previous: Deadline | undefined = beforeDeadlines.get(deadline.id);
    if (previous === undefined || previous.dateIso === deadline.dateIso) continue;
    movedDeadlines.push({
      id: deadline.id,
      label: deadline.label,
      from: previous.dateIso,
      to: deadline.dateIso,
      days: daysBetween(previous.dateIso, deadline.dateIso),
    });
  }
  movedDeadlines.sort((a, b) => a.days - b.days);

  const addedLines = after.lines.filter((line) => !beforeLines.has(line.ruleId));
  const removedLines = before.lines.filter((line) => !afterLines.has(line.ruleId));
  const newTasks = missingFrom(after.tasks, beforeTasks);
  const resolvedTasks = missingFrom(before.tasks, afterTasks);
  const newViolations = missingFrom(after.violations, beforeViolations);
  const resolvedViolations = missingFrom(before.violations, afterViolations);

  const totalDelta = after.totals.all - before.totals.all;

  return {
    totalDelta,
    changedLines,
    addedLines,
    removedLines,
    newTasks,
    resolvedTasks,
    newViolations,
    resolvedViolations,
    movedDeadlines,
    isEmpty:
      totalDelta === 0 &&
      changedLines.length === 0 &&
      addedLines.length === 0 &&
      removedLines.length === 0 &&
      newTasks.length === 0 &&
      resolvedTasks.length === 0 &&
      newViolations.length === 0 &&
      resolvedViolations.length === 0 &&
      movedDeadlines.length === 0,
  };
}
