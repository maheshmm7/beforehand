import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { makePlan, renderWith, user, workspaceWith } from '@/testing/support';
import { parseRoute } from '@/lib/router';
import { AppShell } from './AppShell';

const plan = makePlan();
const planRoute = parseRoute(`#/plan/${plan.id}/budget`);

function showPlan(): void {
  renderWith(<AppShell route={planRoute}>content</AppShell>, workspaceWith(plan));
}

describe('AppShell', () => {
  it('puts a skip link first, for a keyboard', () => {
    renderWith(<AppShell route={{ name: 'home' }}>content</AppShell>);

    expect(screen.getByRole('link', { name: 'Skip to content' })).toBeInTheDocument();
  });

  it('says there is nothing planned yet when there is not', () => {
    renderWith(<AppShell route={{ name: 'home' }}>content</AppShell>);

    expect(screen.getAllByText('Nothing planned yet.').length).toBeGreaterThan(0);
  });

  it('lists the plans and marks the one being looked at', () => {
    showPlan();

    const current = screen.getAllByRole('link', { name: /Priya and Arjun/ })[0];
    expect(current).toHaveAttribute('aria-current', 'true');
  });

  it('shows the sections only once a plan is open', () => {
    renderWith(<AppShell route={{ name: 'home' }}>content</AppShell>);
    expect(screen.queryByRole('link', { name: 'Timeline' })).not.toBeInTheDocument();

    showPlan();
    expect(screen.getAllByRole('link', { name: 'Timeline' }).length).toBeGreaterThan(0);
  });

  it('marks the section being looked at', () => {
    showPlan();

    const budget = screen.getAllByRole('link', { name: 'Budget' })[0];
    expect(budget).toHaveAttribute('aria-current', 'page');
  });

  it('opens and closes the plan list on a narrow screen', async () => {
    showPlan();

    const toggle = screen.getByRole('button', { name: /Priya and Arjun/ });
    const before = screen.getAllByRole('navigation', { name: 'Plans and sections' }).length;

    await user.click(toggle);
    expect(screen.getAllByRole('navigation', { name: 'Plans and sections' }).length).toBe(
      before + 1,
    );

    await user.click(toggle);
    expect(screen.getAllByRole('navigation', { name: 'Plans and sections' }).length).toBe(before);
  });
});

describe('scenarios in the sidebar', () => {
  it('branches, switches and deletes', async () => {
    showPlan();
    const sidebar = screen.getAllByRole('navigation', { name: 'Plans and sections' })[0];
    if (sidebar === undefined) throw new Error('no sidebar');
    const panel = within(sidebar);

    await user.click(panel.getByRole('button', { name: /Branch from Plan A/ }));
    expect(panel.getByRole('button', { name: 'Plan B' })).toHaveAttribute('aria-current', 'true');

    await user.click(panel.getByRole('button', { name: 'Plan A' }));
    expect(panel.getByRole('button', { name: 'Plan A' })).toHaveAttribute('aria-current', 'true');

    await user.click(panel.getByRole('button', { name: 'Delete Plan B' }));
    expect(panel.queryByRole('button', { name: 'Plan B' })).not.toBeInTheDocument();
  });

  it('offers no delete when only one branch is left', () => {
    showPlan();

    expect(screen.queryByRole('button', { name: /^Delete/ })).not.toBeInTheDocument();
  });
});
