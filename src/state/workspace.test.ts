import { describe, expect, it } from 'vitest';
import { emptyWorkspace, type Commitment, type Workspace } from '@shared/plan';
import { newId, newPlan, reduce, type Action } from './workspace';

function start(): Workspace {
  const plan = newPlan({
    id: 'p1',
    scenarioId: 's1',
    name: 'Priya and Arjun',
    kind: 'wedding',
    place: 'Hyderabad',
    eventDateIso: '2027-03-02',
    anchorTime: '09:30',
  });
  return reduce(emptyWorkspace, { type: 'createPlan', plan });
}

const run = (state: Workspace, ...actions: Action[]): Workspace =>
  actions.reduce((carried, action) => reduce(carried, action), state);

const quote: Commitment = {
  id: 'c1',
  ruleId: 'catering',
  vendor: 'Sri Caterers',
  amount: 300000,
  state: 'quoted',
  quote: '450 a plate',
  inclusions: [],
  exclusions: [],
};

describe('newPlan', () => {
  it('starts from the pack defaults, with the baseline matching', () => {
    const state = start();
    const scenario = state.plans[0]?.scenarios[0];

    expect(scenario?.values.guests).toBe(350);
    expect(scenario?.baseline).toEqual(scenario?.values);
    expect(scenario?.name).toBe('Plan A');
  });
});

describe('newId', () => {
  it('is unique enough and carries its prefix', () => {
    const ids = new Set(Array.from({ length: 200 }, () => newId('p')));

    expect(ids.size).toBe(200);
    expect([...ids].every((id) => id.startsWith('p-'))).toBe(true);
  });
});

describe('plans', () => {
  it('adds a plan at the top and selects it', () => {
    const state = start();

    expect(state.plans).toHaveLength(1);
    expect(state.activePlanId).toBe('p1');
  });

  it('renames, moves and relocates a plan', () => {
    const state = run(
      start(),
      { type: 'renamePlan', planId: 'p1', name: 'Arjun and Priya' },
      { type: 'setPlanDate', planId: 'p1', eventDateIso: '2027-04-04' },
      { type: 'setAnchorTime', planId: 'p1', anchorTime: '11:15' },
      { type: 'setPlace', planId: 'p1', place: 'Chennai' },
    );

    expect(state.plans[0]).toMatchObject({
      name: 'Arjun and Priya',
      eventDateIso: '2027-04-04',
      anchorTime: '11:15',
      place: 'Chennai',
    });
  });

  it('deletes a plan and forgets it was selected', () => {
    const state = reduce(start(), { type: 'deletePlan', planId: 'p1' });

    expect(state.plans).toEqual([]);
    expect(state.activePlanId).toBeNull();
  });

  it('ignores an action aimed at a plan that is not here', () => {
    const before = start();
    const after = reduce(before, { type: 'renamePlan', planId: 'ghost', name: 'x' });

    expect(after).toBe(before);
  });

  it('selects and deselects', () => {
    expect(reduce(start(), { type: 'selectPlan', planId: null }).activePlanId).toBeNull();
  });
});

describe('changes and the baseline', () => {
  it('moves a value without moving the baseline', () => {
    const state = reduce(start(), {
      type: 'setValue',
      planId: 'p1',
      variableId: 'guests',
      value: 400,
    });
    const scenario = state.plans[0]?.scenarios[0];

    expect(scenario?.values.guests).toBe(400);
    expect(scenario?.baseline.guests).toBe(350);
  });

  it('accepting a change makes it the new baseline', () => {
    const state = run(
      start(),
      { type: 'setValue', planId: 'p1', variableId: 'guests', value: 400 },
      { type: 'keepChanges', planId: 'p1' },
    );
    const scenario = state.plans[0]?.scenarios[0];

    expect(scenario?.baseline.guests).toBe(400);
  });

  it('undo puts the values back', () => {
    const state = run(
      start(),
      { type: 'setValue', planId: 'p1', variableId: 'guests', value: 400 },
      { type: 'revertChanges', planId: 'p1' },
    );
    const scenario = state.plans[0]?.scenarios[0];

    expect(scenario?.values.guests).toBe(350);
  });

  it('records when the plan last changed', () => {
    const before = start();
    const after = reduce(before, {
      type: 'setValue',
      planId: 'p1',
      variableId: 'guests',
      value: 400,
    });

    expect((after.plans[0]?.updatedAt ?? '') >= (before.plans[0]?.updatedAt ?? '')).toBe(true);
  });
});

describe('scenarios', () => {
  it('branches from the one in front of you, carrying its values across', () => {
    const state = run(
      start(),
      { type: 'setValue', planId: 'p1', variableId: 'guests', value: 450 },
      { type: 'addScenario', planId: 'p1', scenarioId: 's2', name: 'Plan B' },
    );
    const plan = state.plans[0];

    expect(plan?.scenarios).toHaveLength(2);
    expect(plan?.activeScenarioId).toBe('s2');
    expect(plan?.scenarios[1]?.values.guests).toBe(450);
    // A branch starts settled, not showing a pending change.
    expect(plan?.scenarios[1]?.baseline).toEqual(plan?.scenarios[1]?.values);
  });

  it('keeps the two apart once they are branched', () => {
    const state = run(
      start(),
      { type: 'addScenario', planId: 'p1', scenarioId: 's2', name: 'Plan B' },
      { type: 'setValue', planId: 'p1', variableId: 'guests', value: 600 },
    );
    const plan = state.plans[0];

    expect(plan?.scenarios[0]?.values.guests).toBe(350);
    expect(plan?.scenarios[1]?.values.guests).toBe(600);
  });

  it('refuses a ninth branch', () => {
    let state = start();
    for (let index = 2; index <= 9; index += 1) {
      state = reduce(state, {
        type: 'addScenario',
        planId: 'p1',
        scenarioId: `s${String(index)}`,
        name: `Plan ${String(index)}`,
      });
    }

    expect(state.plans[0]?.scenarios).toHaveLength(8);
  });

  it('switches between branches, and ignores one that is not there', () => {
    const state = run(
      start(),
      { type: 'addScenario', planId: 'p1', scenarioId: 's2', name: 'Plan B' },
      { type: 'selectScenario', planId: 'p1', scenarioId: 's1' },
    );
    expect(state.plans[0]?.activeScenarioId).toBe('s1');

    const unchanged = reduce(state, { type: 'selectScenario', planId: 'p1', scenarioId: 'ghost' });
    expect(unchanged.plans[0]?.activeScenarioId).toBe('s1');
  });

  it('renames a branch', () => {
    const state = reduce(start(), {
      type: 'renameScenario',
      planId: 'p1',
      scenarioId: 's1',
      name: 'The lawn one',
    });

    expect(state.plans[0]?.scenarios[0]?.name).toBe('The lawn one');
  });

  it('deletes a branch and moves off it, but never deletes the last one', () => {
    const two = reduce(start(), { type: 'addScenario', planId: 'p1', scenarioId: 's2', name: 'B' });
    const one = reduce(two, { type: 'deleteScenario', planId: 'p1', scenarioId: 's2' });

    expect(one.plans[0]?.scenarios).toHaveLength(1);
    expect(one.plans[0]?.activeScenarioId).toBe('s1');

    const stillOne = reduce(one, { type: 'deleteScenario', planId: 'p1', scenarioId: 's1' });
    expect(stillOne.plans[0]?.scenarios).toHaveLength(1);
  });
});

describe('commitments', () => {
  it('records a quote against a line', () => {
    const state = reduce(start(), { type: 'addCommitment', planId: 'p1', commitment: quote });

    expect(state.plans[0]?.scenarios[0]?.commitments).toEqual([quote]);
  });

  it('replaces an earlier quote for the same line rather than stacking them', () => {
    const second = { ...quote, id: 'c2', amount: 310000 };
    const state = run(
      start(),
      { type: 'addCommitment', planId: 'p1', commitment: quote },
      { type: 'addCommitment', planId: 'p1', commitment: second },
    );

    expect(state.plans[0]?.scenarios[0]?.commitments).toEqual([second]);
  });

  it('removes one by its own id', () => {
    const state = run(
      start(),
      { type: 'addCommitment', planId: 'p1', commitment: quote },
      { type: 'removeCommitment', planId: 'p1', commitmentId: 'c1' },
    );

    expect(state.plans[0]?.scenarios[0]?.commitments).toEqual([]);
  });
});
