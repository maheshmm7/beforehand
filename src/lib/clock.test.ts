import { describe, expect, it } from 'vitest';
import { isTime, readClock, shiftMinutes, timeLabel, writeClock } from './clock';

describe('clock', () => {
  it('recognises a time and refuses anything else', () => {
    expect(isTime('09:30')).toBe(true);
    expect(isTime('23:59')).toBe(true);
    expect(isTime('24:00')).toBe(false);
    expect(isTime('9:30')).toBe(false);
    expect(isTime('09:60')).toBe(false);
  });

  it('reads the twenty-four hour clock as people say it', () => {
    expect(readClock('09:30')).toEqual({ hour12: 9, minute: 30, meridiem: 'am' });
    expect(readClock('17:00')).toEqual({ hour12: 5, minute: 0, meridiem: 'pm' });
    expect(readClock('00:15')).toEqual({ hour12: 12, minute: 15, meridiem: 'am' });
    expect(readClock('12:45')).toEqual({ hour12: 12, minute: 45, meridiem: 'pm' });
  });

  it('writes it back, midnight and noon included', () => {
    expect(writeClock({ hour12: 12, minute: 0, meridiem: 'am' })).toBe('00:00');
    expect(writeClock({ hour12: 12, minute: 0, meridiem: 'pm' })).toBe('12:00');
    expect(writeClock({ hour12: 5, minute: 30, meridiem: 'pm' })).toBe('17:30');
  });

  it('survives a round trip at every hour', () => {
    for (let hour = 0; hour < 24; hour += 1) {
      const iso = `${String(hour).padStart(2, '0')}:15`;
      expect(writeClock(readClock(iso))).toBe(iso);
    }
  });

  it('wraps past midnight rather than clamping', () => {
    expect(shiftMinutes('23:50', 15)).toBe('00:05');
    expect(shiftMinutes('00:05', -15)).toBe('23:50');
    expect(shiftMinutes('09:30', 15)).toBe('09:45');
  });

  it('says the time the way it is spoken', () => {
    expect(timeLabel('09:30')).toBe('9:30 am');
    expect(timeLabel('17:00')).toBe('5:00 pm');
    expect(timeLabel('00:05')).toBe('12:05 am');
  });
});
