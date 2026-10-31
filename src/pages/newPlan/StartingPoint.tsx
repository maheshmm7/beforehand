import type { Model } from '@shared/engine';
import { moneyShort, plural } from '@/lib/format';
import styles from '../pages.module.css';

/**
 * What this shape of event costs as it stands, before anything is committed
 * to. It is the point of the product, so it is on the screen that creates a
 * plan rather than behind it.
 */
export function StartingPoint({ model }: { model: Model }): React.JSX.Element {
  return (
    <div className={styles.preview}>
      <span className={styles.previewLabel}>Starting point</span>
      <span className={styles.previewFigure}>{moneyShort(model.totals.all)}</span>
      <span className={styles.previewNote}>
        {plural(model.lines.length, 'line')} · {plural(model.deadlines.length, 'decision')} ·{' '}
        {plural(model.tasks.length, 'task')}
      </span>
    </div>
  );
}
