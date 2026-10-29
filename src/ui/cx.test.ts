import { describe, expect, it } from 'vitest';
import { cx } from './cx';

describe('cx', () => {
  it('joins the names it is given', () => {
    expect(cx('a', 'b')).toBe('a b');
  });

  it('drops anything falsy, including an undefined css-module lookup', () => {
    expect(cx('a', undefined, false, null, '', 'b')).toBe('a b');
  });

  it('returns an empty string when nothing survives', () => {
    expect(cx(undefined, false)).toBe('');
  });
});
