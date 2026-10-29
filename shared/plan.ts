import { z } from 'zod';

/** One line of text a person typed or pasted. Bounded everywhere it is accepted. */
const shortText = z.string().trim().max(200);
const longText = z.string().trim().max(4000);

export const commitmentSchema = z.strictObject({
  id: shortText.min(1),
  ruleId: shortText.min(1),
  vendor: shortText.min(1),
  amount: z.number().min(-100_000_000).max(100_000_000),
  state: z.enum(['quoted', 'paid']),
  quote: longText,
  inclusions: z.array(shortText).max(20),
  exclusions: z.array(shortText).max(20),
});

export const variableValuesSchema = z.record(
  z.string().max(60),
  z.union([z.number(), z.string().max(60)]),
);

export const scenarioSchema = z.strictObject({
  id: shortText.min(1),
  name: shortText.min(1),
  values: variableValuesSchema,
  /** The last state the planner accepted. Changes are measured against it. */
  baseline: variableValuesSchema,
  commitments: z.array(commitmentSchema).max(200),
});

export const eventKindSchema = z.enum(['wedding', 'birthday', 'community']);

export const planSchema = z.strictObject({
  id: shortText.min(1),
  name: shortText.min(1),
  kind: eventKindSchema,
  place: shortText,
  eventDateIso: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  anchorTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  scenarios: z.array(scenarioSchema).min(1).max(8),
  activeScenarioId: shortText.min(1),
  updatedAt: z.string().max(40),
});

export const workspaceSchema = z.strictObject({
  version: z.literal(1),
  plans: z.array(planSchema).max(50),
  activePlanId: shortText.nullable(),
});

export type Commitment = z.infer<typeof commitmentSchema>;
export type EventKind = z.infer<typeof eventKindSchema>;
export type VariableValues = z.infer<typeof variableValuesSchema>;
export type Scenario = z.infer<typeof scenarioSchema>;
export type Plan = z.infer<typeof planSchema>;
export type Workspace = z.infer<typeof workspaceSchema>;

export const emptyWorkspace: Workspace = { version: 1, plans: [], activePlanId: null };

export function activeScenarioOf(plan: Plan): Scenario {
  const found = plan.scenarios.find((scenario) => scenario.id === plan.activeScenarioId);
  // A plan always has at least one scenario, so the fallback is never reached
  // in practice; it keeps the type honest without a non-null assertion.
  return found ?? plan.scenarios[0] ?? emptyScenario();
}

function emptyScenario(): Scenario {
  return { id: 'default', name: 'Plan A', values: {}, baseline: {}, commitments: [] };
}
