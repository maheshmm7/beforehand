import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makePlan, PlanHost, renderWith, user, workspaceWith } from '@/testing/support';
import { readQuote } from '@/lib/api';
import { VendorsView } from './VendorsView';

vi.mock('@/lib/api', () => ({ readQuote: vi.fn() }));
const read = vi.mocked(readQuote);

function show(): void {
  const plan = makePlan();
  renderWith(
    <PlanHost planId={plan.id}>{(current) => <VendorsView plan={current} />}</PlanHost>,
    workspaceWith(plan),
  );
}

async function openFirstForm(): Promise<void> {
  const buttons = screen.getAllByRole('button', { name: 'Record a quote' });
  const first = buttons[0];
  if (first === undefined) throw new Error('no line to quote');
  await user.click(first);
}

describe('VendorsView', () => {
  beforeEach(() => {
    read.mockReset();
  });

  it('frames the list as what nobody has promised yet', () => {
    show();

    expect(screen.getByText(/Still nobody’s promise/i)).toBeInTheDocument();
    // Nothing is marked "estimated": the card's own title says that about
    // every row in it, so a mark on each one would say it twice.
    expect(screen.queryAllByText('estimated')).toHaveLength(0);
    expect(screen.getByText('Catering')).toBeInTheDocument();
  });

  it('says how much notice each line needs', () => {
    show();

    expect(screen.getAllByText(/Venue · needs 120 days of notice/).length).toBeGreaterThan(0);
  });

  it('records a quote typed by hand and moves the line off the estimate', async () => {
    show();
    await openFirstForm();

    await user.type(screen.getByLabelText('What they sent you'), 'Full day hire, all in');
    await user.clear(screen.getByLabelText('Vendor'));
    await user.type(screen.getByLabelText('Vendor'), 'Lotus Banquets');
    await user.clear(screen.getByLabelText('Amount'));
    await user.type(screen.getByLabelText('Amount'), '165000');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('What has actually been promised')).toBeInTheDocument();
    expect(screen.getByText('Lotus Banquets')).toBeInTheDocument();
    expect(screen.getByText('“Full day hire, all in”')).toBeInTheDocument();
  });

  it('refuses to save without a vendor or a number', async () => {
    show();
    await openFirstForm();

    await user.clear(screen.getByLabelText('Vendor'));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Who gave you this price?')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Vendor'), 'Lotus');
    await user.clear(screen.getByLabelText('Amount'));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Enter the amount as a number.')).toBeInTheDocument();
  });

  it('takes the phone number out before anything is sent or stored', async () => {
    read.mockResolvedValue({
      ok: true,
      value: {
        vendor: 'Lotus',
        amount: 165000,
        inclusions: ['power'],
        exclusions: [],
        evidence: 'Full day hire, 1,65,000 all in.',
      },
    });
    show();
    await openFirstForm();

    await user.type(screen.getByLabelText('What they sent you'), 'Call 9876543210 for the hall');
    await user.click(screen.getByRole('button', { name: 'Read it for me' }));

    expect(read.mock.calls[0]?.[0].text).not.toContain('9876543210');
    expect(read.mock.calls[0]?.[0].text).toContain('[phone]');
  });

  it('fills the form from what the assistant read, and names the inclusions', async () => {
    read.mockResolvedValue({
      ok: true,
      value: {
        vendor: 'Lotus Banquets',
        amount: 165000,
        inclusions: ['power backup'],
        exclusions: ['décor'],
        evidence: 'Full day hire, 1,65,000 all in.',
      },
    });
    show();
    await openFirstForm();

    await user.type(screen.getByLabelText('What they sent you'), 'Full day hire, 1,65,000 all in.');
    await user.click(screen.getByRole('button', { name: 'Read it for me' }));

    expect(await screen.findByDisplayValue('Lotus Banquets')).toBeInTheDocument();
    expect(screen.getByDisplayValue('165000')).toBeInTheDocument();
    expect(screen.getByText(/Includes: power backup/)).toBeInTheDocument();
    expect(screen.getByText(/Excludes: décor/)).toBeInTheDocument();
  });

  it('asks for the text first rather than sending an empty request', async () => {
    show();
    await openFirstForm();

    await user.click(screen.getByRole('button', { name: 'Read it for me' }));

    expect(screen.getByText('Paste the vendor’s message first.')).toBeInTheDocument();
    expect(read).not.toHaveBeenCalled();
  });

  it('reports a failed reading and changes nothing', async () => {
    read.mockResolvedValue({ ok: false, message: 'The assistant is switched off.' });
    show();
    await openFirstForm();

    await user.type(screen.getByLabelText('What they sent you'), 'Something');
    await user.click(screen.getByRole('button', { name: 'Read it for me' }));

    expect(await screen.findByText('The assistant is switched off.')).toBeInTheDocument();
  });

  it('marks a line as paid, which is not free to change', async () => {
    show();
    await openFirstForm();

    await user.clear(screen.getByLabelText('Vendor'));
    await user.type(screen.getByLabelText('Vendor'), 'Lotus');
    await user.click(screen.getByLabelText(/An advance has been paid/));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect((await screen.findAllByText('paid')).length).toBeGreaterThan(0);
  });

  it('removes a quote again', async () => {
    show();
    await openFirstForm();

    await user.clear(screen.getByLabelText('Vendor'));
    await user.type(screen.getByLabelText('Vendor'), 'Lotus');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await user.click(await screen.findByRole('button', { name: /Remove the quote from Lotus/ }));

    expect(screen.queryByText('What has actually been promised')).not.toBeInTheDocument();
  });

  it('closes the form on cancel', async () => {
    show();
    await openFirstForm();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByLabelText('What they sent you')).not.toBeInTheDocument();
  });
});
