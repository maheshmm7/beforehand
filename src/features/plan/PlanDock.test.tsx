import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { makePlan, PlanHost, renderWith, user, workspaceWith } from '@/testing/support';
import { BudgetView } from '@/features/budget/BudgetView';
import { PlanDock } from './PlanDock';

/** The levers and the dock, as the shell mounts them: two separate places on
 *  the screen, one store between them. */
function show(): void {
  const plan = makePlan();
  renderWith(
    <PlanHost planId={plan.id}>
      {(current) => (
        <>
          <BudgetView plan={current} />
          <PlanDock plan={current} />
        </>
      )}
    </PlanHost>,
    workspaceWith(plan),
  );
}

describe('PlanDock', () => {
  it('starts with nothing pending', () => {
    show();

    expect(screen.getByText('Nothing pending')).toBeInTheDocument();
  });

  it('reports the blast radius once a lever moves', () => {
    show();

    // jsdom does not implement keyboard stepping on a range input; the real
    // keyboard journey is covered by the browser tests.
    fireEvent.change(screen.getByLabelText('Guests'), { target: { value: '400' } });

    const radius = screen.getByRole('status');
    expect(radius).toHaveTextContent('+₹76,275');
    expect(radius).toHaveTextContent('1 task changed');
    expect(screen.getByText('Add a second serving line')).toBeInTheDocument();
  });

  it('keeps a change, which clears the pending difference', async () => {
    show();

    fireEvent.change(screen.getByLabelText('Guests'), { target: { value: '400' } });
    await user.click(screen.getByRole('button', { name: 'Keep this change' }));

    expect(screen.getByText('Nothing pending')).toBeInTheDocument();
  });

  it('undoes a change, putting the total back', async () => {
    show();

    fireEvent.change(screen.getByLabelText('Guests'), { target: { value: '400' } });
    await user.click(screen.getByRole('button', { name: 'Undo' }));

    expect(screen.getByText('Nothing pending')).toBeInTheDocument();
    expect(screen.getAllByText('₹12,69,775').length).toBeGreaterThan(0);
  });

  it('adds the lines an open lawn implies, and says they are new', async () => {
    show();

    await user.click(screen.getByRole('radio', { name: 'Open lawn' }));

    // Once in the dock as a consequence, once in the breakdown as a line.
    expect(screen.getAllByText('Rain cover')).toHaveLength(2);
    expect(screen.getAllByText('Power backup')).toHaveLength(2);
  });

  it('removes lines again when the venue goes back indoors', async () => {
    show();

    await user.click(screen.getByRole('radio', { name: 'Open lawn' }));
    await user.click(screen.getByRole('button', { name: 'Keep this change' }));
    await user.click(screen.getByRole('radio', { name: 'Banquet hall' }));

    expect(screen.getAllByText('no longer needed').length).toBeGreaterThan(0);
  });
});
