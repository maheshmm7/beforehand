import { describe, expect, it } from 'vitest';
import {
  countdown,
  longDate,
  money,
  moneyShort,
  plural,
  shortDate,
  signedMoney,
  todayIso,
} from './format';

describe('money', () => {
  it('writes whole rupees in the Indian grouping', () => {
    expect(money(1269775)).toBe('₹12,69,775');
    expect(money(0)).toBe('₹0');
  });

  it('rounds rather than showing paise', () => {
    expect(money(450.4)).toBe('₹450');
    expect(money(450.6)).toBe('₹451');
  });

  it('shortens headline figures', () => {
    expect(moneyShort(1269775)).toBe('₹12.7L');
    expect(moneyShort(21500000)).toBe('₹2.15Cr');
    expect(moneyShort(45000)).toBe('₹45k');
    expect(moneyShort(850)).toBe('₹850');
    expect(moneyShort(-1269775)).toBe('-₹12.7L');
  });

  it('marks an increase with a sign', () => {
    expect(signedMoney(76275)).toBe('+₹76,275');
    expect(signedMoney(-5000)).toBe('-₹5,000');
    expect(signedMoney(0)).toBe('₹0');
  });
});

describe('dates', () => {
  it('writes a plain date in words', () => {
    expect(longDate('2027-03-02')).toBe('2 Mar 2027');
    expect(shortDate('2027-03-02')).toBe('2 Mar');
  });

  it('gives back nonsense unchanged rather than inventing a date', () => {
    expect(longDate('not a date')).toBe('not a date');
    expect(shortDate('')).toBe('');
  });

  it('reads today in the local calendar, not in UTC', () => {
    expect(todayIso(new Date(2027, 2, 2, 23, 30))).toBe('2027-03-02');
  });

  it('counts down in words a person would use', () => {
    expect(countdown('2027-03-01', '2027-03-01')).toBe('today');
    expect(countdown('2027-03-01', '2027-03-02')).toBe('tomorrow');
    expect(countdown('2027-03-01', '2027-06-29')).toBe('120 days');
    expect(countdown('2027-03-02', '2027-03-01')).toBe('past');
    expect(countdown('rubbish', '2027-03-01')).toBe('');
  });
});

describe('plural', () => {
  it('agrees with the number', () => {
    expect(plural(1, 'line')).toBe('1 line');
    expect(plural(3, 'line')).toBe('3 lines');
    expect(plural(0, 'line')).toBe('0 lines');
  });

  it('takes an irregular plural', () => {
    expect(plural(2, 'person', 'people')).toBe('2 people');
  });
});
