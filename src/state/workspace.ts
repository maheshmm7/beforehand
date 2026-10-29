import { defaultValues, packFor } from '@shared/packs';
import {
  activeScenarioOf,
  type Commitment,
  type EventKind,
  type Plan,
  type Scenario,
  type VariableValues,
  type Workspace,
} from '@shared/plan';

export type Action =
  | { type: 'createPlan'; plan: Plan }
  | { type: 'deletePlan'; planId: string }
  | { type: 'selectPlan'; planId: string | null }
  | { type: 'renamePlan'; planId: string; name: string }
  | { type: 'setPlanDate'; planId: string; eventDateIso: string }
  | { type: 'setAnchorTime'; planId: string; anchorTime: string }
  | { type: 'setPlace'; planId: string; place: string }
  | { type: 'setValue'; planId: string; variableId: string; value: number | string }
  | { type: 'keepChanges'; planId: string }
  | { type: 'revertChanges'; planId: string }
  | { type: 'addScenario'; planId: string; scenarioId: string; name: string }
  | { type: 'selectScenario'; planId: string; scenarioId: string }
  | { type: 'renameScenario'; planId: string; scenarioId: string; name: string }
  | { type: 'deleteScenario'; planId: string; scenarioId: string }
  | { type: 'addCommitment'; planId: string; commitment: Commitment }
  | { type: 'removeCommitment'; planId: string; commitmentId: string };

/** A short, collision-resistant id. Generated in an event handler, never
 *  during render. */
export function newId(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${random}`;
}

export function newPlan(options: {
  id: string;
  name: string;
  kind: EventKind;
  place: string;
  eventDateIso: string;
  anchorTime: string;
  scenarioId: string;
}): Plan {
  const values = defaultValues(packFor(options.kind));
  return {
    id: options.id,
    name: options.name,
    kind: options.kind,
    place: options.place,
    eventDateIso: options.eventDateIso,
    anchorTime: options.anchorTime,
    activeScenarioId: options.scenarioId,
    updatedAt: new Date().toISOString(),
    scenarios: [
      { id: options.scenarioId, name: 'Plan A', values, baseline: values, commitments: [] },
    ],
  };
}

function mapPlan(state: Workspace, planId: string, change: (plan: Plan) => Plan): Workspace {
  const index = state.plans.findIndex((plan) => plan.id === planId);
  const existing = state.plans[index];
  if (existing === undefined) return state;

  const plans = [...state.plans];
  plans[index] = { ...change(existing), updatedAt: new Date().toISOString() };
  return { ...state, plans };
}

function mapActiveScenario(plan: Plan, change: (scenario: Scenario) => Scenario): Plan {
  return {
    ...plan,
    scenarios: plan.scenarios.map((scenario) =>
      scenario.id === plan.activeScenarioId ? change(scenario) : scenario,
    ),
  };
}

function withValue(values: VariableValues, id: string, value: number | string): VariableValues {
  return { ...values, [id]: value };
}

export function reduce(state: Workspace, action: Action): Workspace {
  switch (action.type) {
    case 'createPlan':
      return { ...state, plans: [action.plan, ...state.plans], activePlanId: action.plan.id };

    case 'deletePlan': {
      const plans = state.plans.filter((plan) => plan.id !== action.planId);
      return {
        ...state,
        plans,
        activePlanId: state.activePlanId === action.planId ? null : state.activePlanId,
      };
    }

    case 'selectPlan':
      return { ...state, activePlanId: action.planId };

    case 'renamePlan':
      return mapPlan(state, action.planId, (plan) => ({ ...plan, name: action.name }));

    case 'setPlanDate':
      return mapPlan(state, action.planId, (plan) => ({
        ...plan,
        eventDateIso: action.eventDateIso,
      }));

    case 'setAnchorTime':
      return mapPlan(state, action.planId, (plan) => ({ ...plan, anchorTime: action.anchorTime }));

    case 'setPlace':
      return mapPlan(state, action.planId, (plan) => ({ ...plan, place: action.place }));

    case 'setValue':
      return mapPlan(state, action.planId, (plan) =>
        mapActiveScenario(plan, (scenario) => ({
          ...scenario,
          values: withValue(scenario.values, action.variableId, action.value),
        })),
      );

    // Accepting a change makes it the new baseline, so the blast radius panel
    // always measures from the last state the planner actually agreed to.
    case 'keepChanges':
      return mapPlan(state, action.planId, (plan) =>
        mapActiveScenario(plan, (scenario) => ({ ...scenario, baseline: scenario.values })),
      );

    case 'revertChanges':
      return mapPlan(state, action.planId, (plan) =>
        mapActiveScenario(plan, (scenario) => ({ ...scenario, values: scenario.baseline })),
      );

    case 'addScenario':
      return mapPlan(state, action.planId, (plan) => {
        if (plan.scenarios.length >= 8) return plan;
        const from = activeScenarioOf(plan);
        return {
          ...plan,
          activeScenarioId: action.scenarioId,
          scenarios: [
            ...plan.scenarios,
            {
              id: action.scenarioId,
              name: action.name,
              values: from.values,
              baseline: from.values,
              commitments: from.commitments,
            },
          ],
        };
      });

    case 'selectScenario':
      return mapPlan(state, action.planId, (plan) =>
        plan.scenarios.some((scenario) => scenario.id === action.scenarioId)
          ? { ...plan, activeScenarioId: action.scenarioId }
          : plan,
      );

    case 'renameScenario':
      return mapPlan(state, action.planId, (plan) => ({
        ...plan,
        scenarios: plan.scenarios.map((scenario) =>
          scenario.id === action.scenarioId ? { ...scenario, name: action.name } : scenario,
        ),
      }));

    case 'deleteScenario':
      return mapPlan(state, action.planId, (plan) => {
        if (plan.scenarios.length <= 1) return plan;
        const scenarios = plan.scenarios.filter((scenario) => scenario.id !== action.scenarioId);
        const first = scenarios[0];
        return {
          ...plan,
          scenarios,
          activeScenarioId:
            plan.activeScenarioId === action.scenarioId && first !== undefined
              ? first.id
              : plan.activeScenarioId,
        };
      });

    case 'addCommitment':
      return mapPlan(state, action.planId, (plan) =>
        mapActiveScenario(plan, (scenario) => ({
          ...scenario,
          commitments: [
            ...scenario.commitments.filter((one) => one.ruleId !== action.commitment.ruleId),
            action.commitment,
          ],
        })),
      );

    case 'removeCommitment':
      return mapPlan(state, action.planId, (plan) =>
        mapActiveScenario(plan, (scenario) => ({
          ...scenario,
          commitments: scenario.commitments.filter((one) => one.id !== action.commitmentId),
        })),
      );
  }
}
