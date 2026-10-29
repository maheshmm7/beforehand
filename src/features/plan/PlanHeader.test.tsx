import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { makePlan, PlanHost, renderWith, user, workspaceWith } from '@/testing/support';
import { PlanHeader } from './PlanHeader';

function show(): void {
  const plan = makePlan();
  renderWith(
    <PlanHost planId={plan.id}>{(current) => <PlanHeader plan={current} />}</PlanHost>,
    workspaceWith(plan),
  );
}

describe('PlanHeader', () => {
  it('names the plan and says how far away it is', () => {
    show();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Priya and Arjun');
    expect(screen.getByText(/Wedding · Hyderabad · 2 Mar 2027/)).toBeInTheDocument();
    expect(screen.getByText(/Plan A/)).toBeInTheDocument();
  });

  it('labels the time field with the pack’s own fixed moment', () => {
    show();

    expect(screen.getByLabelText('The ceremony')).toHaveValue('09:30');
  });

  it('moves the date, and the heading with it', () => {
    show();

    // A date input takes a whole value, not keystrokes.
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2027-06-05' } });

    expect(screen.getByText(/5 Jun 2027/)).toBeInTheDocument();
  });

  it('changes where it is', async () => {
    show();

    const place = screen.getByLabelText('Where');
    await user.clear(place);
    await user.type(place, 'Chennai');

    expect(screen.getByText(/Chennai/)).toBeInTheDocument();
  });

  it('ignores an emptied date rather than breaking the plan', () => {
    show();

    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '' } });

    expect(screen.getByText(/2 Mar 2027/)).toBeInTheDocument();
  });
});
