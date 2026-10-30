import { render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { addDays } from '@/lib/calendar';
import { longDate, todayIso } from '@/lib/format';
import { user } from '@/testing/support';
import { DateField } from './DateField';
import { TimeField } from './TimeField';

function showDate(props: Partial<Parameters<typeof DateField>[0]> = {}): {
  onChange: ReturnType<typeof vi.fn>;
} {
  const onChange = vi.fn();
  render(
    <DateField
      id="when"
      label="Choose the date"
      value="2027-03-02"
      onChange={onChange}
      {...props}
    />,
  );
  return { onChange };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('DateField', () => {
  it('shows the date in words rather than a form of digits', () => {
    showDate();

    expect(screen.getByRole('button', { name: /2 Mar 2027/ })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens a calendar of six whole weeks, named by its month', async () => {
    showDate();

    await user.click(screen.getByRole('button', { name: /2 Mar 2027/ }));

    const grid = screen.getByRole('grid');
    expect(grid).toHaveAccessibleName('March 2027');
    expect(within(grid).getAllByRole('row')).toHaveLength(6);
    expect(within(grid).getAllByRole('gridcell')).toHaveLength(42);
  });

  it('names every day in full, so two fifths are not both just “5”', async () => {
    showDate();

    await user.click(screen.getByRole('button', { name: /2 Mar 2027/ }));

    expect(screen.getByRole('gridcell', { name: '5 Mar 2027' })).toBeInTheDocument();
    expect(screen.getByRole('gridcell', { name: '5 Apr 2027' })).toBeInTheDocument();
  });

  it('walks the month with the arrow keys and takes the day on Enter', async () => {
    const { onChange } = showDate();

    await user.click(screen.getByRole('button', { name: /2 Mar 2027/ }));
    await user.keyboard('{ArrowDown}{ArrowRight}');
    await user.keyboard('{Enter}');

    // A week on, then a day: 2 March plus eight days.
    expect(onChange).toHaveBeenCalledWith('2027-03-10');
  });

  it('closes on Escape without changing anything', async () => {
    const { onChange } = showDate();

    await user.click(screen.getByRole('button', { name: /2 Mar 2027/ }));
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('refuses a day before the earliest one allowed', async () => {
    const { onChange } = showDate({ value: '2027-03-10', min: '2027-03-05' });

    await user.click(screen.getByRole('button', { name: /10 Mar 2027/ }));
    const early = screen.getByRole('gridcell', { name: '1 Mar 2027' });

    expect(early).toBeDisabled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('pages a month at a time with PageUp and PageDown', async () => {
    showDate();

    await user.click(screen.getByRole('button', { name: /2 Mar 2027/ }));
    await user.keyboard('{PageDown}');
    expect(screen.getByRole('grid')).toHaveAccessibleName('April 2027');

    await user.keyboard('{PageUp}{PageUp}');
    expect(screen.getByRole('grid')).toHaveAccessibleName('February 2027');
  });

  it('stops at the earliest day allowed rather than walking past it', async () => {
    const { onChange } = showDate({ value: '2027-03-02', min: '2027-03-01' });

    await user.click(screen.getByRole('button', { name: /2 Mar 2027/ }));
    // Three days back from the second would be February.
    await user.keyboard('{ArrowLeft}{ArrowLeft}{ArrowLeft}{Enter}');

    expect(onChange).toHaveBeenCalledWith('2027-03-01');
  });

  it('marks today, so the month has a landmark', async () => {
    showDate({ value: todayIso() });

    await user.click(screen.getByRole('button', { name: new RegExp(longDate(todayIso())) }));

    expect(screen.getByRole('gridcell', { name: longDate(todayIso()) })).toHaveAttribute(
      'aria-current',
      'date',
    );
  });

  it('offers today, and the earliest allowed day when today is too early', async () => {
    const soon = addDays(todayIso(), 10);
    const { onChange } = showDate({ value: addDays(todayIso(), 20), min: soon });

    await user.click(
      screen.getByRole('button', { name: new RegExp(longDate(addDays(todayIso(), 20))) }),
    );
    await user.click(screen.getByRole('button', { name: 'Today' }));

    expect(onChange).toHaveBeenCalledWith(soon);
  });

  it('closes when the press lands somewhere else entirely', async () => {
    showDate();

    await user.click(screen.getByRole('button', { name: /2 Mar 2027/ }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(document.body);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens upward when there is no room below it', async () => {
    // jsdom gives every box zero size, so the geometry is supplied here.
    const near = { top: 700, bottom: 740, left: 100, right: 300, width: 200, height: 40 };
    vi.spyOn(HTMLButtonElement.prototype, 'getBoundingClientRect').mockReturnValue(near as DOMRect);
    vi.spyOn(HTMLDivElement.prototype, 'getBoundingClientRect').mockReturnValue({
      ...near,
      top: 0,
      bottom: 420,
      height: 420,
    } as DOMRect);
    showDate();

    await user.click(screen.getByRole('button', { name: /2 Mar 2027/ }));

    expect(screen.getByRole('dialog')).toHaveAttribute('data-place', 'above');
  });

  it('hangs from the other edge when there is no room to the right', async () => {
    // jsdom's window is 1024 wide, so a panel opening at 900 runs off it.
    const atTheEdge = { top: 10, bottom: 50, left: 900, right: 960, width: 60, height: 40 };
    vi.spyOn(HTMLButtonElement.prototype, 'getBoundingClientRect').mockReturnValue(
      atTheEdge as DOMRect,
    );
    vi.spyOn(HTMLDivElement.prototype, 'getBoundingClientRect').mockReturnValue({
      ...atTheEdge,
      left: 900,
      right: 1188,
      width: 288,
      height: 420,
    } as DOMRect);
    showDate();

    await user.click(screen.getByRole('button', { name: /2 Mar 2027/ }));

    const panel = screen.getByRole('dialog');
    expect(panel).toHaveAttribute('data-place', 'below');
    expect(panel).toHaveAttribute('data-align', 'end');
  });

  it('offers the dates somebody actually wants', async () => {
    const { onChange } = showDate();

    await user.click(screen.getByRole('button', { name: /2 Mar 2027/ }));
    await user.click(screen.getByRole('button', { name: 'In one month' }));

    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

describe('TimeField', () => {
  it('shows the time the way it is spoken', () => {
    render(<TimeField id="at" label="Choose the time" value="17:00" onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: /5:00 pm/ })).toBeInTheDocument();
  });

  it('changes the hour, keeping the minutes and the half of the day', async () => {
    const onChange = vi.fn();
    render(<TimeField id="at" label="Choose the time" value="17:30" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /5:30 pm/ }));
    await user.click(screen.getByRole('button', { name: '8', pressed: false }));

    expect(onChange).toHaveBeenCalledWith('20:30');
  });

  it('moves the half of the day on its own', async () => {
    const onChange = vi.fn();
    render(<TimeField id="at" label="Choose the time" value="17:30" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /5:30 pm/ }));
    await user.click(screen.getByRole('button', { name: 'am' }));

    expect(onChange).toHaveBeenCalledWith('05:30');
  });

  it('nudges by a quarter of an hour', async () => {
    const onChange = vi.fn();
    render(<TimeField id="at" label="Choose the time" value="09:30" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /9:30 am/ }));
    await user.click(screen.getByRole('button', { name: '+15 min' }));

    expect(onChange).toHaveBeenCalledWith('09:45');
  });
});
