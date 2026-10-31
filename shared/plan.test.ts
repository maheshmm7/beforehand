import { describe, expect, it } from 'vitest';
import { activeScenarioOf, emptyWorkspace, type Plan } from './plan.ts';

function plan(overrides: Partial<Plan> = {}): Plan {
  return {
    id: 'p1',
    name: 'Priya and Arjun',
    kind: 'wedding',
    place: 'Hyderabad',
    eventDateIso: '2027-03-02',
    anchorTime: '09:30',
    updatedAt: '2026-10-30T00:00:00.000Z',
    activeScenarioId: 's1',
    scenarios: [
      { id: 's1', name: 'Plan A', values: { guests: 350 }, baseline: {}, commitments: [] },
      { id: 's2', name: 'Plan B', values: { guests: 200 }, baseline: {}, commitments: [] },
    ],
    ...overrides,
  };
}

describe('activeScenarioOf', () => {
  it('finds the scenario the plan is pointing at', () => {
    expect(activeScenarioOf(plan({ activeScenarioId: 's2' })).name).toBe('Plan B');
  });

  it('falls back to the first when the pointer has gone stale', () => {
    // A scenario can be deleted; the pointer must not take the plan with it.
    expect(activeScenarioOf(plan({ activeScenarioId: 'deleted' })).name).toBe('Plan A');
  });

  it('hands back an empty scenario rather than nothing when there are none', () => {
    const bare = activeScenarioOf(plan({ scenarios: [], activeScenarioId: 'gone' }));

    expect(bare.name).toBe('Plan A');
    expect(bare.values).toEqual({});
    expect(bare.commitments).toEqual([]);
  });
});

describe('emptyWorkspace', () => {
  it('starts at the current version with nothing in it', () => {
    expect(emptyWorkspace).toEqual({ version: 1, plans: [], activePlanId: null });
  });
});
