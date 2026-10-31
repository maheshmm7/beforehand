import { expect, test, type Page } from '@playwright/test';
import { createPlan } from './helpers';

/**
 * Two faults that no other test can see, both of which shipped: a vertical
 * margin written on an inline box, which does nothing at all, and two
 * different things set so close that they read as one word. The second was
 * reported as "ABHI30 days away · HYDERABADOpen".
 */
async function spacingFaults(page: Page, where: string): Promise<string[]> {
  return page.evaluate((label: string) => {
    const out: string[] = [];
    const name = (el: Element): string =>
      `${el.tagName.toLowerCase()}.${el.getAttribute('class') ?? ''}`.slice(0, 40);
    const text = (el: Element): string => el.textContent.trim().slice(0, 20);

    const visible = (el: Element): boolean => {
      const style = getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    };

    for (const el of Array.from(document.querySelectorAll<HTMLElement>('body *'))) {
      if (!visible(el)) continue;
      const style = getComputedStyle(el);
      // A vertical margin on an inline box is silently dropped. Wherever one
      // was written, a gap was intended and is not there.
      if (style.display !== 'inline') continue;
      if (Number.parseFloat(style.marginTop) > 0 || Number.parseFloat(style.marginBottom) > 0) {
        out.push(`${label}: dead vertical margin on inline ${name(el)}`);
      }
    }

    // The glyphs, not the boxes: a block that fills its column always abuts
    // the next one, and that is not what anybody sees. Glyphs its own element
    // clips away are not seen either, so the ink is bounded by the box that
    // hides it — a line cut short by an ellipsis ends at the ellipsis.
    const ink = (el: Element): DOMRect => {
      const range = document.createRange();
      range.selectNodeContents(el);
      const rect = range.getBoundingClientRect();
      range.detach();
      const clip = getComputedStyle(el).overflowX === 'visible' ? null : el.getBoundingClientRect();
      if (clip === null) return rect;
      const left = Math.max(rect.left, clip.left);
      const right = Math.min(rect.right, clip.right);
      return new DOMRect(left, rect.top, Math.max(right - left, 0), rect.height);
    };

    const leaves = Array.from(document.querySelectorAll<HTMLElement>('body *')).filter((el) => {
      const own = el.textContent.trim();
      if (own === '') return false;
      if (el.children.length > 0 && el.innerText !== own) return false;
      return visible(el);
    });

    for (let i = 0; i < leaves.length; i += 1) {
      for (let j = i + 1; j < leaves.length; j += 1) {
        const a = leaves[i];
        const b = leaves[j];
        if (a === undefined || b === undefined) continue;
        if (a.contains(b) || b.contains(a)) continue;

        const ra = ink(a);
        const rb = ink(b);
        if (ra.width === 0 || rb.width === 0) continue;

        const shared = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
        if (shared < Math.min(ra.height, rb.height) * 0.6) continue;

        const [left, right] = ra.left <= rb.left ? [ra, rb] : [rb, ra];
        const gap = right.left - left.right;
        if (gap > 2 || gap < -1) continue;

        // A run of inline text that shares its styling is one phrase, not two
        // things jammed together.
        const sa = getComputedStyle(a);
        const sb = getComputedStyle(b);
        if (sa.fontSize === sb.fontSize && sa.color === sb.color) continue;

        // Two things on separate sheets are held apart by the gap between
        // the sheets, however close their nearest words happen to fall. Only
        // things on the same sheet can read as one word.
        const sheet = (el: Element): Element | null => {
          let node: Element | null = el;
          while (node !== null && node !== document.body) {
            const s = getComputedStyle(node);
            const painted =
              s.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
              Number.parseFloat(s.borderTopWidth) > 0 ||
              Number.parseFloat(s.borderLeftWidth) > 0;
            if (painted) return node;
            node = node.parentElement;
          }
          return null;
        };
        if (sheet(a) !== sheet(b)) continue;

        out.push(
          `${label}: "${text(a)}" and "${text(b)}" are set ${String(Math.round(gap))}px apart`,
        );
      }
    }
    return out;
  }, where);
}

/**
 * A control sized by min-height alone is fine until its label wraps, and then
 * the two lines sit against the top and bottom edges of it. Reported as the
 * option cells on the budget screen.
 */
async function crampedControls(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>('button, label, a'))
      .filter((el) => {
        const style = getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        if (style.cursor !== 'pointer') return false;
        return el.textContent.trim() !== '';
      })
      .map((el) => {
        const box = el.getBoundingClientRect();
        // The label's own words, not the invisible input filling the cell.
        const inner = el.querySelector('span') ?? el;
        const range = document.createRange();
        range.selectNodeContents(inner);
        const ink = range.getBoundingClientRect();
        range.detach();
        return {
          text: el.textContent.trim().slice(0, 24),
          above: Math.round(ink.top - box.top),
          below: Math.round(box.bottom - ink.bottom),
          wrapped: ink.height > Number.parseFloat(getComputedStyle(el).lineHeight) * 1.4,
        };
      })
      // Only a label that actually wrapped can be crowded by the box around
      // it; a single line inside a 44 pixel control never is.
      .filter((c) => c.wrapped && (c.above < 4 || c.below < 4))
      .map(
        (c) => `"${c.text}" has ${String(Math.min(c.above, c.below))}px above or below its label`,
      ),
  );
}

test('no control is tighter than its own label', async ({ page }) => {
  const found: string[] = [];

  await createPlan(page, 'Priya and Arjun');
  const base = page.url().replace(/\/[a-z]+$/, '');
  for (const view of ['budget', 'vendors']) {
    await page.goto(`${base}/${view}`);
    await page.waitForTimeout(300);
    found.push(...(await crampedControls(page)));
  }
  for (const path of ['/#/', '/#/new']) {
    await page.goto(path);
    await page.waitForTimeout(400);
    found.push(...(await crampedControls(page)));
  }

  expect([...new Set(found)]).toEqual([]);
});

test('nothing is set so close it reads as one word', async ({ page }) => {
  const found: string[] = [];

  await createPlan(page, 'Priya and Arjun');
  const base = page.url().replace(/\/[a-z]+$/, '');
  for (const view of ['budget', 'timeline', 'vendors', 'ideas']) {
    await page.goto(`${base}/${view}`);
    await page.waitForTimeout(300);
    found.push(...(await spacingFaults(page, view)));
  }

  // And again with a change pending, so the dock is full.
  await page.goto(`${base}/budget`);
  const guests = page.getByRole('slider').first();
  await guests.focus();
  for (let press = 0; press < 5; press += 1) await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(300);
  found.push(...(await spacingFaults(page, 'budget with a pending change')));

  for (const path of ['/#/', '/#/new', '/#/about', '/#/privacy']) {
    await page.goto(path);
    await page.waitForTimeout(400);
    found.push(...(await spacingFaults(page, path)));
  }

  expect([...new Set(found)]).toEqual([]);
});
