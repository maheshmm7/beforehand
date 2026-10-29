import type { Plan } from '@shared/plan';
import type { View } from '@/lib/router';
import { BudgetView } from '@/features/budget/BudgetView';
import { IdeasView } from '@/features/ideas/IdeasView';
import { PlanHeader } from '@/features/plan/PlanHeader';
import { TimelineView } from '@/features/timeline/TimelineView';
import { VendorsView } from '@/features/vendors/VendorsView';

export function PlanPage({ plan, view }: { plan: Plan; view: View }): React.JSX.Element {
  return (
    <>
      <PlanHeader plan={plan} />
      {view === 'budget' ? <BudgetView plan={plan} /> : null}
      {view === 'timeline' ? <TimelineView plan={plan} /> : null}
      {view === 'vendors' ? <VendorsView plan={plan} /> : null}
      {view === 'ideas' ? <IdeasView plan={plan} /> : null}
    </>
  );
}

export default PlanPage;
