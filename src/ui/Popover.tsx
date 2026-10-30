import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { cx } from './cx';
import styles from './pickers.module.css';

/**
 * A panel anchored under its own trigger. Not a modal: the page behind stays
 * usable, so there is no focus trap and no scroll lock. Escape closes it and
 * hands focus back, and a press anywhere else closes it too.
 */
export function Popover({
  id,
  open,
  onOpenChange,
  title,
  trigger,
  invalid = false,
  children,
}: {
  id: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Names the panel for assistive technology. */
  title: string;
  /** What the closed field shows. */
  trigger: ReactNode;
  invalid?: boolean;
  children: ReactNode;
}): React.JSX.Element {
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  /**
   * A field at the foot or the edge of the window would otherwise open a panel
   * that runs off it. Measured as the panel is attached, before it is painted,
   * so it never appears in the wrong place first.
   */
  const place = useCallback((node: HTMLDivElement | null): void => {
    const anchor = button.current?.getBoundingClientRect();
    if (node === null || anchor === undefined) return;
    const box = node.getBoundingClientRect();
    const gap = 12;

    const above = anchor.bottom + box.height + gap > window.innerHeight && anchor.top > box.height;
    node.dataset.place = above ? 'above' : 'below';

    const fitsLeading = anchor.left + box.width + gap <= window.innerWidth;
    const fitsTrailing = anchor.right - box.width >= gap;
    node.dataset.align = !fitsLeading && fitsTrailing ? 'end' : 'start';
    // Wider than the window itself: sit against its edge rather than past it.
    node.style.left = fitsLeading || fitsTrailing ? '' : `${String(gap - anchor.left)}px`;
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event: Event): void => {
      if (!(event.target instanceof Node)) return;
      if (wrap.current?.contains(event.target) === true) return;
      onOpenChange(false);
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      onOpenChange(false);
      button.current?.focus();
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onOpenChange]);

  return (
    <div className={styles.anchor} ref={wrap}>
      <button
        type="button"
        id={id}
        ref={button}
        className={cx(styles.trigger, open && styles.triggerOpen, invalid && styles.triggerInvalid)}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          onOpenChange(!open);
        }}
      >
        {trigger}
      </button>

      {open ? (
        <div className={styles.panel} ref={place} role="dialog" aria-label={title}>
          {children}
        </div>
      ) : null}
    </div>
  );
}
