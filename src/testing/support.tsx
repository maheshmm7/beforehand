import { render, type RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { emptyWorkspace, type EventKind, type Plan, type Workspace } from '@shared/plan';
import { WorkspaceProvider } from '@/state/WorkspaceProvider';
import { newPlan, reduce } from '@/state/workspace';
import { useWorkspace } from '@/state/useWorkspace';

export function makePlan(kind: EventKind = 'wedding', overrides: Partial<Plan> = {}): Plan {
  return {
    ...newPlan({
      id: 'p1',
      scenarioId: 's1',
      name: 'Priya and Arjun',
      kind,
      place: 'Hyderabad',
      eventDateIso: '2027-03-02',
      anchorTime: '09:30',
    }),
    ...overrides,
  };
}

export function workspaceWith(plan: Plan): Workspace {
  return reduce(emptyWorkspace, { type: 'createPlan', plan });
}

export function renderWith(ui: ReactNode, workspace: Workspace = emptyWorkspace): RenderResult {
  return render(<WorkspaceProvider initial={workspace}>{ui}</WorkspaceProvider>);
}

/** Renders a plan screen the way the app does: reading the plan back out of
 *  the store, so a dispatch re-renders it. */
export function PlanHost({
  planId,
  children,
}: {
  planId: string;
  children: (plan: Plan) => ReactNode;
}): React.JSX.Element | null {
  const { workspace } = useWorkspace();
  const plan = workspace.plans.find((one) => one.id === planId);
  return plan === undefined ? null : <>{children(plan)}</>;
}

export const user = userEvent.setup();
