import { Button } from '@/ui/controls';
import { controlStyles } from '@/ui/controlStyles';
import { IconSpark } from '@/ui/icons';
import styles from '../pages.module.css';

/**
 * The one place on this screen the assistant is used. It sets the levers and
 * nothing else, and it says what it could not work out rather than guessing,
 * which is why the notes are part of the panel and not an afterthought.
 */
export function DescribePanel({
  ids,
  value,
  busy,
  notes,
  onChange,
  onRun,
}: {
  /** The page's id prefix, so every control here keeps a stable id. */
  ids: string;
  value: string;
  busy: boolean;
  notes: readonly string[];
  onChange: (next: string) => void;
  onRun: () => void;
}): React.JSX.Element {
  return (
    <section className={styles.describe}>
      <h2 className={styles.describeTitle}>
        <IconSpark size={17} />
        Or just describe it
      </h2>
      <label className={styles.label} htmlFor={`${ids}-description`}>
        In your own words
      </label>
      <textarea
        id={`${ids}-description`}
        className={controlStyles.textarea}
        maxLength={4000}
        placeholder="A Telugu wedding in Hyderabad in March, around 350 guests, three functions, mum wants a hotel"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />
      <div className={styles.describeFoot}>
        <Button disabled={busy} onClick={onRun}>
          {busy ? 'Reading…' : 'Set it up for me'}
        </Button>
        <span className={styles.hint}>
          The assistant only sets the levers; every number is worked out here, by code. Phone
          numbers and links are removed before sending.
        </span>
      </div>
      {notes.length === 0 ? null : (
        <ul className={styles.notes}>
          {notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
