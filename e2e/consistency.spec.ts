import { expect, test } from '@playwright/test';
import { createPlan } from './helpers';

/**
 * The faults this file guards against all shipped once: a panel that moved the
 * control you were dragging, four button sizes for the same job, and pages
 * that ran to eleven screens. None of them were visible to axe or to a unit
 * test, so they are measured here.
 */

test('moving a lever never moves the lever', async ({ page }) => {
  await createPlan(page);

  const guests = page.getByRole('slider', { name: 'Guests', exact: true });
  const before = await guests.boundingBox();
  expect(before).not.toBeNull();

  for (const press of ['ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowLeft', 'ArrowLeft']) {
    await guests.focus();
    await page.keyboard.press(press);
    await page.waitForTimeout(120);

    const now = await guests.boundingBox();
    expect(now).not.toBeNull();
    expect(
      Math.abs((now?.y ?? 0) - (before?.y ?? 0)),
      'the slider shifted while being used',
    ).toBeLessThanOrEqual(2);
  }
});

test('the consequence panel keeps a steady height as a lever moves', async ({ page }) => {
  await createPlan(page);

  const panel = page.getByRole('status');
  const guests = page.getByRole('slider', { name: 'Guests', exact: true });
  const keep = page.getByRole('button', { name: 'Keep this change' });
  const resting = Math.round((await panel.boundingBox())?.height ?? 0);

  // Wait until it is actually showing something before sampling, or the first
  // sample is still the resting height.
  await guests.focus();
  await page.keyboard.press('ArrowRight');
  await expect(keep).toBeEnabled();

  const active: number[] = [];
  for (let step = 0; step < 6; step += 1) {
    await guests.focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(140);
    active.push(Math.round((await panel.boundingBox())?.height ?? 0));
  }

  // Once it is showing consequences it must not resize again, however many
  // there are: that is what made the panel feel unstable.
  const spread = Math.max(...active) - Math.min(...active);
  expect(spread, `panel heights were ${active.join(', ')}`).toBeLessThanOrEqual(8);

  // Where there are two columns the space is reserved, so going from resting
  // to showing something barely moves. On a narrow screen the panel sits below
  // the levers and simply fills in, which moves nothing the hand is using.
  if ((page.viewportSize()?.width ?? 0) >= 1000) {
    const firstStep = Math.abs((active[0] ?? 0) - resting);
    expect(firstStep, `resting ${String(resting)} then ${String(active[0])}`).toBeLessThanOrEqual(
      120,
    );
  }
});

test('buttons come from one scale', async ({ page }) => {
  const seen = new Set<number>();

  for (const path of ['/#/', '/#/new', '/#/about']) {
    await page.goto(path);
    for (const height of await page.evaluate(() =>
      Array.from(document.querySelectorAll('button, a[class*=button]'))
        .map((element) => element.getBoundingClientRect().height)
        .filter((value) => value > 0)
        .map((value) => Math.round(value)),
    )) {
      seen.add(height);
    }
  }

  // 36 for an action inside a row, 44 for the default, 52 for a page's call.
  expect([...seen].sort((a, b) => a - b)).toEqual(
    expect.arrayContaining([...seen].filter((height) => [36, 44, 52].includes(height))),
  );
  expect(
    [...seen].filter((height) => ![36, 44, 52].includes(height)),
    'button heights outside the scale',
  ).toEqual([]);
});

test('no page runs away in length', async ({ page }) => {
  await createPlan(page);
  const planUrl = page.url();

  // A narrow screen stacks what a wide one puts side by side, so the same page
  // is honestly longer there. These are ceilings against runaway growth, not
  // targets.
  const narrow = (page.viewportSize()?.width ?? 1280) < 900;
  const budgets: { path: string; screens: number }[] = [
    { path: '/#/', screens: narrow ? 8 : 5.5 },
    { path: '/#/new', screens: narrow ? 4 : 3 },
    { path: planUrl, screens: narrow ? 7 : 6 },
  ];

  for (const budget of budgets) {
    await page.goto(budget.path);
    await page.waitForTimeout(400);

    const screens = await page.evaluate(() => {
      const region = document.getElementById('main');
      const height =
        region !== null && region.scrollHeight > region.clientHeight
          ? region.scrollHeight
          : document.documentElement.scrollHeight;
      return height / window.innerHeight;
    });

    expect(Number(screens.toFixed(1)), `${budget.path} is too long`).toBeLessThanOrEqual(
      budget.screens,
    );
  }
});

test('the footer lines up with the page it sits under', async ({ page }) => {
  await page.goto('/#/');

  const report = await page.evaluate(() => {
    const footer = document.querySelector('footer');
    const grid = footer?.querySelector('[class*=footerGrid]');
    const disclaimer = footer?.querySelector('[class*=disclaimer]');
    if (grid == null || disclaimer == null) return null;
    return {
      gridLeft: Math.round(grid.getBoundingClientRect().left),
      disclaimerLeft: Math.round(disclaimer.getBoundingClientRect().left),
      gridRight: Math.round(grid.getBoundingClientRect().right),
      disclaimerRight: Math.round(disclaimer.getBoundingClientRect().right),
    };
  });

  expect(report).not.toBeNull();
  expect(report?.disclaimerLeft).toBe(report?.gridLeft);
  expect(report?.disclaimerRight).toBe(report?.gridRight);
});
