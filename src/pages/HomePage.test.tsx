import { fireEvent, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { makePlan, renderWith, user, workspaceWith } from '@/testing/support';
import { SiteLayout } from './landing/SiteLayout';
import { HomePage } from './HomePage';

function show(withPlan = false): void {
  const plan = makePlan();
  renderWith(
    <SiteLayout>
      <HomePage />
    </SiteLayout>,
    withPlan ? workspaceWith(plan) : undefined,
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

describe('the landing page', () => {
  it('leads with what the product does', () => {
    show();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /Know what a decision costs/,
    );
  });

  it('offers a way in from the header and from the hero', () => {
    show();

    expect(screen.getAllByRole('link', { name: 'Start a plan' }).length).toBeGreaterThan(1);
  });

  it('explains the steps, the difference and the event types', () => {
    show();

    expect(screen.getByRole('heading', { name: /Three steps/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /A recorder stores/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /One engine, three very/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Wedding' })).toBeInTheDocument();
  });

  it('answers the questions people ask, hidden until opened', async () => {
    show();

    const question = screen.getByText('What does the AI actually do?');
    expect(screen.getByText(/It reads and it proposes/)).not.toBeVisible();

    await user.click(question);
    expect(screen.getByText(/It reads and it proposes/)).toBeVisible();
  });

  it('says plainly that the figures are estimates', () => {
    show();

    expect(screen.getByText(/not quotes, until you replace them/)).toBeInTheDocument();
  });

  it('lists the plans already in this browser, and not otherwise', () => {
    show();
    expect(screen.queryByRole('heading', { name: 'Your plans' })).not.toBeInTheDocument();

    show(true);
    expect(screen.getByRole('heading', { name: 'Your plans' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Priya and Arjun/ })).toBeInTheDocument();
  });
});

describe('the live demo in the hero', () => {
  it('starts at the baseline with nothing moved', () => {
    show();

    expect(screen.getByText('at the baseline')).toBeInTheDocument();
    expect(screen.getByText('Nothing has moved yet')).toBeInTheDocument();
    expect(screen.getByText('₹15,73,775')).toBeInTheDocument();
  });

  it('recomputes the real model when the lever moves', () => {
    show();

    fireEvent.change(screen.getByLabelText('Guests'), { target: { value: '430' } });

    expect(screen.getByText('+₹1,26,425')).toBeInTheDocument();
    expect(screen.getByText('6 cost lines moved')).toBeInTheDocument();
    expect(screen.getByText('2 deadlines shifted earlier')).toBeInTheDocument();
    expect(screen.getByText('Add a second serving line')).toBeInTheDocument();
  });

  it('reports a cheaper plan as a fall, not a rise', () => {
    show();

    fireEvent.change(screen.getByLabelText('Guests'), { target: { value: '250' } });

    expect(screen.getByText(/^-₹/)).toBeInTheDocument();
  });

  it('warns when the venue can no longer hold the guests', () => {
    show();

    fireEvent.change(screen.getByLabelText('Guests'), { target: { value: '520' } });

    expect(screen.getByText('More guests than the venue holds.')).toBeInTheDocument();
  });
});

describe('the site chrome', () => {
  it('names the sections of the page in its navigation', () => {
    show();

    const nav = screen.getByRole('navigation', { name: 'Sections of this page' });
    expect(within(nav).getByRole('link', { name: 'How it works' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Questions' })).toBeInTheDocument();
  });

  it('opens and closes a menu on a narrow screen', async () => {
    show();

    await user.click(screen.getByRole('button', { name: 'Open the menu' }));
    expect(screen.getByRole('navigation', { name: 'Menu' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close the menu' }));
    expect(screen.queryByRole('navigation', { name: 'Menu' })).not.toBeInTheDocument();
  });

  it('cycles the theme and remembers it', async () => {
    show();

    await user.click(screen.getByRole('button', { name: /^Theme: follows your system/ }));
    expect(document.documentElement.dataset.theme).toBe('light');

    await user.click(screen.getByRole('button', { name: /^Theme: light/ }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('beforehand.theme')).toBe('dark');
  });

  it('carries a footer with the disclaimer and the policy links', () => {
    show();

    const footer = screen.getByRole('contentinfo');
    expect(within(footer).getByRole('link', { name: 'Privacy' })).toBeInTheDocument();
    expect(within(footer).getByText(/No account. No tracking./)).toBeInTheDocument();
  });
});
