import { describe, expect, it } from 'vitest';
import { buildModel } from '../engine/model.ts';
import { defaultValues, packList } from './index.ts';
import type { Condition, EventPack, Expr, VariableValues } from '../engine/types.ts';

/** Every variable and quantity an expression leans on. */
function referencesIn(expr: Expr, into: { vars: Set<string>; quantities: Set<string> }): void {
  switch (expr.op) {
    case 'const':
      return;
    case 'var':
      into.vars.add(expr.id);
      return;
    case 'quantity':
      into.quantities.add(expr.id);
      return;
    case 'choice':
      into.vars.add(expr.id);
      return;
    case 'scale':
    case 'perBlock':
    case 'atLeast':
      referencesIn(expr.of, into);
      return;
    case 'sum':
    case 'product':
      for (const part of expr.of) referencesIn(part, into);
  }
}

function referencesInCondition(
  condition: Condition,
  into: { vars: Set<string>; quantities: Set<string> },
): void {
  switch (condition.op) {
    case 'always':
      return;
    case 'is':
      into.vars.add(condition.id);
      return;
    case 'compare':
      referencesIn(condition.left, into);
      referencesIn(condition.right, into);
      return;
    case 'and':
    case 'or':
      for (const part of condition.of) referencesInCondition(part, into);
      return;
    case 'not':
      referencesInCondition(condition.of, into);
  }
}

function allReferences(pack: EventPack): { vars: Set<string>; quantities: Set<string> } {
  const into = { vars: new Set<string>(), quantities: new Set<string>() };

  for (const quantity of pack.quantities) referencesIn(quantity.expr, into);
  for (const rule of pack.costRules) {
    referencesIn(rule.amount, into);
    if (rule.when !== undefined) referencesInCondition(rule.when, into);
  }
  for (const constraint of pack.constraints) referencesInCondition(constraint.when, into);
  for (const task of pack.tasks) referencesInCondition(task.when, into);
  for (const segment of pack.runOfShow) {
    if (segment.when !== undefined) referencesInCondition(segment.when, into);
  }

  return into;
}

/** Every value a lever can take, so each pack is exercised at its extremes. */
function corners(pack: EventPack): VariableValues[] {
  const base = defaultValues(pack);
  const result: VariableValues[] = [base];

  for (const variable of pack.variables) {
    if (variable.kind === 'number') {
      result.push({ ...base, [variable.id]: variable.min });
      result.push({ ...base, [variable.id]: variable.max });
    } else {
      for (const option of variable.options) result.push({ ...base, [variable.id]: option.id });
    }
  }

  return result;
}

function duplicates(ids: readonly string[]): readonly string[] {
  const seen = new Set<string>();
  return ids.filter((id) => (seen.has(id) ? true : (seen.add(id), false)));
}

describe.each(packList.map((pack) => [pack.label, pack] as const))('%s pack', (_label, pack) => {
  it('has something to say in every section', () => {
    expect(pack.variables.length).toBeGreaterThan(2);
    expect(pack.costRules.length).toBeGreaterThan(4);
    expect(pack.constraints.length).toBeGreaterThan(0);
    expect(pack.tasks.length).toBeGreaterThan(0);
    expect(pack.runOfShow.length).toBeGreaterThan(0);
    expect(pack.anchorLabel).not.toBe('');
  });

  it('gives everything a unique id', () => {
    expect(duplicates(pack.variables.map((v) => v.id))).toEqual([]);
    expect(duplicates(pack.quantities.map((q) => q.id))).toEqual([]);
    expect(duplicates(pack.costRules.map((r) => r.id))).toEqual([]);
    expect(duplicates(pack.constraints.map((c) => c.id))).toEqual([]);
    expect(duplicates(pack.tasks.map((t) => t.id))).toEqual([]);
    expect(duplicates(pack.runOfShow.map((s) => s.id))).toEqual([]);
  });

  it('only refers to variables and quantities it defines', () => {
    const { vars, quantities } = allReferences(pack);
    const knownVars = new Set(pack.variables.map((v) => v.id));
    const knownQuantities = new Set(pack.quantities.map((q) => q.id));

    expect([...vars].filter((id) => !knownVars.has(id))).toEqual([]);
    expect([...quantities].filter((id) => !knownQuantities.has(id))).toEqual([]);
  });

  it('gives every choice variable a default it actually offers', () => {
    for (const variable of pack.variables) {
      if (variable.kind !== 'choice') continue;
      expect(variable.options.map((option) => option.id)).toContain(variable.fallback);
      expect(duplicates(variable.options.map((option) => option.id))).toEqual([]);
    }
  });

  it('keeps every numeric default inside its own range', () => {
    for (const variable of pack.variables) {
      if (variable.kind !== 'number') continue;
      expect(variable.fallback).toBeGreaterThanOrEqual(variable.min);
      expect(variable.fallback).toBeLessThanOrEqual(variable.max);
      expect(variable.step).toBeGreaterThan(0);
    }
  });

  it('asks for every decision before the event, never after', () => {
    for (const values of corners(pack)) {
      const model = buildModel(pack, {
        values,
        eventDateIso: '2027-03-02',
        anchorTime: '10:00',
        commitments: [],
      });
      for (const deadline of model.deadlines) {
        expect(deadline.daysBefore).toBeGreaterThanOrEqual(0);
        expect(deadline.dateIso <= '2027-03-02').toBe(true);
      }
    }
  });

  it('produces whole, finite numbers at every corner of its own ranges', () => {
    for (const values of corners(pack)) {
      const model = buildModel(pack, {
        values,
        eventDateIso: '2027-03-02',
        anchorTime: '10:00',
        commitments: [],
      });

      expect(Number.isFinite(model.totals.all)).toBe(true);
      for (const line of model.lines) {
        expect(Number.isInteger(line.estimate)).toBe(true);
        expect(line.basis).not.toBe('');
        expect(line.basis).not.toContain('NaN');
      }
      for (const deadline of model.deadlines) {
        expect(deadline.dateIso).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
      for (const segment of model.runOfShow) {
        expect(segment.startsAt).toMatch(/^\d{2}:\d{2}$/);
      }
    }
  });

  it('costs more when more people come', () => {
    const headcount = pack.variables.find((v) => v.kind === 'number' && v.id !== 'volunteers');
    if (headcount?.kind !== 'number') return;

    const base = defaultValues(pack);
    const shared = { eventDateIso: '2027-03-02', anchorTime: '10:00', commitments: [] };

    const fewer = buildModel(pack, {
      ...shared,
      values: { ...base, [headcount.id]: headcount.min },
    });
    const more = buildModel(pack, {
      ...shared,
      values: { ...base, [headcount.id]: headcount.max },
    });

    expect(more.totals.all).toBeGreaterThan(fewer.totals.all);
  });
});

describe('the community pack', () => {
  it('can come out in credit, because income is a negative line', () => {
    const pack = packList.find((one) => one.kind === 'community');
    expect(pack).toBeDefined();
    if (pack === undefined) return;

    const values = { ...defaultValues(pack), attendees: 100, sponsorship: 1000000 };
    const model = buildModel(pack, {
      values,
      eventDateIso: '2027-03-02',
      anchorTime: '10:00',
      commitments: [],
    });

    expect(model.totals.all).toBeLessThan(0);
    expect(model.lines.some((line) => line.category === 'income' && line.amount < 0)).toBe(true);
  });
});
