import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyStoredTheme, applyTheme, nextTheme, readTheme, THEMES, type Theme } from './theme';

const KEY = 'beforehand.theme';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('readTheme', () => {
  it('follows the system until told otherwise', () => {
    expect(readTheme()).toBe('system');
  });

  it('reads back what was stored', () => {
    localStorage.setItem(KEY, 'dark');

    expect(readTheme()).toBe('dark');
  });

  it('ignores a stored value that is not a theme', () => {
    localStorage.setItem(KEY, 'neon');

    expect(readTheme()).toBe('system');
  });

  it('survives storage it cannot read', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
    });

    expect(readTheme()).toBe('system');
  });
});

describe('applyTheme', () => {
  it('marks the document and remembers the choice', () => {
    applyTheme('dark');

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem(KEY)).toBe('dark');
  });

  it('removes the mark for system, so the media query decides', () => {
    applyTheme('light');
    applyTheme('system');

    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(localStorage.getItem(KEY)).toBe('system');
  });

  it('still applies the theme when storage refuses', () => {
    vi.stubGlobal('localStorage', {
      setItem: () => {
        throw new Error('quota');
      },
    });

    expect(() => {
      applyTheme('dark');
    }).not.toThrow();
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});

describe('applyStoredTheme', () => {
  it('marks the document before paint when a theme was chosen', () => {
    localStorage.setItem(KEY, 'light');
    applyStoredTheme();

    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('leaves the document unmarked for system', () => {
    applyStoredTheme();

    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });
});

describe('nextTheme', () => {
  it('cycles through every theme and returns to the start', () => {
    let theme: Theme = THEMES[0];
    const seen: Theme[] = [theme];
    for (let step = 0; step < THEMES.length - 1; step += 1) {
      theme = nextTheme(theme);
      seen.push(theme);
    }

    expect(new Set(seen).size).toBe(THEMES.length);
    expect(nextTheme(theme)).toBe(THEMES[0]);
  });
});
