import { EngineError } from './errors.ts';
import type {
  EventPack,
  QuantityDef,
  QuantityId,
  VariableDef,
  VariableId,
  VariableValues,
} from './types.ts';

export interface EvalContext {
  readonly pack: EventPack;
  /** The current value of a numeric variable, falling back to the pack default. */
  numberOf: (id: VariableId) => number;
  /** The chosen option id of a choice variable. */
  optionOf: (id: VariableId) => string;
  /** A derived value, computed once and remembered. */
  quantityOf: (id: QuantityId) => number;
  variable: (id: VariableId) => VariableDef;
  quantity: (id: QuantityId) => QuantityDef;
  /** The words to describe a variable or quantity in a trace. */
  unitOf: (id: string) => string;
  /** The label of the chosen option, for readable traces. */
  optionLabelOf: (id: VariableId) => string;
}

function index<T extends { readonly id: string }>(items: readonly T[]): ReadonlyMap<string, T> {
  return new Map(items.map((item) => [item.id, item]));
}

/**
 * Binds a pack to a set of values. Quantities are evaluated lazily, cached, and
 * guarded against a pack that defines a quantity in terms of itself.
 */
export function createContext(
  pack: EventPack,
  values: VariableValues,
  evaluateExpr: (id: QuantityId, ctx: EvalContext) => number,
): EvalContext {
  const variables = index(pack.variables);
  const quantities = index(pack.quantities);
  const cache = new Map<QuantityId, number>();
  const inProgress = new Set<QuantityId>();

  const variable = (id: VariableId): VariableDef => {
    const found = variables.get(id);
    if (found === undefined) throw new EngineError(`Unknown variable "${id}"`);
    return found;
  };

  const quantity = (id: QuantityId): QuantityDef => {
    const found = quantities.get(id);
    if (found === undefined) throw new EngineError(`Unknown quantity "${id}"`);
    return found;
  };

  const ctx: EvalContext = {
    pack,

    numberOf: (id) => {
      const def = variable(id);
      if (def.kind !== 'number') throw new EngineError(`Variable "${id}" is not a number`);
      const value = values[id];
      return typeof value === 'number' && Number.isFinite(value) ? value : def.fallback;
    },

    optionOf: (id) => {
      const def = variable(id);
      if (def.kind !== 'choice') throw new EngineError(`Variable "${id}" is not a choice`);
      const value = values[id];
      if (typeof value === 'string' && def.options.some((option) => option.id === value)) {
        return value;
      }
      return def.fallback;
    },

    quantityOf: (id) => {
      const cached = cache.get(id);
      if (cached !== undefined) return cached;
      if (inProgress.has(id)) throw new EngineError(`Quantity "${id}" depends on itself`);

      inProgress.add(id);
      try {
        const value = evaluateExpr(id, ctx);
        cache.set(id, value);
        return value;
      } finally {
        inProgress.delete(id);
      }
    },

    variable,
    quantity,

    unitOf: (id) => {
      const asVariable = variables.get(id);
      if (asVariable !== undefined) {
        return asVariable.kind === 'number' ? (asVariable.unit ?? asVariable.label) : '';
      }
      return quantities.get(id)?.label ?? '';
    },

    optionLabelOf: (id) => {
      const def = variable(id);
      if (def.kind !== 'choice') throw new EngineError(`Variable "${id}" is not a choice`);
      const chosen = ctx.optionOf(id);
      return def.options.find((option) => option.id === chosen)?.label ?? chosen;
    },
  };

  return ctx;
}
