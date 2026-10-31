import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { View } from '@/lib/router';
import { makePlan, PlanHost, renderWith, workspaceWith } from '@/testing/support';
import { PlanPage } from './PlanPage';

function show(view: View): void {
  const plan = makePlan();
  renderWith(
    <PlanHost planId={plan.id}>{(current) => <PlanPage plan={current} view={view} />}</PlanHost>,
    workspaceWith(plan),
  );
}

describe('PlanPage', () => {
  it('names the plan whichever section is open', () => {
    show('timeline');

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Priya and Arjun');
  });

  it('opens the budget', () => {
    show('budget');

    expect(screen.getByText('Levers')).toBeInTheDocument();
    expect(screen.getByText('Where the money goes')).toBeInTheDocument();
  });

  it('opens the timeline', () => {
    show('timeline');

    expect(screen.getByText(/Decisions, in the order/)).toBeInTheDocument();
    expect(screen.queryByText('Levers')).not.toBeInTheDocument();
  });

  it('opens the vendor list', () => {
    show('vendors');

    expect(screen.getByText(/Still nobody’s promise/)).toBeInTheDocument();
    expect(screen.queryByText('Levers')).not.toBeInTheDocument();
  });

  it('opens the ideas', () => {
    show('ideas');

    expect(screen.getByRole('button', { name: 'Suggest ideas' })).toBeInTheDocument();
    expect(screen.queryByText('Levers')).not.toBeInTheDocument();
  });
});
