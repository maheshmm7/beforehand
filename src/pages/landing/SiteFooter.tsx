import { hrefFor } from '@/lib/router';
import { Logo } from '@/ui/Logo';
import styles from './landing.module.css';

const COLUMNS = [
  {
    heading: 'The product',
    links: [
      { href: '#how', label: 'How it works' },
      { href: '#what', label: 'What you get' },
      { href: '#kinds', label: 'Event types' },
      { href: '#questions', label: 'Questions' },
    ],
  },
  {
    heading: 'Start',
    links: [
      { href: hrefFor({ name: 'new' }), label: 'Plan a wedding' },
      { href: hrefFor({ name: 'new' }), label: 'Plan a birthday' },
      { href: hrefFor({ name: 'new' }), label: 'Plan a community event' },
    ],
  },
  {
    heading: 'About',
    links: [
      { href: hrefFor({ name: 'about' }), label: 'The approach' },
      { href: hrefFor({ name: 'privacy' }), label: 'Privacy' },
    ],
  },
] as const;

export function SiteFooter(): React.JSX.Element {
  return (
    <footer className={styles.footer}>
      <div className={styles.wrap}>
        <div className={styles.footerGrid}>
          <div className={styles.footerAbout}>
            <Logo size={26} />
            <p className={styles.footerText}>
              A planning assistant that tells you what a decision costs before you make it, for
              weddings, birthdays and community events.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.heading}>
              <h2 className={styles.footerHeading}>{column.heading}</h2>
              <ul className={styles.footerList}>
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a className={styles.footerLink} href={link.href}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className={styles.disclaimer}>
          Figures here are planning estimates, not quotes, until you replace them with a real price
          from a real vendor. Beforehand is not financial advice and does not replace a professional
          planner, caterer or venue manager.
        </p>

        <div className={styles.footerBottom}>
          <span>© {new Date().getFullYear()} Beforehand</span>
          <span>No account. No tracking. Your plans stay in this browser.</span>
        </div>
      </div>
    </footer>
  );
}
