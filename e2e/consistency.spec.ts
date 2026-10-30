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
  // Measured from where the slider sits once it has been reached, not from
  // where it sat before: on a phone, bringing it into view is the browser
  // scrolling the page, which is not the panel moving under a thumb.
  await guests.focus();
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

test('the dock is the same height resting as it is full', async ({ page }) => {
  await createPlan(page);

  const dock = page.getByRole('region', { name: 'Blast radius' });
  const guests = page.getByRole('slider', { name: 'Guests', exact: true });
  const keep = page.getByRole('button', { name: 'Keep this change' });
  const resting = Math.round((await dock.boundingBox())?.height ?? 0);

  // Wait until it is actually showing something before sampling, or the first
  // sample is still the resting height.
  await guests.focus();
  await page.keyboard.press('ArrowRight');
  await expect(keep).toBeEnabled();

  const heights = [resting];
  for (let step = 0; step < 6; step += 1) {
    await guests.focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(140);
    heights.push(Math.round((await dock.boundingBox())?.height ?? 0));
  }

  // However many consequences there are, and whether or not there are any, the
  // dock occupies exactly the same row.
  expect(
    Math.max(...heights) - Math.min(...heights),
    `dock heights were ${heights.join(', ')}`,
  ).toBeLessThanOrEqual(1);
});

test('nothing above the dock moves when the dock fills', async ({ page }) => {
  await createPlan(page);

  const region = page.locator('#main');
  const guests = page.getByRole('slider', { name: 'Guests', exact: true });
  const before = await region.boundingBox();

  await guests.focus();
  for (let press = 0; press < 4; press += 1) await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(200);

  const after = await region.boundingBox();
  expect(Math.round(after?.height ?? 0), 'the content region was resized').toBe(
    Math.round(before?.height ?? 0),
  );
});

test('the application scrolls in one place, not four', async ({ page }) => {
  await createPlan(page);
  const base = page.url().replace(/\/[a-z]+$/, '');

  for (const view of ['budget', 'timeline', 'vendors', 'ideas']) {
    await page.goto(`${base}/${view}`);
    await page.waitForTimeout(250);

    const scrollers = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>('*'))
        .filter((element) => {
          const style = getComputedStyle(element);
          return (
            (element.scrollHeight > element.clientHeight + 1 &&
              ['auto', 'scroll'].includes(style.overflowY)) ||
            (element.scrollWidth > element.clientWidth + 1 &&
              ['auto', 'scroll'].includes(style.overflowX))
          );
        })
        .map(
          (element) => `${element.tagName}.${(element.getAttribute('class') ?? '').slice(0, 24)}`,
        ),
    );

    // A sidebar, a rail, a panel and the page all scrolling at once is four
    // grey chutes down one screen. The content region is the only one allowed
    // to scroll; everything else must fit what it is given.
    expect(
      scrollers.filter((name) => !name.startsWith('MAIN')),
      `${view} scrolls elsewhere`,
    ).toEqual([]);
  }
});

for (const width of [1000, 1280, 1920]) {
  test(`the dock's controls fit at ${String(width)} pixels`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await createPlan(page);

    const boxes = await page
      .getByRole('region', { name: 'Blast radius' })
      .locator('button')
      .evaluateAll((nodes) =>
        nodes.map((node) => {
          const box = node.getBoundingClientRect();
          return { left: Math.round(box.left), right: Math.round(box.right) };
        }),
      );

    // The list beside them is what gives way on a narrow window. The two
    // controls once squeezed into each other and overlapped.
    const [keep, undo] = boxes;
    expect(boxes, 'both controls are drawn').toHaveLength(2);
    expect(keep?.right ?? 0, `the controls overlap at ${String(width)}`).toBeLessThanOrEqual(
      undo?.left ?? 0,
    );
    expect(undo?.right ?? 0, 'the controls run off the window').toBeLessThanOrEqual(width);
  });
}

test('a plan fits a desktop window with nothing to scroll', async ({ page }) => {
  // A laptop at 1920 by 923 is the window this was reported broken in: four
  // scrollbars, then one, then a band of nothing above the dock.
  await page.setViewportSize({ width: 1920, height: 923 });
  await createPlan(page);
  const base = page.url().replace(/\/[a-z]+$/, '');

  for (const view of ['budget', 'timeline', 'vendors', 'ideas']) {
    await page.goto(`${base}/${view}`);
    await page.waitForTimeout(250);

    const fit = await page.evaluate(() => {
      const region = document.getElementById('main');
      return {
        over: (region?.scrollHeight ?? 0) - (region?.clientHeight ?? 0),
        // How much of the region the content actually covers.
        filled:
          (region?.firstElementChild?.getBoundingClientRect().height ?? 0) /
          (region?.clientHeight ?? 1),
      };
    });

    expect(fit.over, `${view} scrolls on a desktop window`).toBeLessThanOrEqual(0);
    expect(fit.filled, `${view} leaves the window half empty`).toBeGreaterThan(0.9);
  }
});

for (const width of [1440, 1728, 1920]) {
  test(`every option in a lever matches its neighbours at ${String(width)}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 923 });

    for (const kind of ['Wedding', 'Birthday', 'Community event']) {
      await page.goto('/#/new');
      await page.getByRole('radio', { name: kind }).check();
      await page.getByRole('textbox', { name: 'Name it' }).fill('Test');
      await page.getByRole('button', { name: 'Create the plan' }).click();
      await page.waitForTimeout(400);

      const groups = await page.evaluate(() =>
        Array.from(document.querySelectorAll<HTMLElement>('[class*=options]')).map((group) =>
          Array.from(group.children).map((cell) => Math.round(cell.getBoundingClientRect().height)),
        ),
      );

      // One label wrapping used to make its own cell taller than the three
      // beside it, which reads as a mistake because it is one.
      const ragged = groups.filter((hs) => Math.max(...hs) - Math.min(...hs) > 1);
      expect(ragged, `${kind} has options of different heights`).toEqual([]);
    }
  });
}

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
    { path: '/#/new', screens: narrow ? 4 : 1.1 },
    { path: planUrl, screens: narrow ? 4 : 1.7 },
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
      const seen = region === null ? window.innerHeight : region.clientHeight;
      return height / seen;
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

test('About and Privacy stay where they were put', async ({ page }) => {
  // They sit at the foot of the sidebar. Before, they followed the content, so
  // making a plan appeared to shove them down the screen.
  await page.goto('/#/new');
  if ((page.viewportSize()?.width ?? 0) < 900) {
    test.skip(true, 'the sidebar is a drawer on a narrow screen');
  }

  const about = page.getByRole('link', { name: 'About' }).first();
  const before = Math.round((await about.boundingBox())?.y ?? 0);

  await createPlan(page);
  const after = Math.round((await about.boundingBox())?.y ?? 0);

  expect(Math.abs(after - before), 'About moved when a plan was opened').toBeLessThanOrEqual(1);
});
