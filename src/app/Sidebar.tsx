import { packFor } from '@shared/packs';
import { activeScenarioOf, type Plan } from '@shared/plan';
import { countdown, todayIso } from '@/lib/format';
import { hrefFor, VIEWS, type Route } from '@/lib/router';
import { VIEW_LABELS } from './viewLabels';
import { useWorkspace } from '@/state/useWorkspace';
import { newId } from '@/state/workspace';
import { Button, ButtonLink } from '@/ui/controls';
import { Logo } from '@/ui/Logo';
import styles from './Sidebar.module.css';

function planMeta(plan: Plan): string {
  const away = countdown(todayIso(), plan.eventDateIso);
  return `${packFor(plan.kind).label} · ${away}`;
}

export function Sidebar({ route }: { route: Route }): React.JSX.Element {
  const { workspace, dispatch } = useWorkspace();
  const activePlanId = route.name === 'plan' ? route.planId : null;
  const plan = workspace.plans.find((one) => one.id === activePlanId);

  return (
    <nav aria-label="Plans and sections">
      <a className={styles.brand} href={hrefFor({ name: 'home' })}>
        <Logo />
      </a>

      <ButtonLink href={hrefFor({ name: 'new' })} className={styles.newButton}>
        <span aria-hidden="true">+</span> New plan
      </ButtonLink>

      <p className={styles.groupLabel}>Your plans</p>
      {workspace.plans.length === 0 ? (
        <p className={styles.itemMeta}>Nothing planned yet.</p>
      ) : (
        <ul className={styles.list}>
          {workspace.plans.map((one) => (
            <li key={one.id}>
              <a
                className={styles.item}
                href={hrefFor({ name: 'plan', planId: one.id, view: 'budget' })}
                aria-current={one.id === activePlanId ? 'true' : undefined}
              >
                {one.name}
                <span className={styles.itemMeta}>{planMeta(one)}</span>
              </a>
            </li>
          ))}
        </ul>
      )}

      {plan === undefined ? null : (
        <>
          <p className={styles.groupLabel}>Scenarios</p>
          <ul className={styles.list}>
            {plan.scenarios.map((scenario) => (
              <li key={scenario.id} className={styles.scenarioRow}>
                <button
                  type="button"
                  className={styles.item}
                  aria-current={scenario.id === plan.activeScenarioId ? 'true' : undefined}
                  onClick={() => {
                    dispatch({ type: 'selectScenario', planId: plan.id, scenarioId: scenario.id });
                  }}
                >
                  {scenario.name}
                </button>
                {plan.scenarios.length > 1 ? (
                  <Button
                    small
                    variant="ghost"
                    ariaLabel={`Delete ${scenario.name}`}
                    onClick={() => {
                      dispatch({
                        type: 'deleteScenario',
                        planId: plan.id,
                        scenarioId: scenario.id,
                      });
                    }}
                  >
                    <span aria-hidden="true">×</span>
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
          <Button
            small
            variant="ghost"
            disabled={plan.scenarios.length >= 8}
            onClick={() => {
              dispatch({
                type: 'addScenario',
                planId: plan.id,
                scenarioId: newId('s'),
                name: `Plan ${String.fromCharCode(65 + plan.scenarios.length)}`,
              });
            }}
          >
            Branch from {activeScenarioOf(plan).name}
          </Button>

          <div className={styles.nav}>
            <ul className={styles.list}>
              {VIEWS.map((view) => (
                <li key={view}>
                  <a
                    className={styles.item}
                    href={hrefFor({ name: 'plan', planId: plan.id, view })}
                    aria-current={route.name === 'plan' && route.view === view ? 'page' : undefined}
                  >
                    {VIEW_LABELS[view]}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <div className={styles.footer}>
        <a className={styles.footerLink} href={hrefFor({ name: 'about' })}>
          About
        </a>
        <a className={styles.footerLink} href={hrefFor({ name: 'privacy' })}>
          Privacy
        </a>
      </div>
    </nav>
  );
}
