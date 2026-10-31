import { hrefFor } from '@/lib/router';
import { ButtonLink } from '@/ui/controls';
import { IconArrow } from '@/ui/icons';
import { Reveal } from './Reveal';
import styles from './landing.module.css';

export function Closing(): React.JSX.Element {
  return (
    <div className={styles.wrap}>
      <Reveal className={styles.closing}>
        <div className={styles.closingInner}>
          <h2 className={styles.closingTitle}>Find out now, not in February.</h2>
          <p className={styles.closingText}>
            Start with rough numbers. Everything is a lever you can move afterwards, and nothing is
            committed until you say so.
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
  );
}
