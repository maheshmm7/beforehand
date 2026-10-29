import type { ReactNode } from 'react';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';
import styles from './landing.module.css';

/** The public side of the site: marketing chrome rather than the app shell. */
export function SiteLayout({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <div className={styles.page}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
    </div>
  );
}
