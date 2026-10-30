import type { ReactNode } from 'react';
import { cx } from './cx';
import styles from './controls.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  children,
  onClick,
  variant = 'secondary',
  small = false,
  large = false,
  disabled = false,
  type = 'button',
  title,
  ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  small?: boolean;
  large?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
  title?: string;
  ariaLabel?: string;
}): React.JSX.Element {
  return (
    <button
      type={type === 'submit' ? 'submit' : 'button'}
      className={cx(
        styles.button,
        variant === 'primary' && styles.primary,
        variant === 'ghost' && styles.ghost,
        variant === 'danger' && styles.danger,
        small && styles.small,
        large && styles.large,
      )}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  children,
  href,
  variant = 'secondary',
  small = false,
  large = false,
  className,
}: {
  children: ReactNode;
  href: string;
  variant?: ButtonVariant;
  small?: boolean;
  large?: boolean;
  className?: string;
}): React.JSX.Element {
  return (
    <a
      href={href}
      className={cx(
        styles.button,
        variant === 'primary' && styles.primary,
        variant === 'ghost' && styles.ghost,
        variant === 'danger' && styles.danger,
        small && styles.small,
        large && styles.large,
        className,
      )}
    >
      {children}
    </a>
  );
}

/** Which of the three kinds of thing a tinted mark belongs to. */
export type Tone = 'accent' | 'money' | 'time' | 'work' | 'quiet';

const TONES: Readonly<Record<Tone, string | undefined>> = {
  accent: undefined,
  money: styles.toneMoney,
  time: styles.toneTime,
  work: styles.toneWork,
  quiet: styles.toneQuiet,
};

/** A tinted square carrying an icon, beside a title or a figure. */
export function ChipIcon({
  tone = 'accent',
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}): React.JSX.Element {
  return (
    <span className={cx(styles.chipIcon, TONES[tone])} aria-hidden="true">
      {children}
    </span>
  );
}

export function Card({
  title,
  icon,
  tone,
  children,
  actions,
  className,
}: {
  title?: string;
  /** Shown in a tinted square before the title. */
  icon?: ReactNode;
  tone?: Tone;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <section className={cx(styles.card, className)}>
      {title === undefined ? null : (
        <header className={styles.cardTitle}>
          {icon === undefined ? null : <ChipIcon tone={tone}>{icon}</ChipIcon>}
          <span className={styles.cardTitleText}>{title}</span>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}

export type ChipTone = 'estimated' | 'quoted' | 'paid' | 'warning' | 'error';

export function Chip({
  tone,
  children,
}: {
  tone: ChipTone;
  children: ReactNode;
}): React.JSX.Element {
  return <span className={cx(styles.chip, styles[tone])}>{children}</span>;
}

export function Stat({
  label,
  value,
  note,
  icon,
  tone,
  live = false,
}: {
  label: string;
  value: string;
  note?: string;
  icon?: ReactNode;
  tone?: Tone;
  /** Marks a figure that changes as the plan changes, so it gets emphasis. */
  live?: boolean;
}): React.JSX.Element {
  return (
    <div className={cx(styles.stat, live && styles.statLive)}>
      <span className={styles.statHead}>
        {icon === undefined ? null : <ChipIcon tone={tone}>{icon}</ChipIcon>}
        <span className={styles.statLabel}>{label}</span>
      </span>
      <span className={styles.statValue}>{value}</span>
      {note === undefined ? null : <span className={styles.statNote}>{note}</span>}
    </div>
  );
}

export function Field({
  label,
  value,
  help,
  htmlFor,
  children,
}: {
  label: string;
  value?: string;
  help?: string;
  htmlFor: string;
  children: ReactNode;
}): React.JSX.Element {
  return (
    <div className={styles.field}>
      <div className={styles.fieldLabel}>
        <label htmlFor={htmlFor}>{label}</label>
        {value === undefined ? null : (
          <span className={styles.fieldValue} aria-hidden="true">
            {value}
          </span>
        )}
      </div>
      {children}
      {help === undefined ? null : <span className={styles.fieldHelp}>{help}</span>}
    </div>
  );
}

export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}): React.JSX.Element {
  return (
    <div className={styles.empty}>
      <p className={styles.emptyTitle}>{title}</p>
      {children}
    </div>
  );
}
