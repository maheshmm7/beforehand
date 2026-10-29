import { describe, expect, it } from 'vitest';
import { contextFor, evaluate, evaluateCondition, expr as e } from './expr';
import { EngineError } from './errors';
import type { EventPack } from './types';

const pack: EventPack = {
  kind: 'wedding',
  label: 'Test',
  blurb: '',
  anchorLabel: 'Anchor',
  variables: [
    {
      kind: 'number',
      id: 'guests',
      label: 'Guests',
      min: 0,
      max: 1000,
      step: 10,
      fallback: 100,
      unit: 'guests',
    },
    { kind: 'number', id: 'plain', label: 'Plain', min: 0, max: 10, step: 1, fallback: 2 },
    {
      kind: 'choice',
      id: 'tier',
      label: 'Tier',
      fallback: 'low',
      options: [
        { id: 'low', label: 'Low' },
        { id: 'high', label: 'High' },
      ],
    },
  ],
  quantities: [
    { id: 'tables', label: 'tables', expr: e.perBlock(e.var('guests'), 10) },
    { id: 'selfish', label: 'selfish', expr: e.quantity('selfish') },
  ],
  costRules: [],
  constraints: [],
  tasks: [],
  runOfShow: [],
};

const ctx = (values: Record<string, number | string> = {}) => contextFor(pack, values);

describe('evaluate', () => {
  it('reads a constant', () => {
    expect(evaluate(e.const(7), ctx())).toEqual({ value: 7, text: '7' });
  });

  it('reads a variable and names its unit', () => {
    expect(evaluate(e.var('guests'), ctx({ guests: 350 }))).toEqual({
      value: 350,
      text: '350 guests',
    });
  });

  it('falls back to the pack default when a value is missing or not a number', () => {
    expect(evaluate(e.var('guests'), ctx()).value).toBe(100);
    expect(evaluate(e.var('guests'), ctx({ guests: 'many' })).value).toBe(100);
    expect(evaluate(e.var('guests'), ctx({ guests: Number.NaN })).value).toBe(100);
  });

  it('uses the variable label when there is no unit', () => {
    expect(evaluate(e.var('plain'), ctx()).text).toBe('2 Plain');
  });

  it('picks the number attached to the chosen option', () => {
    const amounts = { low: 450, high: 900 };
    expect(evaluate(e.choice('tier', amounts, 0), ctx({ tier: 'high' }))).toEqual({
      value: 900,
      text: '900 (High)',
    });
  });

  it('falls back when the chosen option has no number of its own', () => {
    expect(evaluate(e.choice('tier', { high: 900 }, 111), ctx({ tier: 'low' })).value).toBe(111);
  });

  it('falls back when the stored option is not one the pack offers', () => {
    expect(
      evaluate(e.choice('tier', { low: 1, high: 2 }, 0), ctx({ tier: 'nonsense' })).value,
    ).toBe(1);
  });

  it('rounds a block up, because you cannot hire two thirds of a table', () => {
    const result = evaluate(e.perBlock(e.var('guests'), 10), ctx({ guests: 341 }));

    expect(result.value).toBe(35);
    expect(result.text).toBe('341 guests ÷ 10 rounded up');
  });

  it('refuses a block size that is not positive', () => {
    expect(() => evaluate(e.perBlock(e.const(10), 0), ctx())).toThrow(EngineError);
  });

  it('scales, sums and multiplies, showing the working', () => {
    expect(evaluate(e.scale(e.const(35), 900), ctx())).toEqual({ value: 31500, text: '35 × 900' });
    expect(evaluate(e.sum(e.const(2), e.const(3)), ctx())).toEqual({ value: 5, text: '2 + 3' });
    expect(evaluate(e.product(e.const(4), e.const(5)), ctx())).toEqual({
      value: 20,
      text: '4 × 5',
    });
  });

  it('holds a floor without mentioning it when the floor is not reached', () => {
    expect(evaluate(e.atLeast(e.const(5), 2), ctx()).text).toBe('5');
    expect(evaluate(e.atLeast(e.const(1), 2), ctx())).toEqual({ value: 2, text: '1, minimum 2' });
  });

  it('resolves a quantity and remembers it', () => {
    const shared = ctx({ guests: 350 });

    expect(evaluate(e.quantity('tables'), shared)).toEqual({ value: 35, text: '35 tables' });
    expect(evaluate(e.quantity('tables'), shared).value).toBe(35);
  });

  it('refuses a quantity defined in terms of itself', () => {
    expect(() => evaluate(e.quantity('selfish'), ctx())).toThrow(/depends on itself/);
  });

  it('refuses an unknown variable or quantity', () => {
    expect(() => evaluate(e.var('ghost'), ctx())).toThrow(/Unknown variable/);
    expect(() => evaluate(e.quantity('ghost'), ctx())).toThrow(/Unknown quantity/);
  });

  it('refuses a variable used as the wrong kind', () => {
    expect(() => evaluate(e.var('tier'), ctx())).toThrow(/not a number/);
    expect(() => evaluate(e.choice('guests', {}, 0), ctx())).toThrow(/not a choice/);
  });
});

describe('evaluateCondition', () => {
  const values = { guests: 350, tier: 'high' };

  it('is always true for always', () => {
    expect(evaluateCondition({ op: 'always' }, ctx(values))).toBe(true);
  });

  it('matches a chosen option', () => {
    expect(evaluateCondition({ op: 'is', id: 'tier', value: 'high' }, ctx(values))).toBe(true);
    expect(evaluateCondition({ op: 'is', id: 'tier', value: 'low' }, ctx(values))).toBe(false);
  });

  it('compares every way round', () => {
    const left = e.var('guests');
    const right = e.const(350);
    const cases = [
      ['>', false],
      ['>=', true],
      ['<', false],
      ['<=', true],
      ['==', true],
    ] as const;

    for (const [cmp, expected] of cases) {
      expect(evaluateCondition({ op: 'compare', left, cmp, right }, ctx(values))).toBe(expected);
    }
  });

  it('combines conditions', () => {
    const yes = { op: 'always' } as const;
    const no = { op: 'not', of: yes } as const;

    expect(evaluateCondition({ op: 'and', of: [yes, no] }, ctx(values))).toBe(false);
    expect(evaluateCondition({ op: 'or', of: [yes, no] }, ctx(values))).toBe(true);
    expect(evaluateCondition(no, ctx(values))).toBe(false);
  });
});
