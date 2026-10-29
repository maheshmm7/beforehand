import { useEffect, useState } from 'react';
import { hrefFor } from '@/lib/router';
import { Button, ButtonLink } from '@/ui/controls';
import { cx } from '@/ui/cx';
import { IconCross, IconMenu } from '@/ui/icons';
import { Logo } from '@/ui/Logo';
import { ThemeToggle } from '@/ui/ThemeToggle';
import styles from './landing.module.css';

const LINKS = [
  { href: '#how', label: 'How it works' },
  { href: '#what', label: 'What you get' },
  { href: '#kinds', label: 'Event types' },
  { href: '#questions', label: 'Questions' },
] as const;

export function SiteHeader(): React.JSX.Element {
  const [stuck, setStuck] = useState(false);
  const [open, setOpen] = useState(false);

  // A hairline appears once the page has moved, so the header separates from
  // the hero without a permanent border.
  useEffect(() => {
    const onScroll = (): void => {
      setStuck(window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <header className={cx(styles.header, stuck && styles.headerStuck)}>
      <div className={styles.wrap}>
        <div className={styles.headerRow}>
          <a className={styles.brand} href={hrefFor({ name: 'home' })}>
            <Logo size={26} />
          </a>

          <nav className={styles.nav} aria-label="Sections of this page">
            {LINKS.map((link) => (
              <a key={link.href} className={styles.navLink} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>

          <div className={styles.headerActions}>
            <ThemeToggle />
            <span className={styles.headerCta}>
              <ButtonLink small variant="primary" href={hrefFor({ name: 'new' })}>
                Start a plan
              </ButtonLink>
            </span>
            <span className={styles.menuButton}>
              <Button
                small
                variant="ghost"
                ariaLabel={open ? 'Close the menu' : 'Open the menu'}
                onClick={() => {
                  setOpen((was) => !was);
                }}
              >
                {open ? <IconCross size={18} /> : <IconMenu size={18} />}
              </Button>
            </span>
          </div>
        </div>

        {open ? (
          <nav className={styles.menuPanel} aria-label="Menu">
            {LINKS.map((link) => (
              <a
                key={link.href}
                className={styles.menuLink}
                href={link.href}
                onClick={() => {
                  setOpen(false);
                }}
              >
                {link.label}
              </a>
            ))}
            <a className={styles.menuLink} href={hrefFor({ name: 'about' })}>
              How it works, in detail
            </a>
            <ButtonLink variant="primary" href={hrefFor({ name: 'new' })}>
              Start a plan
            </ButtonLink>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
