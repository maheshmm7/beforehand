import { expect, test } from '@playwright/test';
import { createPlan } from './helpers';

/**
 * The official checklist, walked on the running application rather than read
 * off the source: empty states, invalid input, error handling, the whole
 * workflow end to end, and the same at three widths.
 */
const done: string[] = [];
const ok = (what: string): void => {
  done.push(what);
};

test('the application meets the pre-submission checklist', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 923 });

  // --- Empty states -------------------------------------------------------
  await page.goto('/#/new');
  await expect(page.getByText('Nothing planned yet.')).toBeVisible();
  ok('empty state: no plans yet');

  // --- Invalid input: a plan with no name --------------------------------
  await page.getByRole('button', { name: 'Create the plan' }).click();
  await expect(page.getByRole('alert')).toContainText('Give the plan a name');
  await expect(page).toHaveURL(/#\/new$/);
  ok('invalid input: unnamed plan refused, with a reason');

  // --- Invalid input: asking the assistant with nothing written ----------
  await page.getByRole('button', { name: 'Set it up for me' }).click();
  await expect(page.getByRole('alert')).toContainText('Say a little about the event');
  ok('invalid input: empty description refused');

  // --- Main workflow end to end ------------------------------------------
  await createPlan(page, 'Priya and Arjun');
  await expect(page.getByText('Catering')).toBeVisible();
  ok('workflow: a plan is created and priced');

  const base = page.url().replace(/\/[a-z]+$/, '');

  await expect(page.getByText('Nothing pending')).toBeVisible();
  ok('empty state: nothing pending in the dock');

  const guests = page.getByRole('slider').first();
  await guests.focus();
  for (let i = 0; i < 5; i += 1) await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('status')).toContainText('+');
  ok('workflow: a lever move reports its blast radius');

  await page.getByRole('button', { name: 'Keep this change' }).click();
  await expect(page.getByText('Nothing pending')).toBeVisible();
  ok('workflow: a change can be accepted');

  await guests.focus();
  await page.keyboard.press('ArrowRight');
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByText('Nothing pending')).toBeVisible();
  ok('workflow: a change can be undone');

  await page.goto(`${base}/timeline`);
  await expect(page.getByText(/Needs \d+ days of notice/).first()).toBeVisible();
  ok('artefact: timeline of decision deadlines');

  await page.goto(`${base}/vendors`);
  await expect(page.getByRole('button', { name: 'Record a quote' }).first()).toBeVisible();
  ok('artefact: vendor checklist');

  await page.goto(`${base}/ideas`);
  await expect(page.getByRole('button', { name: 'Suggest ideas' })).toBeVisible();
  ok('empty state: ideas before any have been asked for');

  // --- Error handling: the assistant is unreachable -----------------------
  await page.route('**/api/**', (route) => route.abort('connectionrefused'));
  await page.getByRole('button', { name: 'Suggest ideas' }).click();
  await expect(page.getByText(/Could not reach the server|not answering/)).toBeVisible();
  ok('error handling: unreachable assistant is reported, app keeps working');
  await expect(page.getByRole('button', { name: 'Suggest ideas' })).toBeEnabled();
  ok('error handling: the rest of the page still works');
  await page.unroute('**/api/**');

  // --- Error handling: a route that does not exist ------------------------
  await page.goto('/#/plan/nope/budget');
  await expect(page.getByText('That plan is not in this browser.')).toBeVisible();
  ok('error handling: an unknown plan is explained, not a blank page');

  await page.goto('/#/nowhere');
  await expect(page.getByText('There is nothing at that address.')).toBeVisible();
  ok('error handling: an unknown address is explained');

  // --- Responsive ---------------------------------------------------------
  for (const size of [
    { w: 390, h: 844, name: 'phone' },
    { w: 834, h: 1112, name: 'tablet' },
    { w: 1920, h: 923, name: 'desktop' },
  ]) {
    await page.setViewportSize({ width: size.w, height: size.h });
    await page.goto(`${base}/budget`);
    await page.waitForTimeout(300);
    const sideways = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(sideways, `${size.name} scrolls sideways`).toBeLessThanOrEqual(1);
    await expect(page.getByRole('slider').first()).toBeVisible();
    ok(`responsive: ${size.name} at ${String(size.w)}px`);
  }

  // Every item has to have been reached: a silent skip would read as a pass.
  expect(done.length, done.join(' | ')).toBe(18);
});
