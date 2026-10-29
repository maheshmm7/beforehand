export const THEMES = ['system', 'light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

const KEY = 'beforehand.theme';

function isTheme(value: string | null): value is Theme {
  return value !== null && THEMES.some((theme) => theme === value);
}

export function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(KEY);
    return isTheme(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

/** `system` removes the attribute so the media query decides. */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);

  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // A browser that refuses storage still gets the theme for this visit.
  }
}

export function applyStoredTheme(): void {
  const theme = readTheme();
  if (theme !== 'system') document.documentElement.setAttribute('data-theme', theme);
}

export function nextTheme(theme: Theme): Theme {
  const index = THEMES.indexOf(theme);
  return THEMES[(index + 1) % THEMES.length] ?? 'system';
}
