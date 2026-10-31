import type { CostCategory, Model } from '@shared/engine';
import { money, moneyShort } from '@/lib/format';
import styles from './budget.module.css';

const GROUP_NAMES: Readonly<Record<CostCategory, string>> = {
  venue: 'Venue',
  food: 'Food',
  people: 'People',
  things: 'Things to hire',
  travel: 'Travel',
  paperwork: 'Paperwork',
  income: 'Coming in',
};

/**
 * The order is fixed, so a category keeps its colour whatever the plan is
 * doing: the fourth hue never slides onto a different kind of spending
 * because a slice fell to zero. The hues are stepped so that no two
 * neighbours in this order are hard to tell apart, including for the three
 * common kinds of colour blindness.
 */
const ORDER: readonly CostCategory[] = ['venue', 'food', 'people', 'things', 'travel', 'paperwork'];

const RADIUS = 54;
const THICKNESS = 20;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
/** A sliver of paper between neighbours, so two slices never bleed together. */
const GAP = 2;

interface Slice {
  readonly category: CostCategory;
  readonly amount: number;
  readonly share: number;
  readonly offset: number;
}

function slicesOf(model: Model): { slices: Slice[]; spend: number } {
  const totals = ORDER.map((category) => ({
    category,
    amount: model.lines
      .filter((line) => line.category === category)
      .reduce((sum, line) => sum + line.amount, 0),
  })).filter((group) => group.amount > 0);

  const spend = totals.reduce((sum, group) => sum + group.amount, 0);
  let run = 0;
  const slices = totals.map((group) => {
    const share = spend === 0 ? 0 : group.amount / spend;
    const slice = { ...group, share, offset: run };
    run += share;
    return slice;
  });

  return { slices, spend };
}

function percent(share: number): string {
  const whole = Math.round(share * 100);
  return `${String(whole === 0 && share > 0 ? 1 : whole)}%`;
}

/**
 * Where the money goes, as one ring and a list of what is in it.
 *
 * It is deliberately not foldable. Every category is on the screen at once,
 * at a fixed height: the sheet that opened and shut a category at a time
 * moved everything under it each time somebody looked, which is a strange
 * thing for a page to do while you are reading it. The ring carries the
 * shape, the list carries the figures, and the lines behind each figure are
 * on the vendor screen, which is the list of them.
 */
export function MoneySplit({ model }: { model: Model }): React.JSX.Element {
  const { slices, spend } = slicesOf(model);
  const income = model.lines
    .filter((line) => line.category === 'income')
    .reduce((sum, line) => sum + line.amount, 0);

  return (
    <div className={styles.split}>
      <div className={styles.ring}>
        <svg viewBox="0 0 140 140" className={styles.donut} aria-hidden="true">
          <circle className={styles.track} cx="70" cy="70" r={RADIUS} strokeWidth={THICKNESS} />
          {slices.map((slice) => {
            const length = Math.max(slice.share * CIRCUMFERENCE - GAP, 0.5);
            return (
              <circle
                key={slice.category}
                className={styles.slice}
                data-category={slice.category}
                cx="70"
                cy="70"
                r={RADIUS}
                strokeWidth={THICKNESS}
                strokeDasharray={`${String(length)} ${String(CIRCUMFERENCE - length)}`}
                strokeDashoffset={String(-slice.offset * CIRCUMFERENCE)}
              >
                <title>
                  {GROUP_NAMES[slice.category]} · {money(slice.amount)} · {percent(slice.share)}
                </title>
              </circle>
            );
          })}
        </svg>
        {/* The hole in a ring is where its total goes. The short form, so
            it sits inside the hole at every width rather than over it. */}
        <p className={styles.ringMiddle}>
          <span className={styles.ringCaption}>Spending</span>
          <span className={styles.ringTotal}>{moneyShort(spend)}</span>
        </p>
      </div>

      <dl className={styles.legend}>
        {slices.map((slice) => (
          <div key={slice.category} className={styles.legendRow} data-category={slice.category}>
            <dt className={styles.legendName}>{GROUP_NAMES[slice.category]}</dt>
            <dd className={styles.legendShare}>{percent(slice.share)}</dd>
            <dd className={styles.legendAmount}>{money(slice.amount)}</dd>
          </div>
        ))}
        {income === 0 ? null : (
          <div className={styles.legendRow} data-category="income">
            <dt className={styles.legendName}>{GROUP_NAMES.income}</dt>
            <dd className={styles.legendShare} />
            <dd className={styles.legendAmount}>{money(income)}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
