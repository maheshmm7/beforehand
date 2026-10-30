import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { BlastRadius } from '@shared/engine';
import { BlastRadiusPanel } from './BlastRadiusPanel';

const empty: BlastRadius = {
  totalDelta: 0,
  changedLines: [],
  addedLines: [],
  removedLines: [],
  newTasks: [],
  resolvedTasks: [],
  newViolations: [],
  resolvedViolations: [],
  movedDeadlines: [],
  isEmpty: true,
};

function changed(count: number): BlastRadius['changedLines'] {
  return Array.from({ length: count }, (_unused, index) => ({
    ruleId: `r${String(index)}`,
    label: `Line ${String(index)}`,
    from: 1000,
    to: 2000,
    delta: 1000,
  }));
}

function show(radius: Partial<BlastRadius>): void {
  render(
    <BlastRadiusPanel
      radius={{ ...empty, isEmpty: false, ...radius }}
      onKeep={vi.fn()}
      onUndo={vi.fn()}
    />,
  );
}

describe('BlastRadiusPanel', () => {
  it('invites a change when nothing has moved, and offers nothing to accept', () => {
    render(<BlastRadiusPanel radius={empty} onKeep={vi.fn()} onUndo={vi.fn()} />);

    expect(screen.getByText(/Move a lever to see what it costs/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Keep this change' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();
  });

  it('announces the difference to assistive technology', () => {
    show({ totalDelta: 76275, changedLines: changed(2) });

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(within(status).getByText('+₹76,275')).toBeInTheDocument();
  });

  it('marks a saving as a fall rather than a rise', () => {
    show({ totalDelta: -5000, changedLines: changed(1) });

    expect(screen.getByText('-₹5,000')).toBeInTheDocument();
  });

  it('lists the surprising consequences before the money detail', () => {
    show({
      totalDelta: 1000,
      changedLines: changed(6),
      newTasks: [{ id: 't1', label: 'Add a second serving line', leadTimeDays: 30 }],
      movedDeadlines: [
        { id: 'd1', label: 'Caterer', from: '2027-01-10', to: '2027-01-09', days: -1 },
      ],
    });

    const rows = screen.getAllByRole('listitem').map((item) => item.textContent);
    expect(rows[0]).toContain('Add a second serving line');
    expect(rows[1]).toContain('Caterer deadline');
    expect(rows[2]).toContain('Line 0');
  });

  it('shows a fixed number of rows and counts the rest, so it cannot grow', () => {
    show({ totalDelta: 1000, changedLines: changed(20) });

    const rows = screen.getAllByRole('listitem');
    // Seven consequences plus the line that counts what is left.
    expect(rows).toHaveLength(8);
    expect(screen.getByText('and 13 other changes')).toBeInTheDocument();
  });

  it('says nothing about a remainder when everything fits', () => {
    show({ totalDelta: 1000, changedLines: changed(3) });

    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.queryByText(/other change/)).not.toBeInTheDocument();
  });

  it('raises a broken constraint with what to do about it', () => {
    show({
      totalDelta: 1000,
      changedLines: changed(1),
      newViolations: [
        {
          id: 'capacity',
          severity: 'error',
          message: 'More guests than the venue holds.',
          hint: 'Cut the list.',
        },
      ],
    });

    expect(screen.getByText('More guests than the venue holds.')).toBeInTheDocument();
    expect(screen.getByText('Cut the list.')).toBeInTheDocument();
  });

  it('counts each kind of consequence in its summary', () => {
    show({
      totalDelta: 1000,
      changedLines: changed(2),
      addedLines: [],
      newTasks: [{ id: 't1', label: 'A task', leadTimeDays: 10 }],
      movedDeadlines: [
        { id: 'd1', label: 'Caterer', from: '2027-01-10', to: '2027-01-09', days: -1 },
      ],
    });

    expect(screen.getByRole('status')).toHaveTextContent(
      '2 lines moved · 1 deadline shifted · 1 new task · 0 constraints broken',
    );
  });
});
