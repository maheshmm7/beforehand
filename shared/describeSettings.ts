import type { DescribeLever, DescribeSetting } from './api.ts';
import type { EventPack, VariableValues } from './engine/types.ts';

/**
 * Turns what the assistant understood into values the engine will accept.
 *
 * The model answers in text; only the pack knows whether a lever is a number
 * or a choice, what range it allows, and which options exist. Anything that
 * does not fit is dropped rather than coerced into nonsense, so a creative
 * reply can never put the plan into a state the engine would not produce.
 */
export function applyDescribedSettings(
  pack: EventPack,
  settings: readonly DescribeSetting[],
): VariableValues {
  const byId = new Map(pack.variables.map((variable) => [variable.id, variable]));
  const values: Record<string, number | string> = {};

  for (const setting of settings) {
    const variable = byId.get(setting.id);
    if (variable === undefined) continue;

    if (variable.kind === 'number') {
      const parsed = Number(setting.value.replace(/[,\s]/g, ''));
      if (!Number.isFinite(parsed)) continue;
      values[variable.id] = Math.min(variable.max, Math.max(variable.min, parsed));
      continue;
    }

    const option = variable.options.find(
      (one) => one.id === setting.value || one.label.toLowerCase() === setting.value.toLowerCase(),
    );
    if (option !== undefined) values[variable.id] = option.id;
  }

  return values;
}

/** Describes the pack's levers for the assistant, options included. */
export function describeLevers(pack: EventPack): DescribeLever[] {
  return pack.variables.map((variable) =>
    variable.kind === 'number'
      ? {
          id: variable.id,
          label: variable.label,
          kind: 'number',
          range: `${String(variable.min)} to ${String(variable.max)}`,
        }
      : {
          id: variable.id,
          label: variable.label,
          kind: 'choice',
          options: variable.options.map((option) => `${option.id} (${option.label})`),
        },
  );
}
