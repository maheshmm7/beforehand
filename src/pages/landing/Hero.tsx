import { hrefFor } from '@/lib/router';
import { ButtonLink } from '@/ui/controls';
import { cx } from '@/ui/cx';
import { IconArrow, IconCheck, IconRipple } from '@/ui/icons';
import { HeroDemo } from './HeroDemo';
import styles from './landing.module.css';

/** The claim, and beside it a working simulator running the real engine. */
export function Hero(): React.JSX.Element {
  return (
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
            Every other planner is a recorder: you decide, it stores. This one is a simulator. Move
            one lever and it shows you every cost, deadline and task that moves with it — while you
            can still change your mind.
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
  );
}
