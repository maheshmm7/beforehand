import { useState } from 'react';
import { applyTheme, nextTheme, readTheme, type Theme } from '@/lib/theme';
import { IconAuto, IconMoon, IconSun } from './icons';
import { Button } from './controls';

const LABEL: Readonly<Record<Theme, string>> = {
  system: 'Theme: follows your system',
  light: 'Theme: light',
  dark: 'Theme: dark',
};

const MARK: Readonly<Record<Theme, React.JSX.Element>> = {
  system: <IconAuto size={18} />,
  light: <IconSun size={18} />,
  dark: <IconMoon size={18} />,
};

export function ThemeToggle(): React.JSX.Element {
  const [theme, setTheme] = useState<Theme>(readTheme);

  return (
    <Button
      small
      variant="ghost"
      ariaLabel={LABEL[theme]}
      title={LABEL[theme]}
      onClick={() => {
        const chosen = nextTheme(theme);
        applyTheme(chosen);
        setTheme(chosen);
      }}
    >
      {MARK[theme]}
    </Button>
  );
}
