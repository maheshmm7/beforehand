import { expect, test } from '@playwright/test';
import { createPlan, expectNoSidewaysScroll } from './helpers';

test('the landing page states what the product does', async ({ page }) => {
  await page.goto('/#/');

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Know what a decision costs');
  await expect(page.getByRole('link', { name: 'Start a plan' })).toBeVisible();
  await expectNoSidewaysScroll(page);
});

test('a plan can be created and shows costs derived from the model', async ({ page }) => {
  await createPlan(page);

  await expect(page.getByText('Catering')).toBeVisible();
  // Every figure shows the arithmetic that produced it.
  await expect(page.getByText('770 servings × 450 (Standard)')).toBeVisible();
  await expect(page.getByText('35 tables × 900')).toBeVisible();
});

test('moving a lever reports its blast radius before it is accepted', async ({ page }) => {
  await createPlan(page);

  const radius = page.getByRole('status');
  await expect(page.getByText('Move a lever to see what it costs')).toBeVisible();

  const guests = page.getByRole('slider', { name: /Guests/ }).first();
  await guests.focus();
  for (let press = 0; press < 5; press += 1) await page.keyboard.press('ArrowRight');

  await expect(radius).toContainText('+₹76,275');
  await expect(radius).toContainText('1 new task');
  await expect(radius).toContainText('Add a second serving line');
  // A longer guest list takes longer to print and cater for.
  await expect(radius).toContainText('2 deadlines shifted');

  await page.getByRole('button', { name: 'Keep this change' }).click();
  await expect(page.getByText('Move a lever to see what it costs')).toBeVisible();
});

test('undo puts the plan back the way it was', async ({ page }) => {
  await createPlan(page);
  await expect(page.getByText('₹12,69,775').first()).toBeVisible();

  const guests = page.getByRole('slider', { name: /Guests/ }).first();
  await guests.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByText('₹12,69,775').first()).toBeHidden();

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByText('₹12,69,775').first()).toBeVisible();
});

test('a venue change adds the lines an open lawn implies', async ({ page }) => {
  await createPlan(page);

  await page.getByRole('combobox', { name: 'Venue' }).selectOption('lawn');

  const radius = page.getByRole('status');
  await expect(radius).toContainText('Rain cover');
  await expect(radius).toContainText('Power backup');
  await expect(radius).toContainText('Water and sanitation');
});

test('the timeline gives decision deadlines and a run of show', async ({ page }) => {
  await createPlan(page);
  await page.getByRole('link', { name: 'Timeline' }).first().click();

  await expect(page.getByText('Needs 120 days of notice')).toBeVisible();
  await expect(page.getByText('Hair and make-up')).toBeVisible();
  await expect(page.getByText('04:00–06:30')).toBeVisible();
});

test('the vendor list is everything nobody has promised yet', async ({ page }) => {
  await createPlan(page);
  await page.getByRole('link', { name: 'Vendors' }).first().click();

  await expect(page.getByText('STILL NOBODY’S PROMISE', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Record a quote' }).first()).toBeVisible();
});

test('a recorded quote replaces the estimate and keeps the vendor wording', async ({ page }) => {
  await createPlan(page);
  await page.getByRole('link', { name: 'Vendors' }).first().click();

  await page.getByRole('button', { name: 'Record a quote' }).first().click();
  await page
    .getByLabel('What they sent you')
    .fill('Full day hire, 1,65,000 all in. Ring 9876543210');
  await page.getByRole('textbox', { name: 'Vendor' }).fill('Lotus Banquets');
  await page.getByRole('spinbutton', { name: 'Amount' }).fill('165000');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByText('Lotus Banquets').first()).toBeVisible();
  await expect(page.getByText('quoted').first()).toBeVisible();
  // The phone number never leaves the browser, and is not kept either.
  await expect(page.getByText('9876543210')).toHaveCount(0);
  await expect(page.getByText('[phone]')).toBeVisible();
});

test('a plan survives a reload, because it lives in this browser', async ({ page }) => {
  await createPlan(page, 'Aarav turns five');
  await page.reload();

  await expect(page.getByRole('heading', { level: 1, name: 'Aarav turns five' })).toBeVisible();
});

test('back and forward move between sections', async ({ page }) => {
  await createPlan(page);
  await page.getByRole('link', { name: 'Timeline' }).first().click();
  await expect(page.getByText('THE DAY ITSELF', { exact: false })).toBeVisible();

  await page.goBack();
  await expect(page.getByText('LEVERS', { exact: false })).toBeVisible();

  await page.goForward();
  await expect(page.getByText('THE DAY ITSELF', { exact: false })).toBeVisible();
});

test('a plan id that is not here says so rather than breaking', async ({ page }) => {
  await page.goto('/#/plan/nope/budget');

  await expect(page.getByText('That plan is not in this browser.')).toBeVisible();
});
