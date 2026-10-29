import { expect, test } from '@playwright/test';
import {
  createPlan,
  expectNoAxeViolations,
  expectNoSidewaysScroll,
  expectNothingUnderTheBottomBar,
  setDarkMode,
} from './helpers';

const STATIC_PAGES = ['/#/', '/#/new', '/#/about', '/#/privacy'] as const;

for (const path of STATIC_PAGES) {
  test(`${path} has no accessibility violations in light mode`, async ({ page }) => {
    await page.goto(path);
    await expectNoAxeViolations(page);
  });

  test(`${path} has no accessibility violations in dark mode`, async ({ page }) => {
    await setDarkMode(page);
    await page.goto(path);
    await expectNoAxeViolations(page);
  });
}

for (const view of ['Budget', 'Timeline', 'Vendors', 'Ideas'] as const) {
  test(`the ${view} view has no accessibility violations`, async ({ page }) => {
    await createPlan(page);
    await page.getByRole('link', { name: view }).first().click();
    await expectNoAxeViolations(page);
  });
}

test('a plan screen is accessible in dark mode too', async ({ page }) => {
  await setDarkMode(page);
  await createPlan(page);
  await expectNoAxeViolations(page);
});

test('the whole journey can be done with the keyboard alone', async ({ page }) => {
  await page.goto('/#/');

  // The first stop is the skip link, then the page's own controls.
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();

  await page.getByRole('link', { name: 'Start a plan' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Start a plan');

  await page.getByRole('textbox', { name: 'Name it' }).focus();
  await page.keyboard.type('Keyboard only');
  await page.getByRole('button', { name: 'Create the plan' }).focus();
  await page.keyboard.press('Enter');

  await expect(page.getByRole('heading', { level: 1, name: 'Keyboard only' })).toBeVisible();

  const guests = page.getByRole('slider', { name: /Guests/ }).first();
  await guests.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('status')).toContainText('+');
});

test('nothing is lost at 320 pixels with the largest text', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  // 200% text, the WCAG reflow condition.
  await page.addStyleTag({ content: 'html { font-size: 32px; }' });

  await createPlan(page);
  await expectNoSidewaysScroll(page);

  for (const view of ['timeline', 'vendors', 'ideas'] as const) {
    await page.goto(page.url().replace(/\/[a-z]+$/, `/${view}`));
    await page.addStyleTag({ content: 'html { font-size: 32px; }' });
    await expectNoSidewaysScroll(page);
  }
});

test('nothing a person can operate hides under the bottom bar', async ({ page }) => {
  await createPlan(page);

  for (const view of ['Budget', 'Timeline', 'Vendors', 'Ideas'] as const) {
    await page.getByRole('link', { name: view }).first().click();
    await expectNothingUnderTheBottomBar(page);
  }
});

test('every page keeps its heading order', async ({ page }) => {
  for (const path of STATIC_PAGES) {
    await page.goto(path);
    const levels = await page
      .locator('h1, h2, h3')
      .evaluateAll((nodes) => nodes.map((node) => Number(node.tagName.slice(1))));

    expect(levels[0], `${path} starts at h1`).toBe(1);
    for (let index = 1; index < levels.length; index += 1) {
      const previous = levels[index - 1] ?? 1;
      const current = levels[index] ?? 1;
      expect(current - previous, `${path} does not skip a heading level`).toBeLessThanOrEqual(1);
    }
  }
});
