import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { BlastRadius } from '@shared/engine';
import { BlastRadiusDock } from './BlastRadiusDock';

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
    <BlastRadiusDock
      radius={{ ...empty, isEmpty: false, ...radius }}
      onKeep={vi.fn()}
      onUndo={vi.fn()}
    />,
  );
}

describe('BlastRadiusDock', () => {
  it('invites a change when nothing has moved, and offers nothing to accept', () => {
    render(<BlastRadiusDock radius={empty} onKeep={vi.fn()} onUndo={vi.fn()} />);

    expect(screen.getByText('Nothing pending')).toBeInTheDocument();
    expect(screen.getByText(/Move a lever/)).toBeInTheDocument();
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
    // The money detail is the first thing the strip gives up: with more than
    // it can hold, the rest is counted rather than listed.
    expect(rows[2]).toContain('other change');
  });

  it('counts each kind of consequence, so the rings can be read', () => {
    show({
      totalDelta: 1000,
      changedLines: changed(2),
      newTasks: [{ id: 't1', label: 'A task', leadTimeDays: 10 }],
      movedDeadlines: [
        { id: 'd1', label: 'Caterer', from: '2027-01-10', to: '2027-01-09', days: -1 },
      ],
    });

    // In the words somebody would use about their own wedding, not a reading
    // off a gauge.
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('2 costs change');
    expect(status).toHaveTextContent('a date moves');
    expect(status).toHaveTextContent('one new thing to do');
  });

  it('raises a broken constraint ahead of everything else, with what to do about it', () => {
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

    const rows = screen.getAllByRole('listitem').map((item) => item.textContent);
    expect(rows[0]).toContain('More guests than the venue holds.');
    expect(rows[0]).toContain('Cut the list.');
    expect(screen.getByRole('status')).toHaveTextContent('something no longer works');
  });

  it('says nothing about constraints when none broke', () => {
    show({ totalDelta: 1000, changedLines: changed(1) });

    expect(screen.getByRole('status')).not.toHaveTextContent('no longer works');
  });

  it('states an absence quietly rather than as a count of zero', () => {
    show({ totalDelta: 1000, changedLines: changed(1) });

    expect(screen.getByRole('status')).toHaveTextContent('no date moves');
    expect(screen.getByRole('status')).toHaveTextContent('nothing new to do');
  });
});
