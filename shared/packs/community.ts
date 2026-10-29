import { expr } from '../engine/expr';
import type { EventPack } from '../engine/types';

const e = expr;

/**
 * A community event is the case ordinary planners ignore. It has income as well
 * as cost, labour supplied by volunteers rather than bought, and legal
 * deadlines for permission and safety. Income lines are negative amounts, so
 * the same totals arithmetic shows whether the event covers itself.
 */
export const communityPack: EventPack = {
  kind: 'community',
  label: 'Community event',
  blurb: 'Volunteers, permissions and sponsorship, where the budget can come out positive.',
  anchorLabel: 'The programme starts',

  variables: [
    {
      kind: 'number',
      id: 'attendees',
      label: 'Expected attendance',
      min: 25,
      max: 5000,
      step: 25,
      fallback: 400,
      unit: 'people',
    },
    {
      kind: 'number',
      id: 'volunteers',
      label: 'Volunteers committed',
      min: 0,
      max: 300,
      step: 1,
      fallback: 12,
      unit: 'volunteers',
      help: 'Labour you do not pay for, but which has to be enough.',
    },
    {
      kind: 'number',
      id: 'sponsorship',
      label: 'Sponsorship pledged',
      min: 0,
      max: 1000000,
      step: 5000,
      fallback: 60000,
      unit: 'pledged',
    },
    {
      kind: 'number',
      id: 'ticketPrice',
      label: 'Entry contribution',
      min: 0,
      max: 1000,
      step: 10,
      fallback: 0,
      unit: 'per head',
      help: 'Zero for a free event.',
    },
    {
      kind: 'choice',
      id: 'venue',
      label: 'Where',
      fallback: 'ground',
      options: [
        { id: 'street', label: 'A street or lane', note: 'Needs road permission' },
        { id: 'park', label: 'A park' },
        { id: 'ground', label: 'An open ground' },
        { id: 'hall', label: 'An indoor hall' },
      ],
    },
    {
      kind: 'choice',
      id: 'eventType',
      label: 'What kind',
      fallback: 'festival',
      options: [
        { id: 'festival', label: 'Festival or cultural day' },
        { id: 'sports', label: 'Sports day' },
        { id: 'drive', label: 'Clean-up or service drive' },
        { id: 'meeting', label: 'Public meeting' },
      ],
    },
  ],

  quantities: [
    { id: 'marshalsNeeded', label: 'marshals needed', expr: e.perBlock(e.var('attendees'), 100) },
    { id: 'toilets', label: 'portable toilets', expr: e.perBlock(e.var('attendees'), 150) },
    { id: 'binStations', label: 'bin stations', expr: e.perBlock(e.var('attendees'), 120) },
    {
      id: 'volunteerShortfall',
      label: 'volunteers short',
      expr: e.atLeast(e.sum(e.quantity('marshalsNeeded'), e.scale(e.var('volunteers'), -1)), 0),
    },
  ],

  costRules: [
    {
      id: 'permission',
      label: 'Permissions and fees',
      category: 'paperwork',
      decision: 'Permissions',
      leadTimeDays: 45,
      amount: e.choice('venue', { street: 12000, park: 6000, ground: 7500, hall: 4000 }, 7500),
    },
    {
      id: 'barricades',
      label: 'Barricades and crowd control',
      category: 'things',
      decision: 'Safety',
      leadTimeDays: 21,
      amount: e.scale(e.quantity('marshalsNeeded'), 2200),
    },
    {
      id: 'paidMarshals',
      label: 'Paid marshals to cover the gap',
      category: 'people',
      decision: 'Safety',
      leadTimeDays: 14,
      when: { op: 'compare', left: e.quantity('volunteerShortfall'), cmp: '>', right: e.const(0) },
      amount: e.scale(e.quantity('volunteerShortfall'), 1400),
    },
    {
      id: 'sound',
      label: 'Sound and stage',
      category: 'things',
      decision: 'Stage',
      leadTimeDays: 21,
      when: { op: 'not', of: { op: 'is', id: 'eventType', value: 'drive' } },
      amount: e.sum(e.const(18000), e.scale(e.var('attendees'), 22)),
    },
    {
      id: 'sanitation',
      label: 'Portable toilets',
      category: 'things',
      decision: 'Sanitation',
      leadTimeDays: 14,
      when: { op: 'not', of: { op: 'is', id: 'venue', value: 'hall' } },
      amount: e.scale(e.quantity('toilets'), 3200),
    },
    {
      id: 'waste',
      label: 'Waste collection',
      category: 'things',
      decision: 'Sanitation',
      leadTimeDays: 14,
      amount: e.sum(e.const(4000), e.scale(e.quantity('binStations'), 900)),
    },
    {
      id: 'firstAid',
      label: 'First aid cover',
      category: 'people',
      decision: 'Safety',
      leadTimeDays: 14,
      amount: e.sum(e.const(6000), e.scale(e.var('attendees'), 12)),
    },
    {
      id: 'insurance',
      label: 'Public liability cover',
      category: 'paperwork',
      decision: 'Permissions',
      leadTimeDays: 30,
      when: { op: 'compare', left: e.var('attendees'), cmp: '>=', right: e.const(250) },
      amount: e.sum(e.const(8000), e.scale(e.var('attendees'), 9)),
    },
    {
      id: 'refreshments',
      label: 'Refreshments',
      category: 'food',
      decision: 'Refreshments',
      leadTimeDays: 10,
      amount: e.scale(e.var('attendees'), 60),
    },
    {
      id: 'prizes',
      label: 'Prizes and certificates',
      category: 'things',
      decision: 'Programme',
      leadTimeDays: 14,
      when: { op: 'is', id: 'eventType', value: 'sports' },
      amount: e.sum(e.const(9000), e.scale(e.var('attendees'), 25)),
    },
    {
      id: 'sponsorshipIncome',
      label: 'Sponsorship',
      category: 'income',
      decision: 'Sponsorship',
      leadTimeDays: 60,
      when: { op: 'compare', left: e.var('sponsorship'), cmp: '>', right: e.const(0) },
      amount: e.scale(e.var('sponsorship'), -1),
    },
    {
      id: 'entryIncome',
      label: 'Entry contributions',
      category: 'income',
      decision: 'Entry',
      leadTimeDays: 30,
      when: { op: 'compare', left: e.var('ticketPrice'), cmp: '>', right: e.const(0) },
      // Not everyone who attends contributes; eighty per cent is the planning figure.
      amount: e.scale(e.product(e.var('attendees'), e.var('ticketPrice')), -0.8),
    },
  ],

  constraints: [
    {
      id: 'notEnoughVolunteers',
      severity: 'error',
      message: 'Not enough people on the ground for that crowd.',
      hint: 'One marshal per hundred attendees is the working rule. Recruit, or pay for the gap.',
      when: { op: 'compare', left: e.quantity('volunteerShortfall'), cmp: '>', right: e.const(0) },
    },
    {
      id: 'streetPermissionLate',
      severity: 'warning',
      message: 'Road closures are the slowest permission to obtain.',
      hint: 'Start the application before anything else is booked.',
      when: { op: 'is', id: 'venue', value: 'street' },
    },
    {
      id: 'doesNotCoverItself',
      severity: 'warning',
      message: 'Pledged income does not cover the planned spend.',
      hint: 'Raise sponsorship, add a contribution, or cut the programme.',
      when: {
        op: 'compare',
        left: e.sum(
          e.var('sponsorship'),
          e.scale(e.product(e.var('attendees'), e.var('ticketPrice')), 0.8),
        ),
        cmp: '<',
        right: e.scale(e.var('attendees'), 180),
      },
    },
  ],

  tasks: [
    {
      id: 'applyPermission',
      label: 'Apply for permission',
      leadTimeDays: 45,
      when: { op: 'always' },
    },
    {
      id: 'briefVolunteers',
      label: 'Brief the volunteers',
      leadTimeDays: 7,
      when: { op: 'compare', left: e.var('volunteers'), cmp: '>', right: e.const(0) },
    },
    {
      id: 'ambulanceOnCall',
      label: 'Arrange an ambulance on call',
      leadTimeDays: 21,
      when: { op: 'compare', left: e.var('attendees'), cmp: '>=', right: e.const(1000) },
    },
    {
      id: 'noiseNotice',
      label: 'Give neighbours notice of the noise',
      leadTimeDays: 14,
      when: { op: 'is', id: 'venue', value: 'street' },
    },
  ],

  runOfShow: [
    { id: 'setup', label: 'Setting up', durationMin: 120 },
    { id: 'safetyCheck', label: 'Safety walk-through', durationMin: 30 },
    { id: 'volunteerBrief', label: 'Volunteer briefing', durationMin: 30 },
    { id: 'gatesOpen', label: 'Gates open', durationMin: 45 },
  ],
};
