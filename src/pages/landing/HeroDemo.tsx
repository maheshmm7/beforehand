import { useId, useMemo, useState } from 'react';
import { blastRadius, buildModel } from '@shared/engine';
import { defaultValues, weddingPack } from '@shared/packs';
import { money, plural, signedMoney } from '@/lib/format';
import { Money } from '@/ui/Money';
import { Field } from '@/ui/controls';
import { controlStyles } from '@/ui/controlStyles';
import { fillStyle } from '@/ui/fillStyle';
import { cx } from '@/ui/cx';
import { IconArrow, IconCalendar, IconSpark, IconShield } from '@/ui/icons';
import styles from './landing.module.css';

const BASELINE_GUESTS = 350;
const SHOWN_LINES = ['catering', 'seating', 'invitations', 'transport'] as const;

const shared = {
  eventDateIso: '2027-03-02',
  anchorTime: '09:30',
  commitments: [],
};

/**
 * The landing page runs the real engine, not a mock-up of it. Whatever this
 * shows is what the product does, because it is the product.
 */
export function HeroDemo(): React.JSX.Element {
  const id = useId();
  const [guests, setGuests] = useState(BASELINE_GUESTS);

  const { current, radius } = useMemo(() => {
    const base = { ...defaultValues(weddingPack), venueClass: 'hotel' };
    const before = buildModel(weddingPack, {
      ...shared,
      values: { ...base, guests: BASELINE_GUESTS },
    });
    const after = buildModel(weddingPack, { ...shared, values: { ...base, guests } });
    return { current: after, radius: blastRadius(before, after) };
  }, [guests]);

  const lines = SHOWN_LINES.map((ruleId) =>
    current.lines.find((line) => line.ruleId === ruleId),
  ).filter((line) => line !== undefined);
  const movedIds = new Set(radius.changedLines.map((line) => line.ruleId));
  const fill = (guests - 200) / (520 - 200);

  return (
    <div className={styles.demo}>
      <div className={styles.demoBar}>
        <span className={styles.demoDot} />
        <span className={styles.demoDot} />
        <span className={styles.demoDot} />
        <span className={styles.demoTitle}>Try it · a 350-guest wedding</span>
      </div>

      <div className={styles.demoBody}>
        <Field
          htmlFor={`${id}-guests`}
          label="Guests"
          value={`${String(guests)} guests`}
          help="Drag it. Everything below is recomputed, not looked up."
        >
          <input
            id={`${id}-guests`}
            className={controlStyles.range}
            style={fillStyle(fill)}
            type="range"
            min={200}
            max={520}
            step={10}
            value={guests}
            onChange={(event) => {
              setGuests(Number(event.target.value));
            }}
          />
        </Field>

        <div className={styles.demoTotalRow}>
          <span className={styles.demoTotalLabel}>
            Total
            <Money className={styles.demoTotal} amount={current.totals.all} shape="full" />
          </span>
          <span
            className={cx(
              styles.demoDelta,
              radius.totalDelta < 0 && styles.demoDeltaDown,
              radius.totalDelta === 0 && styles.demoDeltaFlat,
            )}
          >
            {radius.totalDelta === 0 ? 'at the baseline' : signedMoney(radius.totalDelta)}
          </span>
        </div>

        <div className={styles.demoLines}>
          {lines.map((line) => (
            <div
              key={line.ruleId}
              className={cx(styles.demoLine, movedIds.has(line.ruleId) && styles.demoLineMoved)}
            >
              <span className={styles.demoLineName}>{line.label}</span>
              <span className={styles.demoLineValue}>{money(line.amount)}</span>
            </div>
          ))}
        </div>

        <div className={styles.demoConsequences}>
          <p className={styles.demoConsequence}>
            <span className={styles.demoConsequenceIcon}>
              <IconArrow size={16} />
            </span>
            {radius.changedLines.length === 0
              ? 'Nothing has moved yet'
              : `${plural(radius.changedLines.length, 'cost line')} moved`}
          </p>
          <p className={styles.demoConsequence}>
            <span className={styles.demoConsequenceIcon}>
              <IconCalendar size={16} />
            </span>
            {radius.movedDeadlines.length === 0
              ? 'No deadline has shifted'
              : `${plural(radius.movedDeadlines.length, 'deadline')} shifted earlier`}
          </p>
          <p className={styles.demoConsequence}>
            <span className={styles.demoConsequenceIcon}>
              <IconSpark size={16} />
            </span>
            {radius.newTasks.length === 0
              ? 'No new task'
              : (radius.newTasks[0]?.label ?? 'A new task appeared')}
          </p>
          {current.violations.length === 0 ? null : (
            <p className={cx(styles.demoConsequence, styles.demoBreach)}>
              <span className={styles.demoConsequenceIcon}>
                <IconShield size={16} />
              </span>
              {current.violations[0]?.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
