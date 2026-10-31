import { describe, expect, it } from 'vitest';
import { applyDescribedSettings } from './describeSettings.ts';
import { weddingPack } from './packs/wedding.ts';

const apply = (settings: { id: string; value: string }[]) =>
  applyDescribedSettings(weddingPack, settings);

describe('applyDescribedSettings', () => {
  it('reads a number out of text', () => {
    expect(apply([{ id: 'guests', value: '420' }])).toEqual({ guests: 420 });
  });

  it('copes with grouping and spaces the model may add', () => {
    expect(apply([{ id: 'guests', value: '1,200' }])).toEqual({ guests: 800 });
    expect(apply([{ id: 'guests', value: ' 350 ' }])).toEqual({ guests: 350 });
  });

  it('holds a number inside the range the pack allows', () => {
    expect(apply([{ id: 'guests', value: '5000' }])).toEqual({ guests: 800 });
    expect(apply([{ id: 'guests', value: '-10' }])).toEqual({ guests: 50 });
  });

  it('drops a number it cannot read rather than guessing', () => {
    expect(apply([{ id: 'guests', value: 'a few hundred' }])).toEqual({});
  });

  it('accepts a choice by its id or by its label', () => {
    expect(apply([{ id: 'venueClass', value: 'hotel' }])).toEqual({ venueClass: 'hotel' });
    expect(apply([{ id: 'venueClass', value: 'Hotel ballroom' }])).toEqual({ venueClass: 'hotel' });
    expect(apply([{ id: 'venueClass', value: 'HOTEL BALLROOM' }])).toEqual({ venueClass: 'hotel' });
  });

  it('drops a choice the pack does not offer', () => {
    expect(apply([{ id: 'venueClass', value: 'beach resort' }])).toEqual({});
  });

  it('ignores a setting this pack does not have', () => {
    expect(apply([{ id: 'budgetTotal', value: '1800000' }])).toEqual({});
  });

  it('takes everything it can and leaves the rest', () => {
    const values = apply([
      { id: 'guests', value: '420' },
      { id: 'venueClass', value: 'hotel' },
      { id: 'menuTier', value: 'Premium' },
      { id: 'nonsense', value: 'x' },
      { id: 'functions', value: 'every single one' },
    ]);

    expect(values).toEqual({ guests: 420, venueClass: 'hotel', menuTier: 'premium' });
  });
});
