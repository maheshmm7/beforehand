import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { describePlan } from '@/lib/api';
import { renderWith, user } from '@/testing/support';
import { NewPlanPage } from './NewPlanPage';

vi.mock('@/lib/api', () => ({ describePlan: vi.fn() }));
const described = vi.mocked(describePlan);

describe('NewPlanPage', () => {
  beforeEach(() => {
    described.mockReset();
    window.location.hash = '';
  });

  it('offers all three kinds of event', () => {
    renderWith(<NewPlanPage />);

    expect(screen.getByRole('radio', { name: /Wedding/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Birthday/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Community event/ })).toBeInTheDocument();
  });

  it('will not create a plan with no name', async () => {
    renderWith(<NewPlanPage />);

    await user.click(screen.getByRole('button', { name: 'Create the plan' }));

    expect(screen.getByText('Give the plan a name so you can find it again.')).toBeInTheDocument();
  });

  it('creates a plan and opens it', async () => {
    renderWith(<NewPlanPage />);

    await user.type(screen.getByRole('textbox', { name: 'Name it' }), 'Aarav turns five');
    await user.click(screen.getByRole('radio', { name: /Birthday/ }));
    await user.click(screen.getByRole('button', { name: 'Create the plan' }));

    expect(window.location.hash).toMatch(/^#\/plan\/p-[\w-]+\/budget$/);
  });

  it('asks for a description before calling the assistant', async () => {
    renderWith(<NewPlanPage />);

    await user.click(screen.getByRole('button', { name: 'Set it up for me' }));

    expect(screen.getByText('Say a little about the event first.')).toBeInTheDocument();
    expect(described).not.toHaveBeenCalled();
  });

  it('fills the form from what the assistant understood', async () => {
    described.mockResolvedValue({
      ok: true,
      value: {
        name: 'Priya and Arjun',
        place: 'Hyderabad',
        settings: [{ id: 'guests', value: '420' }],
        notes: ['Could not tell how many functions.'],
      },
    });
    renderWith(<NewPlanPage />);

    await user.type(
      screen.getByRole('textbox', { name: 'In your own words' }),
      'A wedding in Hyderabad for about 420 people',
    );
    await user.click(screen.getByRole('button', { name: 'Set it up for me' }));

    expect(await screen.findByDisplayValue('Priya and Arjun')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Hyderabad')).toBeInTheDocument();
    expect(screen.getByText('Could not tell how many functions.')).toBeInTheDocument();
  });

  it('strips a phone number before asking the assistant', async () => {
    described.mockResolvedValue({
      ok: true,
      value: { name: '', place: '', settings: [], notes: [] },
    });
    renderWith(<NewPlanPage />);

    await user.type(
      screen.getByRole('textbox', { name: 'In your own words' }),
      'Call the hall on 9876543210',
    );
    await user.click(screen.getByRole('button', { name: 'Set it up for me' }));

    expect(described.mock.calls[0]?.[0].text).not.toContain('9876543210');
    expect(described.mock.calls[0]?.[0].text).toContain('[phone]');
  });

  it('reports a failure and leaves the form alone', async () => {
    described.mockResolvedValue({ ok: false, message: 'The assistant is switched off.' });
    renderWith(<NewPlanPage />);

    await user.type(screen.getByRole('textbox', { name: 'In your own words' }), 'A wedding');
    await user.click(screen.getByRole('button', { name: 'Set it up for me' }));

    expect(await screen.findByText('The assistant is switched off.')).toBeInTheDocument();
  });

  it('only sends the levers the chosen pack actually has', async () => {
    described.mockResolvedValue({
      ok: true,
      value: { name: '', place: '', settings: [], notes: [] },
    });
    renderWith(<NewPlanPage />);

    await user.click(screen.getByRole('radio', { name: /Community event/ }));
    await user.type(
      screen.getByRole('textbox', { name: 'In your own words' }),
      'A street festival',
    );
    await user.click(screen.getByRole('button', { name: 'Set it up for me' }));

    const sent = described.mock.calls[0]?.[0];
    expect(sent?.kind).toBe('community');
    const ids = sent?.levers.map((lever) => lever.id) ?? [];
    expect(ids).toContain('volunteers');
    expect(ids).not.toContain('menuTier');
    // A choice lever carries its options, or the model cannot pick one.
    const venue = sent?.levers.find((lever) => lever.id === 'venue');
    expect(venue?.options?.join(' ')).toContain('street');
  });
});
