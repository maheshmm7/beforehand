import { describe, expect, it } from 'vitest';
import { buildModel, type PlanInputs } from './model';
import { expr as e } from './expr';
import type { Commitment, EventPack } from './types';

const pack: EventPack = {
  kind: 'wedding',
  label: 'Test',
  blurb: '',
  anchorLabel: 'Anchor',
  variables: [
    {
      kind: 'number',
      id: 'guests',
      label: 'Guests',
      min: 10,
      max: 500,
      step: 10,
      fallback: 100,
      unit: 'guests',
    },
    {
      kind: 'choice',
      id: 'venue',
      label: 'Venue',
      fallback: 'hall',
      options: [
        { id: 'hall', label: 'Hall' },
        { id: 'lawn', label: 'Lawn' },
      ],
    },
  ],
  quantities: [{ id: 'tables', label: 'tables', expr: e.perBlock(e.var('guests'), 10) }],
  costRules: [
    {
      id: 'food',
      label: 'Food',
      category: 'food',
      decision: 'Caterer',
      leadTimeDays: 45,
      amount: e.scale(e.var('guests'), 450),
    },
    {
      id: 'seating',
      label: 'Seating',
      category: 'things',
      decision: 'Décor',
      leadTimeDays: 30,
      amount: e.scale(e.quantity('tables'), 900),
    },
    {
      id: 'power',
      label: 'Power backup',
      category: 'things',
      decision: 'Venue',
      leadTimeDays: 15,
      when: { op: 'is', id: 'venue', value: 'lawn' },
      amount: e.const(45000),
    },
  ],
  constraints: [
    {
      id: 'capacity',
      severity: 'error',
      message: 'Too many guests.',
      hint: 'Cut the list.',
      when: { op: 'compare', left: e.var('guests'), cmp: '>', right: e.const(200) },
    },
  ],
  tasks: [
    {
      id: 'secondLine',
      label: 'Add a second serving line',
      leadTimeDays: 30,
      when: { op: 'compare', left: e.var('guests'), cmp: '>', right: e.const(150) },
    },
  ],
  runOfShow: [{ id: 'seat', label: 'Guests seated', durationMin: 30 }],
};

function inputs(overrides: Partial<PlanInputs> = {}): PlanInputs {
  return {
    values: { guests: 100, venue: 'hall' },
    eventDateIso: '2027-03-02',
    anchorTime: '10:00',
    commitments: [],
    ...overrides,
  };
}

describe('buildModel', () => {
  it('derives every line and explains how', () => {
    const model = buildModel(pack, inputs());

    expect(model.lines.map((line) => [line.ruleId, line.amount, line.basis])).toEqual([
      ['food', 45000, '100 guests × 450'],
      ['seating', 9000, '10 tables × 900'],
    ]);
  });

  it('leaves out a line whose condition does not hold, and brings it back when it does', () => {
    expect(buildModel(pack, inputs()).lines.map((l) => l.ruleId)).not.toContain('power');

    const onALawn = buildModel(pack, inputs({ values: { guests: 100, venue: 'lawn' } }));
    expect(onALawn.lines.map((l) => l.ruleId)).toContain('power');
  });

  it('starts every line as an estimate', () => {
    const model = buildModel(pack, inputs());

    expect(model.lines.every((line) => line.state === 'estimated')).toBe(true);
    expect(model.totals).toEqual({
      all: 54000,
      paid: 0,
      quoted: 0,
      estimated: 54000,
      movable: 54000,
    });
  });

  it('lets a quote replace the estimate and keeps the vendor wording', () => {
    const commitment: Commitment = {
      id: 'c1',
      ruleId: 'food',
      vendor: 'Sri Caterers',
      amount: 52000,
      state: 'quoted',
      quote: '₹520 a plate, starters included, 100 plates minimum',
      inclusions: ['starters'],
      exclusions: [],
    };

    const model = buildModel(pack, inputs({ commitments: [commitment] }));
    const food = model.lines.find((line) => line.ruleId === 'food');

    expect(food?.amount).toBe(52000);
    expect(food?.estimate).toBe(45000);
    expect(food?.state).toBe('quoted');
    expect(food?.vendor).toBe('Sri Caterers');
    expect(food?.quote).toContain('starters included');
    expect(model.totals).toEqual({
      all: 61000,
      paid: 0,
      quoted: 52000,
      estimated: 9000,
      movable: 9000,
    });
  });

  it('counts a paid line as spent and no longer movable', () => {
    const model = buildModel(
      pack,
      inputs({
        commitments: [
          {
            id: 'c2',
            ruleId: 'seating',
            vendor: 'Ravi Tents',
            amount: 9000,
            state: 'paid',
            quote: 'advance paid 12 October',
            inclusions: [],
            exclusions: [],
          },
        ],
      }),
    );

    expect(model.totals.paid).toBe(9000);
    expect(model.totals.movable).toBe(45000);
    expect(model.deadlines.find((d) => d.label === 'Décor')?.locked).toBe(true);
  });

  it('raises the constraints and tasks that the values trigger', () => {
    const quiet = buildModel(pack, inputs());
    expect(quiet.violations).toEqual([]);
    expect(quiet.tasks).toEqual([]);

    const crowded = buildModel(pack, inputs({ values: { guests: 300, venue: 'hall' } }));
    expect(crowded.violations.map((v) => v.id)).toEqual(['capacity']);
    expect(crowded.violations[0]?.severity).toBe('error');
    expect(crowded.tasks.map((t) => t.id)).toEqual(['secondLine']);
  });

  it('turns lead times into dated decisions', () => {
    const model = buildModel(pack, inputs());

    expect(model.deadlines.map((d) => [d.label, d.dateIso])).toEqual([
      ['Caterer', '2027-01-16'],
      ['Décor', '2027-01-31'],
    ]);
  });

  it('schedules the day backwards from the anchor', () => {
    const model = buildModel(pack, inputs());

    expect(model.runOfShow).toEqual([
      { id: 'seat', label: 'Guests seated', startsAt: '09:30', endsAt: '10:00', durationMin: 30 },
    ]);
  });

  it('rounds money to whole units', () => {
    const model = buildModel(pack, inputs({ values: { guests: 35, venue: 'hall' } }));

    for (const line of model.lines) expect(Number.isInteger(line.estimate)).toBe(true);
  });
});
