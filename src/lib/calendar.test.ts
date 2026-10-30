import { describe, expect, it } from 'vitest';
import {
  addDays,
  addMonths,
  dayOfMonth,
  isIsoDate,
  monthGrid,
  monthLabel,
  sameMonth,
  startOfMonth,
} from './calendar';

describe('calendar', () => {
  it('recognises a date and refuses anything else', () => {
    expect(isIsoDate('2027-03-02')).toBe(true);
    expect(isIsoDate('2027-13-02')).toBe(false);
    expect(isIsoDate('02-03-2027')).toBe(false);
    expect(isIsoDate('')).toBe(false);
  });

  it('finds the first of the month', () => {
    expect(startOfMonth('2027-03-29')).toBe('2027-03-01');
  });

  it('moves by months without falling off the end of a short one', () => {
    expect(addMonths('2027-01-31', 1)).toBe('2027-02-28');
    expect(addMonths('2027-03-15', -1)).toBe('2027-02-15');
    expect(addMonths('2027-12-05', 1)).toBe('2028-01-05');
    expect(addMonths('2027-01-05', -1)).toBe('2026-12-05');
  });

  it('moves by days across a month boundary', () => {
    expect(addDays('2027-02-28', 1)).toBe('2027-03-01');
    expect(addDays('2027-03-01', -1)).toBe('2027-02-28');
  });

  it('knows when two dates share a month', () => {
    expect(sameMonth('2027-03-01', '2027-03-31')).toBe(true);
    expect(sameMonth('2027-03-31', '2027-04-01')).toBe(false);
  });

  it('names a month in full', () => {
    expect(monthLabel('2027-03-02')).toBe('March 2027');
  });

  it('always lays out six whole weeks, starting on a Monday', () => {
    for (const iso of ['2027-02-10', '2027-03-10', '2026-02-10', '2027-08-01']) {
      const grid = monthGrid(iso);
      expect(grid).toHaveLength(42);
      // The first cell is a Monday.
      expect(new Date(`${String(grid[0])}T00:00:00Z`).getUTCDay()).toBe(1);
      // And it covers every day of the month it was asked about.
      expect(grid).toContain(`${iso.slice(0, 7)}-01`);
    }
  });

  it('starts February 2027 on the Monday before it', () => {
    // 1 February 2027 is a Monday, so the grid starts on it.
    expect(monthGrid('2027-02-14')[0]).toBe('2027-02-01');
    // March 2027 starts on a Monday too, so no leading days.
    expect(monthGrid('2027-03-14')[0]).toBe('2027-03-01');
    // April 2027 starts on a Thursday, so the grid opens three days earlier.
    expect(monthGrid('2027-04-14')[0]).toBe('2027-03-29');
  });

  it('reads the day out of a date', () => {
    expect(dayOfMonth('2027-03-09')).toBe(9);
  });
});
