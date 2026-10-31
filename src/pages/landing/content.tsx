import { IconBranch, IconCalendar, IconLock, IconReceipt, IconRipple, IconSpark } from '@/ui/icons';

/**
 * What the landing page says, kept apart from how it is laid out. Copy is
 * edited far more often than markup, and this is the file to edit.
 */
export const STEPS = [
  {
    title: 'Describe the event',
    text: 'Move a few levers, or say it in one sentence and let the assistant set them for you. Rough numbers are fine.',
  },
  {
    title: 'Move one thing',
    text: 'Every cost, deadline and task that depends on it recomputes, and the difference is shown before you accept it.',
  },
  {
    title: 'Replace guesses with promises',
    text: 'Paste what a vendor actually sent. That line stops being an estimate and becomes a quote, in their own words.',
  },
] as const;

export const FEATURES = [
  {
    icon: <IconRipple />,
    title: 'The blast radius',
    text: 'Change the guest count and see the six lines it moves, the deadlines it pulls forward and the task it creates — before you commit.',
  },
  {
    icon: <IconReceipt />,
    title: 'Three states for every rupee',
    text: 'Estimated by the model, quoted by a named vendor, or paid and gone. You always know how much of the plan is still free to change.',
  },
  {
    icon: <IconCalendar />,
    title: 'Deadlines, not a to-do list',
    text: 'Each date is the last day a choice can be made for the plan behind it to still be possible, worked out from the notice each thing needs.',
  },
  {
    icon: <IconBranch />,
    title: 'Scenario branches',
    text: 'Keep “hotel, 350 guests” and “open lawn, 450” side by side as living plans, and promote one when you decide.',
  },
  {
    icon: <IconSpark />,
    title: 'Ideas that actually fit',
    text: 'Suggestions are asked for against what the plan can still absorb, and each comes back with its cost and how far ahead to book it.',
  },
  {
    icon: <IconLock />,
    title: 'No account, ever',
    text: 'Plans live in this browser. There is no sign-up, no password and no copy on a server — so there is nothing to leak.',
  },
] as const;

export const RECORDER = [
  'You type a number; it stores the number',
  'Food and guest count are unrelated columns',
  'Dates are whatever you typed',
  'Finds the overrun when the invoices arrive',
] as const;

export const SIMULATOR = [
  'You move a lever; it works out the consequence',
  'Food, seating, invitations and transport all follow headcount',
  'Dates are computed from the notice each vendor needs',
  'Shows the overrun before you agree to it',
] as const;

export const QUESTIONS = [
  {
    q: 'Where do the numbers come from?',
    a: 'A hand-authored cost model for each kind of event, written as rules rather than a price list. They are planning estimates for an Indian city, meant as a defensible starting point. The moment you record a real quote, that line stops being an estimate.',
  },
  {
    q: 'What does the AI actually do?',
    a: 'It reads and it proposes. It turns a sentence about your event into settings, reads a pasted vendor message into a structured quote, and suggests ideas that fit your headroom. It never does the arithmetic — every figure is computed by ordinary code, which is why each one can show its working.',
  },
  {
    q: 'Does it work without the assistant?',
    a: 'Completely. The simulator, both timelines and the vendor ledger are deterministic. The assistant is a convenience on top, not the engine.',
  },
  {
    q: 'Where is my data?',
    a: 'In this browser, and nowhere else. No account, no server copy, no analytics, no cookies. When you ask the assistant to read something, only that extract is sent, with phone numbers, emails and links stripped out first.',
  },
  {
    q: 'Is it only for weddings?',
    a: 'No. The same engine runs birthdays, where the clock matters more than the money, and community events, which have volunteers, permissions and sponsorship — so the budget can come out in credit.',
  },
] as const;
