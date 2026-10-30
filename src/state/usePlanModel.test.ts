import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Plan } from '@shared/plan';
import { newPlan } from './workspace';
import { usePlanModel } from './usePlanModel';

function plan(overrides: Partial<Plan> = {}): Plan {
  return {
    ...newPlan({
      id: 'p1',
      scenarioId: 's1',
      name: 'Priya and Arjun',
      kind: 'wedding',
      place: 'Hyderabad',
      eventDateIso: '2027-03-02',
      anchorTime: '09:30',
    }),
    ...overrides,
  };
}

function withGuests(count: number): Plan {
  const base = plan();
  const first = base.scenarios[0];
  if (first === undefined) throw new Error('no scenario');
  return {
    ...base,
    scenarios: [{ ...first, values: { ...first.values, guests: count } }],
  };
}

describe('usePlanModel', () => {
  it('evaluates the plan as it stands and as it was last accepted', () => {
    const { result } = renderHook(() => usePlanModel(withGuests(400)));

    expect(result.current.current.totals.all).toBeGreaterThan(0);
    expect(result.current.baseline.totals.all).toBeGreaterThan(0);
    // The baseline still holds the pack default of 350.
    expect(result.current.current.totals.all).toBeGreaterThan(result.current.baseline.totals.all);
  });

  it('reports nothing pending when the plan matches its baseline', () => {
    const { result } = renderHook(() => usePlanModel(plan()));

    expect(result.current.radius.isEmpty).toBe(true);
  });

  it('reports the difference once the plan moves away from its baseline', () => {
    const { result } = renderHook(() => usePlanModel(withGuests(400)));

    expect(result.current.radius.isEmpty).toBe(false);
    expect(result.current.radius.totalDelta).toBe(76275);
  });

  it('hands back the pack and the scenario it used', () => {
    const { result } = renderHook(() => usePlanModel(plan()));

    expect(result.current.pack.kind).toBe('wedding');
    expect(result.current.scenario.name).toBe('Plan A');
  });

  it('uses the pack that matches the kind of event', () => {
    const { result } = renderHook(() => usePlanModel(plan({ kind: 'community' })));

    expect(result.current.pack.kind).toBe('community');
  });

  it('does not rebuild the models when nothing changed', () => {
    const same = withGuests(400);
    const { result, rerender } = renderHook(() => usePlanModel(same));
    const first = result.current.current;

    rerender();

    expect(result.current.current).toBe(first);
  });
});
