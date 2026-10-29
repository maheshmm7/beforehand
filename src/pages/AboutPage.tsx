import { hrefFor } from '@/lib/router';
import { ButtonLink } from '@/ui/controls';
import styles from './landing/landing.module.css';

export function AboutPage(): React.JSX.Element {
  return (
    <article className={styles.prosePage}>
      <p className={styles.kicker}>The approach</p>
      <h1>How Beforehand works</h1>

      <p>
        An event is not a checklist. It is a graph of decisions that pull on each other: fifty more
        guests is more food, more seating, more invitations, more water, another shuttle, and a
        venue that may no longer be big enough. Nobody models the pull, so the overrun arrives at
        the end, all at once.
      </p>

      <h2>The model</h2>
      <p>
        Beforehand holds the event as <strong>levers</strong> you can move,{' '}
        <strong>quantities</strong> derived from them, and rules that turn those into money,
        deadlines, tasks and constraints. Change a lever and the whole graph is recomputed, then
        compared with the version you last accepted. The difference is what you are shown.
      </p>

      <h2>Three states for every rupee</h2>
      <p>
        A line starts as an <strong>estimate</strong> from the model. When a vendor gives you a real
        price it becomes a <strong>quote</strong>, and their own wording is kept beside it as
        evidence. Once an advance is paid it becomes <strong>paid</strong>, and the decision behind
        it is no longer free to change. The simulator gets more accurate as the date gets closer,
        which is exactly when accuracy matters.
      </p>

      <h2>Two timelines</h2>
      <p>
        The planning timeline lists <strong>decision deadlines</strong>, not tasks: the last day a
        choice can be made for the plan behind it to still be possible, worked out from how much
        notice each thing needs. The second is the day itself, scheduled backwards from the single
        fixed moment, so the ceremony or the cake stays where it is and everything else gives way.
      </p>

      <h2>Where the AI is, and where it is not</h2>
      <p>
        A language model reads what you paste and proposes ideas. It never does the arithmetic.{' '}
        <strong>Every figure is computed by ordinary code</strong>, which is why each one can show
        its working underneath it, and why the whole application still works with the assistant
        switched off.
      </p>

      <h2>Your data</h2>
      <p>
        Plans are kept in this browser. There is no account, no password and no copy on a server.
        When you ask the assistant to read a quote, only that extract is sent, with phone numbers,
        emails and links removed first.
      </p>

      <p className={styles.disclaimer}>
        Figures are planning estimates, not quotes. Beforehand is not financial advice and does not
        replace a professional planner, caterer or venue manager.
      </p>

      <ButtonLink href={hrefFor({ name: 'new' })} variant="primary">
        Start a plan
      </ButtonLink>
    </article>
  );
}
