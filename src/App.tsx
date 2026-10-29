import { lazy, Suspense, useLayoutEffect } from 'react';
import { AppShell } from './app/AppShell';
import { hrefFor, useRoute } from './lib/router';
import { useWorkspace } from './state/useWorkspace';
import { AboutPage } from './pages/AboutPage';
import { HomePage } from './pages/HomePage';
import { NewPlanPage } from './pages/NewPlanPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { ButtonLink, EmptyState } from './ui/controls';
import { LoadingScreen } from './ui/LoadingScreen';

// The plan screens carry the engine and every view; they are not needed to
// paint the landing page, so they arrive on their own.
const PlanPage = lazy(async () => import('./app/PlanPage'));

function NotFound({ title }: { title: string }): React.JSX.Element {
  return (
    <EmptyState title={title}>
      <p>
        <ButtonLink href={hrefFor({ name: 'home' })}>Back to the start</ButtonLink>
      </p>
    </EmptyState>
  );
}

export function App(): React.JSX.Element {
  const route = useRoute();
  const { workspace } = useWorkspace();

  // Set before paint so assistive technology never announces the old language.
  useLayoutEffect(() => {
    document.documentElement.lang = 'en';
  }, []);

  const plan =
    route.name === 'plan' ? workspace.plans.find((one) => one.id === route.planId) : undefined;

  return (
    <AppShell route={route}>
      {route.name === 'home' ? <HomePage /> : null}
      {route.name === 'new' ? <NewPlanPage /> : null}
      {route.name === 'about' ? <AboutPage /> : null}
      {route.name === 'privacy' ? <PrivacyPage /> : null}
      {route.name === 'notFound' ? <NotFound title="There is nothing at that address." /> : null}
      {route.name === 'plan' ? (
        plan === undefined ? (
          <NotFound title="That plan is not in this browser." />
        ) : (
          <Suspense fallback={<LoadingScreen label="Working out the knock-on costs" />}>
            <PlanPage plan={plan} view={route.view} />
          </Suspense>
        )
      ) : null}
    </AppShell>
  );
}
