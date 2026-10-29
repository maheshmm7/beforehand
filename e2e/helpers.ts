import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

/** WCAG 2.2 AA, with no exclusions. A violation fails the test. */
export async function expectNoAxeViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();

  expect(
    results.violations.flatMap((violation) =>
      violation.nodes.map((node) => `${violation.id} at ${node.target.join(' ')}`),
    ),
    'accessibility violations',
  ).toEqual([]);
}

/** Creates a plan through the interface, the way a person would. */
export async function createPlan(page: Page, name = 'Priya and Arjun'): Promise<void> {
  await page.goto('/#/new');
  await page.getByRole('textbox', { name: 'Name it' }).fill(name);
  await page.getByRole('textbox', { name: 'Where' }).fill('Hyderabad');
  await page.getByRole('button', { name: 'Create the plan' }).click();
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
}

export async function setDarkMode(page: Page): Promise<void> {
  await page.emulateMedia({ colorScheme: 'dark' });
}

/** No part of the page may be reachable only by scrolling sideways. */
export async function expectNoSidewaysScroll(page: Page): Promise<void> {
  const report = await page.evaluate(() => {
    const viewport = document.documentElement.clientWidth;
    const offenders = Array.from(document.querySelectorAll<HTMLElement>('*'))
      .map((element) => ({ element, box: element.getBoundingClientRect() }))
      .filter((entry) => entry.box.right > viewport + 1)
      .sort((a, b) => b.box.right - a.box.right)
      .slice(0, 5)
      .map(
        (entry) =>
          `${entry.element.tagName}.${entry.element.className.slice(0, 30)} right=${String(Math.round(entry.box.right))}`,
      );
    return { overflow: document.documentElement.scrollWidth - viewport, offenders };
  });

  expect(
    report.overflow,
    `horizontal overflow, widest: ${report.offenders.join(' | ')}`,
  ).toBeLessThanOrEqual(1);
}

/**
 * The bottom tab row is sticky, so it floats over the end of the page. Nothing
 * a person can operate may end up underneath it, at any scroll position.
 */
export async function expectNothingUnderTheBottomBar(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });

  const covered = await page.evaluate(() => {
    const bar = document.querySelector('nav[aria-label="Sections"]');
    if (bar === null) return [];
    const over = bar.getBoundingClientRect();

    return Array.from(
      document.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea'),
    )
      .filter((element) => element.closest('nav[aria-label="Sections"]') === null)
      .map((element) => ({ element, box: element.getBoundingClientRect() }))
      .filter(
        (entry) =>
          entry.box.width > 0 && entry.box.bottom > over.top && entry.box.top < over.bottom,
      )
      .map((entry) => `${entry.element.tagName}#${entry.element.id}`);
  });

  expect(covered, 'controls hidden behind the bottom bar').toEqual([]);
}
