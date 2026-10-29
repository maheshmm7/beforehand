import { describe, expect, it } from 'vitest';
import { fillStyle } from './fillStyle';

describe('fillStyle', () => {
  it('turns a fraction into the track fill', () => {
    expect(fillStyle(0)).toEqual({ '--fill': '0%' });
    expect(fillStyle(0.5)).toEqual({ '--fill': '50%' });
    expect(fillStyle(1)).toEqual({ '--fill': '100%' });
  });

  it('rounds, so the style never carries float noise', () => {
    expect(fillStyle(1 / 3)).toEqual({ '--fill': '33%' });
  });

  it('clamps anything outside the track', () => {
    expect(fillStyle(-2)).toEqual({ '--fill': '0%' });
    expect(fillStyle(4)).toEqual({ '--fill': '100%' });
  });
});
