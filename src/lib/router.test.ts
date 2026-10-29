import { describe, expect, it } from 'vitest';
import { hrefFor, parseRoute } from './router';

describe('parseRoute', () => {
  it('reads the landing page from an empty or bare hash', () => {
    expect(parseRoute('')).toEqual({ name: 'home' });
    expect(parseRoute('#')).toEqual({ name: 'home' });
    expect(parseRoute('#/')).toEqual({ name: 'home' });
  });

  it('reads the static pages', () => {
    expect(parseRoute('#/new')).toEqual({ name: 'new' });
    expect(parseRoute('#/about')).toEqual({ name: 'about' });
    expect(parseRoute('#/privacy')).toEqual({ name: 'privacy' });
  });

  it('reads a plan and its view, defaulting to the budget', () => {
    expect(parseRoute('#/plan/p-1/timeline')).toEqual({
      name: 'plan',
      planId: 'p-1',
      view: 'timeline',
    });
    expect(parseRoute('#/plan/p-1')).toEqual({ name: 'plan', planId: 'p-1', view: 'budget' });
  });

  it('decodes a plan id that was escaped', () => {
    expect(parseRoute('#/plan/a%20b/budget')).toEqual({
      name: 'plan',
      planId: 'a b',
      view: 'budget',
    });
  });

  it('refuses a view it does not have', () => {
    expect(parseRoute('#/plan/p-1/accounts')).toEqual({ name: 'notFound' });
  });

  it('leaves an in-page anchor on the landing page', () => {
    // The marketing nav uses #how and friends; they are not addresses.
    expect(parseRoute('#how')).toEqual({ name: 'home' });
    expect(parseRoute('#questions')).toEqual({ name: 'home' });
    expect(parseRoute('#main')).toEqual({ name: 'home' });
  });

  it('refuses anything else rather than guessing', () => {
    expect(parseRoute('#/nowhere')).toEqual({ name: 'notFound' });
    expect(parseRoute('#/plan')).toEqual({ name: 'notFound' });
    expect(parseRoute('#/plan//budget')).toEqual({ name: 'notFound' });
    expect(parseRoute('#/plan/p-1/budget/extra')).toEqual({ name: 'notFound' });
  });

  it('ignores stray slashes', () => {
    expect(parseRoute('#//about//')).toEqual({ name: 'about' });
  });
});

describe('hrefFor', () => {
  it('round-trips every route', () => {
    const routes = [
      { name: 'home' },
      { name: 'new' },
      { name: 'about' },
      { name: 'privacy' },
      { name: 'plan', planId: 'p-1', view: 'vendors' },
    ] as const;

    for (const route of routes) {
      expect(parseRoute(hrefFor(route))).toEqual(route);
    }
  });

  it('sends an unknown address back to the start', () => {
    expect(hrefFor({ name: 'notFound' })).toBe('#/');
  });

  it('escapes a plan id that would break the address', () => {
    expect(hrefFor({ name: 'plan', planId: 'a/b', view: 'budget' })).toBe('#/plan/a%2Fb/budget');
  });
});
