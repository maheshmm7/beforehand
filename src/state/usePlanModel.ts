import { useMemo } from 'react';
import { blastRadius, buildModel, type BlastRadius, type Model } from '@shared/engine';
import { packFor } from '@shared/packs';
import { activeScenarioOf, type Plan, type Scenario } from '@shared/plan';
import type { EventPack } from '@shared/engine';

export interface PlanModel {
  readonly pack: EventPack;
  readonly scenario: Scenario;
  /** The plan as it stands now. */
  readonly current: Model;
  /** The plan as it stood when the planner last accepted it. */
  readonly baseline: Model;
  /** Everything the pending change set off. */
  readonly radius: BlastRadius;
}

/**
 * Evaluates a plan twice: once as it stands and once as it was last accepted.
 * The difference between them is the product.
 */
export function usePlanModel(plan: Plan): PlanModel {
  return useMemo(() => {
    const pack = packFor(plan.kind);
    const scenario = activeScenarioOf(plan);
    const shared = {
      eventDateIso: plan.eventDateIso,
      anchorTime: plan.anchorTime,
      commitments: scenario.commitments,
    };

    const current = buildModel(pack, { ...shared, values: scenario.values });
    const baseline = buildModel(pack, { ...shared, values: scenario.baseline });

    return { pack, scenario, current, baseline, radius: blastRadius(baseline, current) };
  }, [plan]);
}
