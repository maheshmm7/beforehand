import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { makePlan, PlanHost, renderWith, workspaceWith } from '@/testing/support';
import { TimelineView } from './TimelineView';

describe('TimelineView', () => {
  it('lists decisions with the notice each one needs', () => {
    const plan = makePlan();
    renderWith(
      <PlanHost planId={plan.id}>{(current) => <TimelineView plan={current} />}</PlanHost>,
      workspaceWith(plan),
    );

    expect(screen.getByText('Venue')).toBeInTheDocument();
    expect(screen.getByText('Needs 120 days of notice')).toBeInTheDocument();
    expect(screen.getByText(/last day a choice can be made/)).toBeInTheDocument();
  });

  it('marks a decision that money has already been paid against', () => {
    const plan = makePlan();
    const first = plan.scenarios[0];
    if (first === undefined) throw new Error('no scenario');

    const paid = {
      ...plan,
      scenarios: [
        {
          ...first,
          commitments: [
            {
              id: 'c1',
              ruleId: 'venue',
              vendor: 'Lotus',
              amount: 180000,
              state: 'paid' as const,
              quote: 'advance paid',
              inclusions: [],
              exclusions: [],
            },
          ],
        },
      ],
    };

    renderWith(
      <PlanHost planId={paid.id}>{(current) => <TimelineView plan={current} />}</PlanHost>,
      workspaceWith(paid),
    );

    expect(screen.getByText('money paid')).toBeInTheDocument();
  });

  it('schedules the day backwards from the anchor', () => {
    const plan = makePlan();
    renderWith(
      <PlanHost planId={plan.id}>{(current) => <TimelineView plan={current} />}</PlanHost>,
      workspaceWith(plan),
    );

    expect(screen.getByText('Hair and make-up')).toBeInTheDocument();
    expect(screen.getByText('04:00–06:30')).toBeInTheDocument();
    expect(screen.getByText('Guests seated')).toBeInTheDocument();
    expect(screen.getByText('The ceremony')).toBeInTheDocument();
  });

  it('uses the pack’s own name for the fixed moment', () => {
    const birthday = makePlan('birthday', { anchorTime: '17:00' });
    renderWith(
      <PlanHost planId={birthday.id}>{(current) => <TimelineView plan={current} />}</PlanHost>,
      workspaceWith(birthday),
    );

    expect(screen.getByText('Cutting the cake')).toBeInTheDocument();
    expect(screen.getByText(/Built backwards from cutting the cake at 17:00/)).toBeInTheDocument();
  });
});
