import type { CostCategory, CostLine, Model } from '@shared/engine';
import { money } from '@/lib/format';
import { Chip, type ChipTone } from '@/ui/controls';
import { Money } from '@/ui/Money';
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

export function CostLines({ model }: { model: Model }): React.JSX.Element {
  const groups = ORDER.map((category) => ({
    category,
    lines: model.lines.filter((line) => line.category === category),
  })).filter((group) => group.lines.length > 0);

  return (
    <div>
      {groups.map((group) => (
        <div key={group.category} className={styles.lineGroup}>
          <h3 className={styles.groupName}>{GROUP_NAMES[group.category]}</h3>
          {group.lines.map((line) => (
            <div key={line.ruleId} className={styles.line}>
              <div>
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
        </div>
      ))}

      <div className={styles.total}>
        <span>Total</span>
        <Money className={styles.totalValue} amount={model.totals.all} />
      </div>
    </div>
  );
}
