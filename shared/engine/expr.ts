import { createContext, type EvalContext } from './context';
import { EngineError } from './errors';
import type { Comparator, Condition, EventPack, Expr, VariableValues } from './types';

export interface Evaluated {
  readonly value: number;
  /** The arithmetic in words, so every number on screen can show its working. */
  readonly text: string;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function show(value: number): string {
  return String(round(value));
}

function withUnit(value: number, unit: string): string {
  return unit === '' ? show(value) : `${show(value)} ${unit}`;
}

/** Evaluates an expression and describes how it got there. */
export function evaluate(expr: Expr, ctx: EvalContext): Evaluated {
  switch (expr.op) {
    case 'const':
      return { value: expr.value, text: show(expr.value) };

    case 'var': {
      const value = ctx.numberOf(expr.id);
      return { value, text: withUnit(value, ctx.unitOf(expr.id)) };
    }

    case 'quantity': {
      const value = ctx.quantityOf(expr.id);
      return { value, text: withUnit(value, ctx.unitOf(expr.id)) };
    }

    case 'choice': {
      const chosen = ctx.optionOf(expr.id);
      const value = expr.values[chosen] ?? expr.fallback;
      return { value, text: `${show(value)} (${ctx.optionLabelOf(expr.id)})` };
    }

    case 'scale': {
      const inner = evaluate(expr.of, ctx);
      return { value: inner.value * expr.by, text: `${inner.text} × ${show(expr.by)}` };
    }

    case 'perBlock': {
      if (expr.size <= 0) throw new EngineError('perBlock needs a positive size');
      const inner = evaluate(expr.of, ctx);
      return {
        value: Math.ceil(inner.value / expr.size),
        text: `${inner.text} ÷ ${show(expr.size)} rounded up`,
      };
    }

    case 'sum': {
      const parts = expr.of.map((one) => evaluate(one, ctx));
      return {
        value: parts.reduce((total, part) => total + part.value, 0),
        text: parts.map((part) => part.text).join(' + '),
      };
    }

    case 'product': {
      const parts = expr.of.map((one) => evaluate(one, ctx));
      return {
        value: parts.reduce((total, part) => total * part.value, 1),
        text: parts.map((part) => part.text).join(' × '),
      };
    }

    case 'atLeast': {
      const inner = evaluate(expr.of, ctx);
      if (inner.value >= expr.floor) return inner;
      return { value: expr.floor, text: `${inner.text}, minimum ${show(expr.floor)}` };
    }
  }
}

function compare(left: number, cmp: Comparator, right: number): boolean {
  switch (cmp) {
    case '>':
      return left > right;
    case '>=':
      return left >= right;
    case '<':
      return left < right;
    case '<=':
      return left <= right;
    case '==':
      return left === right;
  }
}

export function evaluateCondition(condition: Condition, ctx: EvalContext): boolean {
  switch (condition.op) {
    case 'always':
      return true;

    case 'is':
      return ctx.optionOf(condition.id) === condition.value;

    case 'compare':
      return compare(
        evaluate(condition.left, ctx).value,
        condition.cmp,
        evaluate(condition.right, ctx).value,
      );

    case 'and':
      return condition.of.every((one) => evaluateCondition(one, ctx));

    case 'or':
      return condition.of.some((one) => evaluateCondition(one, ctx));

    case 'not':
      return !evaluateCondition(condition.of, ctx);
  }
}

export function contextFor(pack: EventPack, values: VariableValues): EvalContext {
  return createContext(pack, values, (id, ctx) => evaluate(ctx.quantity(id).expr, ctx).value);
}

export const expr = {
  const: (value: number): Expr => ({ op: 'const', value }),
  var: (id: string): Expr => ({ op: 'var', id }),
  quantity: (id: string): Expr => ({ op: 'quantity', id }),
  choice: (id: string, values: Record<string, number>, fallback: number): Expr => ({
    op: 'choice',
    id,
    values,
    fallback,
  }),
  scale: (of: Expr, by: number): Expr => ({ op: 'scale', of, by }),
  perBlock: (of: Expr, size: number): Expr => ({ op: 'perBlock', of, size }),
  sum: (...of: Expr[]): Expr => ({ op: 'sum', of }),
  product: (...of: Expr[]): Expr => ({ op: 'product', of }),
  atLeast: (of: Expr, floor: number): Expr => ({ op: 'atLeast', of, floor }),
};
