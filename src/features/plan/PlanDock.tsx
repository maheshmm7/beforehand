import type { Plan } from '@shared/plan';
import { usePlanModel } from '@/state/usePlanModel';
import { useWorkspace } from '@/state/useWorkspace';
import { BlastRadiusDock } from './BlastRadiusDock';

/**
 * The dock belongs to the plan, not to one view of it: a change made on the
 * budget screen is still uncommitted when you walk over to the timeline, and
 * the dock says so there too.
 */
export function PlanDock({ plan }: { plan: Plan }): React.JSX.Element {
  const { dispatch } = useWorkspace();
  const { radius } = usePlanModel(plan);

  return (
    <BlastRadiusDock
      radius={radius}
      onKeep={() => {
        dispatch({ type: 'keepChanges', planId: plan.id });
      }}
      onUndo={() => {
        dispatch({ type: 'revertChanges', planId: plan.id });
      }}
    />
  );
}

export default PlanDock;
