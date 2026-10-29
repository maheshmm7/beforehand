import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { makePlan, PlanHost, renderWith, user, workspaceWith } from '@/testing/support';
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

  it('starts with nothing pending and invites a change', () => {
    show();

    expect(screen.getByText(/Move a lever to see what it costs/)).toBeInTheDocument();
  });

  it('reports the blast radius once a lever moves', () => {
    show();

    // jsdom does not implement keyboard stepping on a range input; the real
    // keyboard journey is covered by the browser tests.
    fireEvent.change(screen.getByLabelText('Guests'), { target: { value: '400' } });

    const radius = screen.getByRole('status');
    expect(within(radius).getByText('+₹76,275')).toBeInTheDocument();
    expect(radius).toHaveTextContent('1 new task');
    expect(radius).toHaveTextContent('Add a second serving line');
  });

  it('keeps a change, which clears the pending difference', async () => {
    show();

    fireEvent.change(screen.getByLabelText('Guests'), { target: { value: '400' } });
    await user.click(screen.getByRole('button', { name: 'Keep this change' }));

    expect(screen.getByText(/Move a lever to see what it costs/)).toBeInTheDocument();
  });

  it('undoes a change, putting the total back', async () => {
    show();
    const totalBefore = screen.getAllByText('₹12,69,775')[0];
    expect(totalBefore).toBeDefined();

    fireEvent.change(screen.getByLabelText('Guests'), { target: { value: '400' } });
    await user.click(screen.getByRole('button', { name: 'Undo' }));

    expect(screen.getAllByText('₹12,69,775').length).toBeGreaterThan(0);
  });

  it('adds the lines an open lawn implies, and says they are new', async () => {
    show();

    await user.selectOptions(screen.getByLabelText('Venue'), 'lawn');

    const radius = screen.getByRole('status');
    expect(radius).toHaveTextContent('Rain cover');
    expect(radius).toHaveTextContent('Power backup');
  });

  it('removes lines again when the venue goes back indoors', async () => {
    show();

    await user.selectOptions(screen.getByLabelText('Venue'), 'lawn');
    await user.click(screen.getByRole('button', { name: 'Keep this change' }));
    await user.selectOptions(screen.getByLabelText('Venue'), 'hotel');

    expect(screen.getByRole('status')).toHaveTextContent('no longer needed');
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

    expect(screen.getByText('Still movable')).toBeInTheDocument();
    expect(screen.getByText('only an estimate')).toBeInTheDocument();
    expect(screen.getByText('Estimated ₹12,69,775')).toBeInTheDocument();
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
