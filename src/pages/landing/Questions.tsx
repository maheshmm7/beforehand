import { cx } from '@/ui/cx';
import { IconChevron } from '@/ui/icons';
import { Reveal } from './Reveal';
import { QUESTIONS } from './content';
import styles from './landing.module.css';

export function Questions(): React.JSX.Element {
  return (
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
  );
}
