import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { makePlan, PlanHost, renderWith, workspaceWith } from '@/testing/support';
import { BudgetView } from './BudgetView';

function show(): void {
  const plan = makePlan();
  renderWith(
    <PlanHost planId={plan.id}>{(current) => <BudgetView plan={current} />}</PlanHost>,
    workspaceWith(plan),
  );
}

describe('BudgetView', () => {
  it('derives every line and shows the arithmetic behind it', () => {
    show();

    expect(screen.getByText('Catering')).toBeInTheDocument();
    expect(screen.getByText('770 servings × 450 (Standard)')).toBeInTheDocument();
    expect(screen.getByText('35 tables × 900')).toBeInTheDocument();
  });

  it('lays the levers out as options rather than hiding them in a menu', () => {
    show();

    expect(screen.getByRole('radio', { name: 'Banquet hall' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Open lawn' })).not.toBeChecked();
  });

  it('folds each category away with its total still showing', () => {
    show();

    const food = screen.getByText('Food').closest('summary');
    expect(food).not.toBeNull();
    expect(food).toHaveTextContent('₹3,46,500');
  });

  it('warns when the venue is too small, with what to do about it', () => {
    show();

    expect(screen.getByText('More guests than the venue holds.')).toBeInTheDocument();
    expect(
      screen.getByText('Cut the list, split a function, or move to a larger venue.'),
    ).toBeInTheDocument();
  });

  it('says how much of the plan is still only an estimate', () => {
    show();

    expect(screen.getByText('Movable')).toBeInTheDocument();
    expect(screen.getByText('only an estimate')).toBeInTheDocument();
    // Once as the Total's exact figure under its short form, once as the
    // breakdown's own total at the foot of the sheet.
    expect(screen.getAllByText('₹12,69,775').length).toBeGreaterThan(0);
  });

  it('shows a saved quote with the vendor and their own words', () => {
    const plan = makePlan();
    const first = plan.scenarios[0];
    if (first === undefined) throw new Error('no scenario');

    const withQuote = {
      ...plan,
      scenarios: [
        {
          ...first,
          commitments: [
            {
              id: 'c1',
              ruleId: 'catering',
              vendor: 'Sri Caterers',
              amount: 300000,
              state: 'quoted' as const,
              quote: '450 a plate, starters included',
              inclusions: [],
              exclusions: [],
            },
          ],
        },
      ],
    };

    renderWith(
      <PlanHost planId={withQuote.id}>{(current) => <BudgetView plan={current} />}</PlanHost>,
      workspaceWith(withQuote),
    );

    expect(screen.getByText(/Sri Caterers/)).toBeInTheDocument();
    expect(screen.getByText(/starters included/)).toBeInTheDocument();
    expect(screen.getByText('we estimated ₹3,46,500')).toBeInTheDocument();
    expect(screen.getAllByText('quoted').length).toBeGreaterThan(0);
  });
});
