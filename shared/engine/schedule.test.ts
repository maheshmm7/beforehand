import { describe, expect, it } from 'vitest';
import { contextFor } from './expr';
import { EngineError } from './errors';
import { daysBetween, deadlinesFor, runOfShowFor, shiftDays } from './schedule';
import type { ActiveTask, CostLine, EventPack } from './types';

const pack: EventPack = {
  kind: 'birthday',
  label: 'Test',
  blurb: '',
  anchorLabel: 'Anchor',
  variables: [
    {
      kind: 'choice',
      id: 'extras',
      label: 'Extras',
      fallback: 'yes',
      options: [
        { id: 'yes', label: 'Yes' },
        { id: 'no', label: 'No' },
      ],
    },
  ],
  quantities: [],
  costRules: [],
  constraints: [],
  tasks: [],
  runOfShow: [
    { id: 'a', label: 'Setting up', durationMin: 90 },
    {
      id: 'b',
      label: 'Games',
      durationMin: 45,
      when: { op: 'is', id: 'extras', value: 'yes' },
    },
    { id: 'c', label: 'Food', durationMin: 45 },
  ],
};

function line(partial: Partial<CostLine> & Pick<CostLine, 'ruleId' | 'decision'>): CostLine {
  return {
    label: partial.ruleId,
    category: 'things',
    amount: 0,
    estimate: 0,
    state: 'estimated',
    basis: '',
    leadTimeDays: 0,
    ...partial,
  };
}

describe('date arithmetic', () => {
  it('shifts a plain date without drifting across a time zone', () => {
    expect(shiftDays('2027-03-02', -21)).toBe('2027-02-09');
    expect(shiftDays('2027-01-01', -1)).toBe('2026-12-31');
    expect(shiftDays('2028-02-28', 1)).toBe('2028-02-29');
  });

  it('counts the days between two dates, signed', () => {
    expect(daysBetween('2027-03-01', '2027-03-11')).toBe(10);
    expect(daysBetween('2027-03-11', '2027-03-01')).toBe(-10);
  });

  it('refuses anything that is not a plain date', () => {
    expect(() => shiftDays('2 March 2027', 1)).toThrow(EngineError);
    expect(() => shiftDays('2027-13-45', 1)).toThrow(EngineError);
    expect(() => daysBetween('nope', '2027-03-01')).toThrow(EngineError);
  });
});

describe('deadlinesFor', () => {
  const eventDate = '2027-03-02';

  it('gives each decision the earliest date any of its lines demands', () => {
    const deadlines = deadlinesFor(
      [
        line({ ruleId: 'venue', decision: 'Venue', leadTimeDays: 120 }),
        line({ ruleId: 'power', decision: 'Venue', leadTimeDays: 15 }),
        line({ ruleId: 'cake', decision: 'Cake', leadTimeDays: 7 }),
      ],
      [],
      eventDate,
    );

    expect(deadlines.map((d) => [d.label, d.dateIso, d.daysBefore])).toEqual([
      ['Venue', '2026-11-02', 120],
      ['Cake', '2027-02-23', 7],
    ]);
  });

  it('marks a decision locked once anything under it is paid', () => {
    const deadlines = deadlinesFor(
      [
        line({ ruleId: 'venue', decision: 'Venue', leadTimeDays: 120 }),
        line({ ruleId: 'power', decision: 'Venue', leadTimeDays: 15, state: 'paid' }),
        line({ ruleId: 'cake', decision: 'Cake', leadTimeDays: 7, state: 'quoted' }),
      ],
      [],
      eventDate,
    );

    expect(deadlines.find((d) => d.label === 'Venue')?.locked).toBe(true);
    expect(deadlines.find((d) => d.label === 'Cake')?.locked).toBe(false);
  });

  it('includes tasks alongside decisions, in date order', () => {
    const tasks: ActiveTask[] = [{ id: 'tasting', label: 'Book a tasting', leadTimeDays: 50 }];
    const deadlines = deadlinesFor(
      [line({ ruleId: 'cake', decision: 'Cake', leadTimeDays: 7 })],
      tasks,
      eventDate,
    );

    expect(deadlines.map((d) => d.id)).toEqual(['task:tasting', 'decision:Cake']);
  });

  it('returns nothing when there is nothing to decide', () => {
    expect(deadlinesFor([], [], eventDate)).toEqual([]);
  });
});

describe('runOfShowFor', () => {
  it('schedules backwards so the last segment ends on the anchor', () => {
    const segments = runOfShowFor(pack, contextFor(pack, {}), '11:00');

    expect(segments.map((s) => [s.label, s.startsAt, s.endsAt])).toEqual([
      ['Setting up', '08:00', '09:30'],
      ['Games', '09:30', '10:15'],
      ['Food', '10:15', '11:00'],
    ]);
  });

  it('drops a segment whose condition does not hold, and starts later', () => {
    const segments = runOfShowFor(pack, contextFor(pack, { extras: 'no' }), '11:00');

    expect(segments.map((s) => s.id)).toEqual(['a', 'c']);
    expect(segments[0]?.startsAt).toBe('08:45');
  });

  it('wraps into the previous day for an early start', () => {
    const segments = runOfShowFor(pack, contextFor(pack, {}), '02:00');

    expect(segments[0]?.startsAt).toBe('23:00');
    expect(segments.at(-1)?.endsAt).toBe('02:00');
  });

  it('refuses a time that is not a time', () => {
    expect(() => runOfShowFor(pack, contextFor(pack, {}), '25:00')).toThrow(EngineError);
    expect(() => runOfShowFor(pack, contextFor(pack, {}), 'noon')).toThrow(EngineError);
  });
});
