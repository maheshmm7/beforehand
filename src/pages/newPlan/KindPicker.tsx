import type { EventKind } from '@shared/plan';
import { packList } from '@shared/packs';
import styles from '../pages.module.css';

/**
 * What kind of event this is, as a row of cards rather than a drop-down:
 * the blurb under each one is half of how somebody chooses.
 */
export function KindPicker({
  ids,
  kind,
  onChange,
}: {
  /** The page's id prefix, so every control here keeps a stable id. */
  ids: string;
  kind: EventKind;
  onChange: (next: EventKind) => void;
}): React.JSX.Element {
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>What are you planning?</legend>
      <div className={styles.kindRow}>
        {packList.map((pack) => (
          <label key={pack.kind} className={styles.kind} htmlFor={`${ids}-${pack.kind}`}>
            <input
              id={`${ids}-${pack.kind}`}
              type="radio"
              name={`${ids}-kind`}
              value={pack.kind}
              checked={kind === pack.kind}
              onChange={() => {
                onChange(pack.kind);
              }}
            />
            <span className={styles.kindMark} aria-hidden="true" />
            <span className={styles.kindName}>{pack.label}</span>
            <span className={styles.kindBlurb}>{pack.blurb}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
