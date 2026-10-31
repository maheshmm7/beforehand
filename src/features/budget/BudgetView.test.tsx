import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { makePlan, PlanHost, renderWith, workspaceWith } from '@/testing/support';
import { BudgetView } from './BudgetView';

function show(): ReturnType<typeof renderWith> {
  const plan = makePlan();
  return renderWith(
    <PlanHost planId={plan.id}>{(current) => <BudgetView plan={current} />}</PlanHost>,
    workspaceWith(plan),
  );
}

describe('BudgetView', () => {
  it('names every kind of spending, with its share and its total', () => {
    show();

    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('₹3,46,500')).toBeInTheDocument();
    expect(screen.getByText('Things to hire')).toBeInTheDocument();
    expect(screen.getByText('₹2,32,560')).toBeInTheDocument();
    // Shares, so the ring beside the list can be read as proportions.
    expect(screen.getAllByText(/^\d+%$/).length).toBeGreaterThan(3);
  });

  it('lays the levers out as options rather than hiding them in a menu', () => {
    show();

    expect(screen.getByRole('radio', { name: 'Banquet hall' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Open lawn' })).not.toBeChecked();
  });

  it('shows every kind of spending at once, with nothing to unfold', () => {
    const { container } = show();

    // Folding a category away moved everything under it each time somebody
    // looked at it. Nothing on this screen opens or shuts.
    expect(container.querySelectorAll('details')).toHaveLength(0);
    for (const name of ['Venue', 'Food', 'People', 'Things to hire', 'Travel', 'Paperwork']) {
      expect(screen.getAllByText(name).length).toBeGreaterThan(0);
    }
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

  it('counts a recorded quote as promised rather than movable', () => {
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

    // The catering line is a vendor's price now, so it leaves the estimate.
    expect(screen.getByText('Quoted').closest('div')).toHaveTextContent('₹3.0L');
    expect(screen.getByText('₹12,23,275')).toBeInTheDocument();
  });
});
