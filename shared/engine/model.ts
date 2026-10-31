import { contextFor, evaluate, evaluateCondition } from './expr.ts';
import { deadlinesFor, runOfShowFor } from './schedule.ts';
import type { EvalContext } from './context.ts';
import type {
  ActiveTask,
  Commitment,
  CostLine,
  EventPack,
  Expr,
  Model,
  Totals,
  Violation,
  VariableValues,
} from './types.ts';

export interface PlanInputs {
  readonly values: VariableValues;
  /** Plain date, YYYY-MM-DD. */
  readonly eventDateIso: string;
  /** The anchor moment on the day, HH:MM. */
  readonly anchorTime: string;
  readonly commitments: readonly Commitment[];
}

/** A lead time may be a flat number of days or an expression over the plan. */
function leadDays(value: number | Expr, ctx: EvalContext): number {
  if (typeof value === 'number') return value;
  return Math.max(0, Math.ceil(evaluate(value, ctx).value));
}

function totalsFor(lines: readonly CostLine[]): Totals {
  let paid = 0;
  let quoted = 0;
  let estimated = 0;

  for (const line of lines) {
    if (line.state === 'paid') paid += line.amount;
    else if (line.state === 'quoted') quoted += line.amount;
    else estimated += line.amount;
  }

  return { all: paid + quoted + estimated, paid, quoted, estimated, movable: estimated };
}

/**
 * Evaluates a whole plan: what it costs, what is still only a guess, what
 * breaks, what has to be decided when, and how the day runs.
 *
 * Deterministic and pure. No AI touches any of these numbers.
 */
export function buildModel(pack: EventPack, inputs: PlanInputs): Model {
  const ctx = contextFor(pack, inputs.values);

  const byRule = new Map<string, Commitment>();
  for (const commitment of inputs.commitments) byRule.set(commitment.ruleId, commitment);

  const lines: CostLine[] = [];
  for (const rule of pack.costRules) {
    if (rule.when !== undefined && !evaluateCondition(rule.when, ctx)) continue;

    const { value, text } = evaluate(rule.amount, ctx);
    const estimate = Math.round(value);
    const commitment = byRule.get(rule.id);

    lines.push({
      ruleId: rule.id,
      label: rule.label,
      category: rule.category,
      decision: rule.decision,
      estimate,
      amount: commitment?.amount ?? estimate,
      state: commitment?.state ?? 'estimated',
      basis: text,
      leadTimeDays: leadDays(rule.leadTimeDays, ctx),
      ...(commitment === undefined ? {} : { vendor: commitment.vendor, quote: commitment.quote }),
    });
  }

  const violations: Violation[] = pack.constraints
    .filter((constraint) => evaluateCondition(constraint.when, ctx))
    .map(({ id, severity, message, hint }) => ({ id, severity, message, hint }));

  const tasks: ActiveTask[] = pack.tasks
    .filter((task) => evaluateCondition(task.when, ctx))
    .map(({ id, label, leadTimeDays }) => ({
      id,
      label,
      leadTimeDays: leadDays(leadTimeDays, ctx),
    }));

  return {
    lines,
    totals: totalsFor(lines),
    violations,
    tasks,
    deadlines: deadlinesFor(lines, tasks, inputs.eventDateIso),
    runOfShow: runOfShowFor(pack, ctx, inputs.anchorTime),
  };
}
