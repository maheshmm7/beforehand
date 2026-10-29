import { packList } from '@shared/packs';
import { hrefFor } from '@/lib/router';
import { countdown, todayIso } from '@/lib/format';
import { useWorkspace } from '@/state/useWorkspace';
import { ButtonLink, Card } from '@/ui/controls';
import { LogoMark } from '@/ui/Logo';
import styles from './pages.module.css';

const STEPS = [
  {
    title: 'Describe the event',
    text: 'A few levers: how many people, where, what kind of food. Or say it in a sentence and let the assistant set it up.',
  },
  {
    title: 'Move one thing',
    text: 'Every cost, deadline and task that depends on it recomputes, and you see the difference before you accept it.',
  },
  {
    title: 'Replace guesses with promises',
    text: 'Paste what a vendor actually sent. That line stops being an estimate and starts being a quote, in their own words.',
  },
];

export function HomePage(): React.JSX.Element {
  const { workspace } = useWorkspace();

  return (
    <div>
      <section className={styles.hero}>
        <p className={styles.kicker}>
          <LogoMark size={16} /> Beforehand
        </p>
        <h1 className={styles.heroTitle}>Know what a decision costs before you make it.</h1>
        <p className={styles.heroText}>
          Every other planner is a recorder: you decide, it stores. This one is a simulator. Invite
          fifty more people and it tells you, right then, that it is another ₹1.2 lakh, that two
          deadlines just moved closer, and that you now need a second serving line.
        </p>
        <div className={styles.heroActions}>
          <ButtonLink href={hrefFor({ name: 'new' })} variant="primary">
            Start a plan
          </ButtonLink>
          {workspace.plans[0] === undefined ? null : (
            <ButtonLink
              href={hrefFor({ name: 'plan', planId: workspace.plans[0].id, view: 'budget' })}
            >
              Back to {workspace.plans[0].name}
            </ButtonLink>
          )}
        </div>
      </section>

      {workspace.plans.length === 0 ? null : (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Your plans</h2>
          <div className={styles.kinds}>
            {workspace.plans.map((plan) => (
              <Card key={plan.id}>
                <p className={styles.stepTitle}>{plan.name}</p>
                <p className={styles.stepText}>
                  {countdown(todayIso(), plan.eventDateIso)} away
                  {plan.place === '' ? '' : ` · ${plan.place}`}
                </p>
                <div className={styles.heroActions}>
                  <ButtonLink
                    small
                    href={hrefFor({ name: 'plan', planId: plan.id, view: 'budget' })}
                  >
                    Open
                  </ButtonLink>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>How it works</h2>
        <div className={styles.steps}>
          {STEPS.map((step, index) => (
            <div key={step.title} className={styles.step}>
              <span className={styles.stepNumber}>{index + 1}</span>
              <p className={styles.stepTitle}>{step.title}</p>
              <p className={styles.stepText}>{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Three kinds of event, one engine</h2>
        <div className={styles.kinds}>
          {packList.map((pack) => (
            <Card key={pack.kind}>
              <p className={styles.stepTitle}>{pack.label}</p>
              <p className={styles.stepText}>{pack.blurb}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>What it does not do</h2>
        <p className={styles.stepText}>
          The figures are planning estimates, not quotes, until you replace them with a real price
          from a real vendor. Nothing here is financial advice, and it is not a substitute for a
          professional planner, caterer or venue manager. Your plans stay in this browser: there is
          no account and no copy on a server.
        </p>
      </section>
    </div>
  );
}
