import { packList } from '@shared/packs';
import { countdown, todayIso } from '@/lib/format';
import { hrefFor } from '@/lib/router';
import { useWorkspace } from '@/state/useWorkspace';
import { ButtonLink } from '@/ui/controls';
import { cx } from '@/ui/cx';
import {
  IconArrow,
  IconBranch,
  IconCalendar,
  IconCheck,
  IconChevron,
  IconCross,
  IconLock,
  IconReceipt,
  IconRipple,
  IconScale,
  IconSpark,
} from '@/ui/icons';
import { HeroDemo } from './landing/HeroDemo';
import { Reveal } from './landing/Reveal';
import styles from './landing/landing.module.css';

const STEPS = [
  {
    title: 'Describe the event',
    text: 'Move a few levers, or say it in one sentence and let the assistant set them for you. Rough numbers are fine.',
  },
  {
    title: 'Move one thing',
    text: 'Every cost, deadline and task that depends on it recomputes, and the difference is shown before you accept it.',
  },
  {
    title: 'Replace guesses with promises',
    text: 'Paste what a vendor actually sent. That line stops being an estimate and becomes a quote, in their own words.',
  },
] as const;

const FEATURES = [
  {
    icon: <IconRipple />,
    title: 'The blast radius',
    text: 'Change the guest count and see the six lines it moves, the deadlines it pulls forward and the task it creates — before you commit.',
  },
  {
    icon: <IconReceipt />,
    title: 'Three states for every rupee',
    text: 'Estimated by the model, quoted by a named vendor, or paid and gone. You always know how much of the plan is still free to change.',
  },
  {
    icon: <IconCalendar />,
    title: 'Deadlines, not a to-do list',
    text: 'Each date is the last day a choice can be made for the plan behind it to still be possible, worked out from the notice each thing needs.',
  },
  {
    icon: <IconBranch />,
    title: 'Scenario branches',
    text: 'Keep “hotel, 350 guests” and “open lawn, 450” side by side as living plans, and promote one when you decide.',
  },
  {
    icon: <IconSpark />,
    title: 'Ideas that actually fit',
    text: 'Suggestions are asked for against what the plan can still absorb, and each comes back with its cost and how far ahead to book it.',
  },
  {
    icon: <IconLock />,
    title: 'No account, ever',
    text: 'Plans live in this browser. There is no sign-up, no password and no copy on a server — so there is nothing to leak.',
  },
] as const;

const RECORDER = [
  'You type a number; it stores the number',
  'Food and guest count are unrelated columns',
  'Dates are whatever you typed',
  'Finds the overrun when the invoices arrive',
] as const;

const SIMULATOR = [
  'You move a lever; it works out the consequence',
  'Food, seating, invitations and transport all follow headcount',
  'Dates are computed from the notice each vendor needs',
  'Shows the overrun before you agree to it',
] as const;

const QUESTIONS = [
  {
    q: 'Where do the numbers come from?',
    a: 'A hand-authored cost model for each kind of event, written as rules rather than a price list. They are planning estimates for an Indian city, meant as a defensible starting point. The moment you record a real quote, that line stops being an estimate.',
  },
  {
    q: 'What does the AI actually do?',
    a: 'It reads and it proposes. It turns a sentence about your event into settings, reads a pasted vendor message into a structured quote, and suggests ideas that fit your headroom. It never does the arithmetic — every figure is computed by ordinary code, which is why each one can show its working.',
  },
  {
    q: 'Does it work without the assistant?',
    a: 'Completely. The simulator, both timelines and the vendor ledger are deterministic. The assistant is a convenience on top, not the engine.',
  },
  {
    q: 'Where is my data?',
    a: 'In this browser, and nowhere else. No account, no server copy, no analytics, no cookies. When you ask the assistant to read something, only that extract is sent, with phone numbers, emails and links stripped out first.',
  },
  {
    q: 'Is it only for weddings?',
    a: 'No. The same engine runs birthdays, where the clock matters more than the money, and community events, which have volunteers, permissions and sponsorship — so the budget can come out in credit.',
  },
] as const;

export function HomePage(): React.JSX.Element {
  const { workspace } = useWorkspace();
  const today = todayIso();

  return (
    <>
      <section className={styles.hero}>
        <div className={cx(styles.wrap, styles.heroGrid)}>
          <div>
            <p className={styles.eyebrow}>
              <span className={styles.eyebrowDot}>
                <IconRipple size={15} />
              </span>
              Weddings · Birthdays · Community events
            </p>

            <h1 className={styles.title}>
              Know what a decision costs <em className={styles.titleMark}>before</em> you make it.
            </h1>

            <p className={styles.lead}>
              Every other planner is a recorder: you decide, it stores. This one is a simulator.
              Move one lever and it shows you every cost, deadline and task that moves with it —
              while you can still change your mind.
            </p>

            <div className={styles.heroActions}>
              <ButtonLink large variant="primary" href={hrefFor({ name: 'new' })}>
                Start a plan <IconArrow size={18} />
              </ButtonLink>
              <ButtonLink large href="#how">
                See how it works
              </ButtonLink>
            </div>

            <p className={styles.heroNote}>
              <span>
                <IconCheck size={15} /> Free, no sign-up
              </span>
              <span>
                <IconCheck size={15} /> Works offline
              </span>
              <span>
                <IconCheck size={15} /> Nothing stored on a server
              </span>
            </p>
          </div>

          <HeroDemo />
        </div>
      </section>

      {workspace.plans.length === 0 ? null : (
        <Reveal className={cx(styles.section, styles.wrap)}>
          <div className={styles.sectionHead}>
            <p className={styles.kicker}>Pick up where you left off</p>
            <h2 className={styles.sectionTitle}>Your plans</h2>
          </div>
          <div className={styles.plans}>
            {workspace.plans.map((plan) => (
              <a
                key={plan.id}
                className={styles.planCard}
                href={hrefFor({ name: 'plan', planId: plan.id, view: 'budget' })}
              >
                <span className={styles.planName}>{plan.name}</span>
                <span className={styles.planMeta}>
                  {countdown(today, plan.eventDateIso)} away
                  {plan.place === '' ? '' : ` · ${plan.place}`}
                </span>
                <span className={styles.planGo}>
                  Open <IconArrow size={16} />
                </span>
              </a>
            ))}
          </div>
        </Reveal>
      )}

      <Reveal id="how" className={cx(styles.section, styles.wrap)}>
        <div className={styles.sectionHead}>
          <p className={styles.kicker}>How it works</p>
          <h2 className={styles.sectionTitle}>Three steps, and the third is the one that counts</h2>
          <p className={styles.sectionLead}>
            An event is not a checklist. It is a graph of decisions that pull on each other, and the
            pull is what nobody models.
          </p>
        </div>

        <ol className={styles.steps}>
          {STEPS.map((step, index) => (
            <li key={step.title} className={styles.step}>
              <span className={styles.stepNumber}>{index + 1}</span>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepText}>{step.text}</p>
            </li>
          ))}
        </ol>
      </Reveal>

      <Reveal className={cx(styles.section, styles.wrap)}>
        <div className={styles.sectionHead}>
          <p className={styles.kicker}>The difference</p>
          <h2 className={styles.sectionTitle}>A recorder stores. A simulator warns.</h2>
        </div>

        <div className={styles.compare}>
          <div className={styles.compareCard}>
            <p className={styles.compareLabel}>Every other planner</p>
            <h3 className={styles.compareTitle}>A spreadsheet with a nicer skin</h3>
            <ul className={styles.compareList}>
              {RECORDER.map((item) => (
                <li key={item} className={styles.compareItem}>
                  <span className={styles.no}>
                    <IconCross size={18} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className={cx(styles.compareCard, styles.compareCardUs)}>
            <p className={styles.compareLabel}>Beforehand</p>
            <h3 className={styles.compareTitle}>A model that answers back</h3>
            <ul className={styles.compareList}>
              {SIMULATOR.map((item) => (
                <li key={item} className={styles.compareItem}>
                  <span className={styles.yes}>
                    <IconCheck size={18} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Reveal>

      <Reveal id="what" className={cx(styles.section, styles.wrap)}>
        <div className={styles.sectionHead}>
          <p className={styles.kicker}>What you get</p>
          <h2 className={styles.sectionTitle}>Six things no other planner does</h2>
        </div>

        <div className={styles.features}>
          {FEATURES.map((feature) => (
            <article key={feature.title} className={styles.feature}>
              <span className={styles.featureIcon}>{feature.icon}</span>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureText}>{feature.text}</p>
            </article>
          ))}
        </div>
      </Reveal>

      <Reveal id="kinds" className={cx(styles.section, styles.wrap)}>
        <div className={styles.sectionHead}>
          <p className={styles.kicker}>Event types</p>
          <h2 className={styles.sectionTitle}>One engine, three very different problems</h2>
          <p className={styles.sectionLead}>
            The difference between them is data, not code — and each has its own master variable.
          </p>
        </div>

        <div className={styles.kinds}>
          {packList.map((pack) => (
            <article key={pack.kind} className={styles.kind}>
              <h3 className={styles.kindName}>{pack.label}</h3>
              <p className={styles.kindBlurb}>{pack.blurb}</p>
              <p className={styles.kindMeta}>
                <span className={styles.kindTag}>{pack.costRules.length} cost rules</span>
                <span className={styles.kindTag}>{pack.variables.length} levers</span>
                <span className={styles.kindTag}>{pack.constraints.length} warnings</span>
              </p>
            </article>
          ))}
        </div>
      </Reveal>

      <Reveal className={cx(styles.section, styles.wrap)}>
        <div className={styles.sectionHead}>
          <p className={styles.kicker}>Where the AI sits</p>
          <h2 className={styles.sectionTitle}>It reads and proposes. It never does the sums.</h2>
          <p className={styles.sectionLead}>
            Every figure is computed by ordinary code, which is why each one shows its working
            underneath it — “770 servings × 450” — and why a number can never be invented.
          </p>
        </div>

        <div className={styles.features}>
          <article className={styles.feature}>
            <span className={styles.featureIcon}>
              <IconScale />
            </span>
            <h3 className={styles.featureTitle}>Checked, not trusted</h3>
            <p className={styles.featureText}>
              What the model returns is validated against the same contract the app was promised. A
              reply that invents a field or wanders off the shape is refused, not shown.
            </p>
          </article>
          <article className={styles.feature}>
            <span className={styles.featureIcon}>
              <IconLock />
            </span>
            <h3 className={styles.featureTitle}>Stripped before sending</h3>
            <p className={styles.featureText}>
              Phone numbers, emails and links are removed in the browser and again on the server.
              Only the extract you pasted is sent, never your plan.
            </p>
          </article>
          <article className={styles.feature}>
            <span className={styles.featureIcon}>
              <IconCheck />
            </span>
            <h3 className={styles.featureTitle}>Optional by design</h3>
            <p className={styles.featureText}>
              Turn the assistant off and everything else still works. The engine has no opinion
              about whether a language model is available.
            </p>
          </article>
        </div>
      </Reveal>

      <Reveal id="questions" className={cx(styles.section, styles.wrap)}>
        <div className={styles.sectionHead}>
          <p className={styles.kicker}>Questions</p>
          <h2 className={styles.sectionTitle}>The things people ask first</h2>
        </div>

        <div className={styles.faq}>
          {QUESTIONS.map((item) => (
            <details key={item.q} className={styles.faqItem}>
              <summary className={styles.faqQuestion}>
                {item.q}
                <span className={styles.faqChevron}>
                  <IconChevron size={18} />
                </span>
              </summary>
              <p className={styles.faqAnswer}>{item.a}</p>
            </details>
          ))}
        </div>
      </Reveal>

      <div className={styles.wrap}>
        <Reveal className={styles.closing}>
          <div className={styles.closingInner}>
            <h2 className={styles.closingTitle}>Find out now, not in February.</h2>
            <p className={styles.closingText}>
              Start with rough numbers. Everything is a lever you can move afterwards, and nothing
              is committed until you say so.
            </p>
            <div className={styles.closingActions}>
              <ButtonLink large variant="primary" href={hrefFor({ name: 'new' })}>
                Start a plan <IconArrow size={18} />
              </ButtonLink>
              <ButtonLink large href={hrefFor({ name: 'about' })}>
                Read the approach
              </ButtonLink>
            </div>
          </div>
        </Reveal>
      </div>
    </>
  );
}
