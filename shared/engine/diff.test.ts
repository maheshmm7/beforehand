import { describe, expect, it } from 'vitest';
import { blastRadius } from './diff';
import { buildModel, type PlanInputs } from './model';
import { weddingPack } from '../packs/wedding';

function plan(values: Record<string, number | string>): PlanInputs {
  return {
    values: { guests: 350, venueClass: 'hotel', ...values },
    eventDateIso: '2027-03-02',
    anchorTime: '09:30',
    commitments: [],
  };
}

const model = (values: Record<string, number | string>) => buildModel(weddingPack, plan(values));

describe('blastRadius', () => {
  it('reports nothing when nothing changed', () => {
    const radius = blastRadius(model({}), model({}));

    expect(radius.isEmpty).toBe(true);
    expect(radius.totalDelta).toBe(0);
  });

  it('shows every line one lever moved, largest first', () => {
    const radius = blastRadius(model({}), model({ guests: 400 }));

    expect(radius.totalDelta).toBeGreaterThan(0);
    expect(radius.changedLines.length).toBeGreaterThan(3);
    expect(radius.changedLines.map((line) => line.ruleId)).toContain('catering');

    const sizes = radius.changedLines.map((line) => Math.abs(line.delta));
    expect([...sizes].sort((a, b) => b - a)).toEqual(sizes);
  });

  it('reports a line that appears and one that goes away', () => {
    const toALawn = blastRadius(model({}), model({ venueClass: 'lawn' }));
    expect(toALawn.addedLines.map((line) => line.ruleId)).toEqual(
      expect.arrayContaining(['power', 'rainCover', 'sanitation']),
    );

    const back = blastRadius(model({ venueClass: 'lawn' }), model({}));
    expect(back.removedLines.map((line) => line.ruleId)).toEqual(
      expect.arrayContaining(['power', 'rainCover', 'sanitation']),
    );
  });

  it('reports a task that the change brings into existence', () => {
    const radius = blastRadius(model({ guests: 350 }), model({ guests: 400 }));

    expect(radius.newTasks.map((task) => task.id)).toContain('secondServingLine');
    expect(radius.resolvedTasks).toEqual([]);
  });

  it('reports a task that the change makes unnecessary', () => {
    const radius = blastRadius(model({ guests: 400 }), model({ guests: 350 }));

    expect(radius.resolvedTasks.map((task) => task.id)).toContain('secondServingLine');
  });

  it('reports a constraint the change breaks, and one it repairs', () => {
    const broken = blastRadius(model({}), model({ venueClass: 'banquet' }));
    expect(broken.newViolations.map((v) => v.id)).toContain('capacity');

    const repaired = blastRadius(model({ venueClass: 'banquet' }), model({}));
    expect(repaired.resolvedViolations.map((v) => v.id)).toContain('capacity');
  });

  it('moves deadlines earlier when the plan grows, biggest shift first', () => {
    const radius = blastRadius(model({ guests: 350 }), model({ guests: 600 }));

    expect(radius.movedDeadlines.length).toBeGreaterThan(0);
    // A longer guest list takes longer to print, post and cater for, so the
    // date by which it has to be frozen comes forward.
    expect(radius.movedDeadlines.every((moved) => moved.days < 0)).toBe(true);
    expect(radius.movedDeadlines.map((moved) => moved.label)).toContain('Guest list');

    const days = radius.movedDeadlines.map((moved) => moved.days);
    expect([...days].sort((a, b) => a - b)).toEqual(days);
  });

  it('moves them back again when the plan shrinks', () => {
    const radius = blastRadius(model({ guests: 600 }), model({ guests: 350 }));

    expect(radius.movedDeadlines.every((moved) => moved.days > 0)).toBe(true);
  });

  it('nets out to the difference in the two totals', () => {
    const before = model({});
    const after = model({ guests: 500 });

    expect(blastRadius(before, after).totalDelta).toBe(after.totals.all - before.totals.all);
  });
});
