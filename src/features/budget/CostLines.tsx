import { useState } from 'react';
import type { CostCategory, CostLine, Model } from '@shared/engine';
import { money } from '@/lib/format';
import { Chip, type ChipTone } from '@/ui/controls';
import { Money } from '@/ui/Money';
import { IconChevron } from '@/ui/icons';
import styles from './budget.module.css';

const GROUP_NAMES: Readonly<Record<CostCategory, string>> = {
  venue: 'Venue',
  food: 'Food',
  people: 'People',
  things: 'Things to hire',
  travel: 'Getting there and staying',
  paperwork: 'Paperwork',
  income: 'Money coming in',
};

const ORDER: readonly CostCategory[] = [
  'venue',
  'food',
  'people',
  'things',
  'travel',
  'paperwork',
  'income',
];

const TONE: Readonly<Record<CostLine['state'], ChipTone>> = {
  estimated: 'estimated',
  quoted: 'quoted',
  paid: 'paid',
};

interface Group {
  readonly category: CostCategory;
  readonly lines: readonly CostLine[];
  readonly total: number;
}

function groupsOf(model: Model): Group[] {
  return ORDER.map((category) => {
    const lines = model.lines.filter((line) => line.category === category);
    return { category, lines, total: lines.reduce((sum, line) => sum + line.amount, 0) };
  }).filter((group) => group.lines.length > 0);
}

/** Where the money actually is. That group opens itself; the rest wait to be
 *  asked, so the screen starts at the length of a summary. */
function biggest(groups: readonly Group[]): CostCategory | undefined {
  return groups.reduce<Group | undefined>(
    (best, group) =>
      best === undefined || Math.abs(group.total) > Math.abs(best.total) ? group : best,
    undefined,
  )?.category;
}

/**
 * Each category folds away with its total still showing, so the breakdown can
 * be read at the level somebody wants: seven headline numbers, or every line
 * and the arithmetic behind it. What is open is held here rather than left to
 * the browser, so moving a lever cannot slam a group shut mid-read.
 */
export function CostLines({ model }: { model: Model }): React.JSX.Element {
  const groups = groupsOf(model);
  const [open, setOpen] = useState<ReadonlySet<CostCategory>>(() => {
    const first = biggest(groups);
    return new Set(first === undefined ? [] : [first]);
  });

  function toggle(category: CostCategory, next: boolean): void {
    setOpen((current) => {
      const copy = new Set(current);
      if (next) copy.add(category);
      else copy.delete(category);
      return copy;
    });
  }

  return (
    <div>
      <div className={styles.groups}>
        {groups.map((group) => (
          <details
            key={group.category}
            className={styles.lineGroup}
            open={open.has(group.category)}
            onToggle={(event) => {
              toggle(group.category, event.currentTarget.open);
            }}
          >
            <summary className={styles.groupHead}>
              <span className={styles.groupChevron}>
                <IconChevron size={15} />
              </span>
              <span className={styles.groupName}>{GROUP_NAMES[group.category]}</span>
              <span className={styles.groupCount}>{group.lines.length}</span>
              <span className={styles.groupTotal}>{money(group.total)}</span>
            </summary>

            {group.lines.map((line) => (
              <div key={line.ruleId} className={styles.line}>
                <div className={styles.lineMain}>
                  <span className={styles.lineName}>
                    {line.label}
                    <Chip tone={TONE[line.state]}>{line.state}</Chip>
                  </span>
                  <span className={styles.lineBasis}>{line.basis}</span>
                  {line.quote === undefined ? null : (
                    <span className={styles.lineQuote}>
                      {line.vendor}: “{line.quote}”
                    </span>
                  )}
                </div>
                <div className={styles.lineAmount}>
                  {money(line.amount)}
                  {line.state !== 'estimated' && line.amount !== line.estimate ? (
                    <span className={styles.lineWas}>we estimated {money(line.estimate)}</span>
                  ) : null}
                </div>
              </div>
            ))}
          </details>
        ))}
      </div>

      <div className={styles.total}>
        <span>Total</span>
        <Money className={styles.totalValue} amount={model.totals.all} />
      </div>
    </div>
  );
}
