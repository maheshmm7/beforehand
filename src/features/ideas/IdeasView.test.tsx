import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makePlan, renderWith, user, workspaceWith } from '@/testing/support';
import { suggestIdeas } from '@/lib/api';
import { IdeasView } from './IdeasView';

vi.mock('@/lib/api', () => ({ suggestIdeas: vi.fn() }));
const asked = vi.mocked(suggestIdeas);

function show(): void {
  const plan = makePlan();
  renderWith(<IdeasView plan={plan} />, workspaceWith(plan));
}

const idea = {
  title: 'Live dosa counter',
  why: 'It gives the long queue something to watch.',
  estimatedCost: 38000,
  leadTimeDays: 10,
};

describe('IdeasView', () => {
  beforeEach(() => {
    asked.mockReset();
  });

  it('asks for nothing until told to', () => {
    show();

    expect(screen.getByText('Nothing suggested yet.')).toBeInTheDocument();
    expect(asked).not.toHaveBeenCalled();
  });

  it('sends only the shape of the plan, never names or notes', async () => {
    asked.mockResolvedValue({ ok: true, value: { ideas: [] } });
    show();

    await user.click(screen.getByRole('button', { name: 'Suggest ideas' }));

    // The screen promises "no names, dates or messages". All three have to
    // hold, not just the first.
    const sent = asked.mock.calls[0]?.[0];
    expect(sent?.summary).not.toContain('Priya');
    expect(sent?.summary).not.toContain('Hyderabad');
    expect(sent?.summary).not.toMatch(/\d{4}-\d{2}-\d{2}/);
    expect(sent?.summary).not.toMatch(/2027|Mar/);
    expect(sent?.summary).toContain('wedding');
    expect(sent?.headroom).toBeGreaterThan(0);
  });

  it('shows what came back, with cost and notice', async () => {
    asked.mockResolvedValue({ ok: true, value: { ideas: [idea] } });
    show();

    await user.click(screen.getByRole('button', { name: 'Suggest ideas' }));

    expect(await screen.findByText('Live dosa counter')).toBeInTheDocument();
    expect(screen.getByText(/Book 10 days ahead/)).toBeInTheDocument();
  });

  it('says plainly when nothing fits', async () => {
    asked.mockResolvedValue({ ok: true, value: { ideas: [] } });
    show();

    await user.click(screen.getByRole('button', { name: 'Suggest ideas' }));

    expect(await screen.findByText('Nothing fits inside what is left.')).toBeInTheDocument();
  });

  it('reports a failure without pretending anything changed', async () => {
    asked.mockResolvedValue({ ok: false, message: 'The assistant is switched off.' });
    show();

    await user.click(screen.getByRole('button', { name: 'Suggest ideas' }));

    expect(await screen.findByText('The assistant is switched off.')).toBeInTheDocument();
    expect(screen.getByText('Nothing suggested yet.')).toBeInTheDocument();
  });

  it('flags a suggestion that would not actually fit', async () => {
    asked.mockResolvedValue({
      ok: true,
      value: { ideas: [{ ...idea, estimatedCost: 9_000_000 }] },
    });
    show();

    await user.click(screen.getByRole('button', { name: 'Suggest ideas' }));

    expect(await screen.findByText('over budget')).toBeInTheDocument();
  });

  it('says the costs are guesses, not quotes', () => {
    show();

    expect(screen.getByText(/costs are its guesses, not quotes/)).toBeInTheDocument();
  });
});
