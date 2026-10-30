import { useState, type ReactNode } from 'react';
import { hrefFor, VIEWS, type Route } from '@/lib/router';
import { useWorkspace } from '@/state/useWorkspace';
import { Button } from '@/ui/controls';
import { ThemeToggle } from '@/ui/ThemeToggle';
import { IconChevron } from '@/ui/icons';
import { Logo } from '@/ui/Logo';
import { Sidebar } from './Sidebar';
import { VIEW_ICONS } from './viewIcons';
import { VIEW_LABELS } from './viewLabels';
import styles from './AppShell.module.css';

/**
 * A workspace, not a document: the shell is exactly the height of the window,
 * the content region scrolls inside it, and the chrome around it — sidebar,
 * dock, tab row — stays put. Nothing the hand is using can be pushed away by
 * something appearing somewhere else.
 *
 * No drawer and no focus trap: the plan switcher opens inline, so keyboard and
 * screen reader order stay in the normal flow of the page.
 */
export function AppShell({
  route,
  dock,
  children,
}: {
  route: Route;
  /** Pinned under the content region, on every screen. */
  dock?: ReactNode;
  children: ReactNode;
}): React.JSX.Element {
  const { workspace } = useWorkspace();
  const [plansOpen, setPlansOpen] = useState(false);
  const planId = route.name === 'plan' ? route.planId : null;
  const plan = workspace.plans.find((one) => one.id === planId);

  return (
    <div className={styles.shell}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className={styles.topbar}>
        <a className={styles.topbarLink} href={hrefFor({ name: 'home' })}>
          <Logo size={24} />
        </a>
        <span className={styles.topbarActions}>
          <ThemeToggle />
          <Button
            small
            onClick={() => {
              setPlansOpen((open) => !open);
            }}
          >
            <span className={styles.planName} title={plan?.name}>
              {plan?.name ?? 'Plans'}
            </span>
            <span className={plansOpen ? styles.chevronUp : undefined}>
              <IconChevron size={16} />
            </span>
          </Button>
        </span>
      </header>

      {plansOpen ? (
        <div className={styles.drawer}>
          <Sidebar route={route} />
        </div>
      ) : null}

      <aside className={styles.sidebar}>
        <Sidebar route={route} />
      </aside>

      <main id="main" className={styles.main}>
        <div className={styles.inner}>{children}</div>
      </main>

      {dock === undefined ? null : <div className={styles.dock}>{dock}</div>}

      {plan === undefined ? null : (
        <nav className={styles.bottomNav} aria-label="Sections">
          {VIEWS.map((view) => (
            <a
              key={view}
              className={styles.bottomNavLink}
              href={hrefFor({ name: 'plan', planId: plan.id, view })}
              aria-current={route.name === 'plan' && route.view === view ? 'page' : undefined}
            >
              <span aria-hidden="true">{VIEW_ICONS[view]}</span>
              {VIEW_LABELS[view]}
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}
