import { screen, within } from '@testing-library/react';
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

  it('labels the time field with the pack’s own fixed moment, in the clock people read', () => {
    show();

    expect(screen.getByLabelText('The ceremony')).toHaveTextContent('9:30 am');
  });

  it('moves the date from the calendar, and the heading with it', async () => {
    show();

    await user.click(screen.getByLabelText('Date'));
    const grid = screen.getByRole('grid');
    await user.click(within(grid).getByRole('gridcell', { name: '5 Mar 2027' }));

    expect(screen.getByText(/Wedding · Hyderabad · 5 Mar 2027/)).toBeInTheDocument();
  });

  it('pages to another month without changing the plan', async () => {
    show();

    await user.click(screen.getByLabelText('Date'));
    await user.click(screen.getByRole('button', { name: 'Next month' }));

    expect(screen.getByRole('grid')).toHaveAccessibleName('April 2027');
    expect(screen.getByText(/Wedding · Hyderabad · 2 Mar 2027/)).toBeInTheDocument();
  });

  it('moves the fixed moment of the day', async () => {
    show();

    await user.click(screen.getByLabelText('The ceremony'));
    await user.click(screen.getByRole('button', { name: ':30', pressed: true }));
    await user.click(screen.getByRole('button', { name: '11' }));

    expect(screen.getByLabelText('The ceremony')).toHaveTextContent('11:30 am');
  });

  it('changes where it is', async () => {
    show();

    const place = screen.getByLabelText('Where');
    await user.clear(place);
    await user.type(place, 'Chennai');

    expect(screen.getByText(/Chennai/)).toBeInTheDocument();
  });
});
