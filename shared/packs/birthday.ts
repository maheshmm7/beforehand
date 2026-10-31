import { expr } from '../engine/expr.ts';
import type { EventPack } from '../engine/types.ts';

const e = expr;

/**
 * A birthday is not a small wedding. The master variable is the clock, not the
 * headcount: a party is a fixed slot that the cake, the food and the
 * entertainment have to interlock inside. The costs are modest; the schedule is
 * where it goes wrong.
 */
export const birthdayPack: EventPack = {
  kind: 'birthday',
  label: 'Birthday',
  blurb: 'One short slot, where the running order matters more than the money.',
  anchorLabel: 'Cutting the cake',

  variables: [
    {
      kind: 'number',
      id: 'guests',
      label: 'Guests',
      min: 5,
      max: 200,
      step: 5,
      fallback: 40,
      unit: 'guests',
    },
    {
      kind: 'number',
      id: 'hours',
      label: 'Length of the party',
      min: 2,
      max: 8,
      step: 1,
      fallback: 4,
      unit: 'hours',
      help: 'Venues and entertainers are both priced by the hour.',
    },
    {
      kind: 'choice',
      id: 'ageGroup',
      label: 'Who it is for',
      fallback: 'child',
      options: [
        { id: 'child', label: 'A child' },
        { id: 'teen', label: 'A teenager' },
        { id: 'adult', label: 'An adult' },
        { id: 'milestone', label: 'A milestone', note: 'A sixtieth, an eightieth, and such' },
      ],
    },
    {
      kind: 'choice',
      id: 'venueType',
      label: 'Where',
      fallback: 'home',
      options: [
        { id: 'home', label: 'At home' },
        { id: 'restaurant', label: 'A restaurant' },
        { id: 'partyHall', label: 'A party hall' },
        { id: 'outdoor', label: 'A park', note: 'A park, a terrace, anywhere outdoors' },
      ],
    },
    {
      kind: 'choice',
      id: 'foodStyle',
      label: 'Food',
      fallback: 'snacks',
      options: [
        { id: 'snacks', label: 'Snacks and cake' },
        { id: 'buffet', label: 'Buffet' },
        { id: 'seated', label: 'Seated meal' },
      ],
    },
    {
      kind: 'choice',
      id: 'entertainment',
      label: 'Entertainment',
      fallback: 'none',
      options: [
        { id: 'none', label: 'None' },
        { id: 'host', label: 'A host', note: 'Somebody to run the afternoon' },
        { id: 'performer', label: 'A performer' },
        { id: 'activity', label: 'An activity', note: 'A workshop, a craft table, a game' },
      ],
    },
  ],

  quantities: [
    { id: 'tables', label: 'tables', expr: e.perBlock(e.var('guests'), 8) },
    { id: 'cakeKg', label: 'kg of cake', expr: e.atLeast(e.perBlock(e.var('guests'), 12), 1) },
    {
      id: 'helpers',
      label: 'helpers',
      expr: e.atLeast(e.perBlock(e.var('guests'), 30), 1),
    },
  ],

  costRules: [
    {
      id: 'venue',
      label: 'Venue',
      category: 'venue',
      decision: 'Venue',
      leadTimeDays: 30,
      amount: e.product(
        e.choice('venueType', { home: 0, restaurant: 4000, partyHall: 3500, outdoor: 1500 }, 0),
        e.var('hours'),
      ),
    },
    {
      id: 'food',
      label: 'Food',
      category: 'food',
      decision: 'Food',
      leadTimeDays: 10,
      amount: e.product(
        e.var('guests'),
        e.choice('foodStyle', { snacks: 280, buffet: 650, seated: 1100 }, 280),
      ),
    },
    {
      id: 'cake',
      label: 'Cake',
      category: 'food',
      decision: 'Cake',
      leadTimeDays: 7,
      amount: e.scale(e.quantity('cakeKg'), 1400),
    },
    {
      id: 'decorations',
      label: 'Decorations',
      category: 'things',
      decision: 'Decorations',
      leadTimeDays: 7,
      amount: e.sum(e.const(3500), e.scale(e.quantity('tables'), 350)),
    },
    {
      id: 'entertainment',
      label: 'Entertainment',
      category: 'people',
      decision: 'Entertainment',
      leadTimeDays: 21,
      when: { op: 'not', of: { op: 'is', id: 'entertainment', value: 'none' } },
      amount: e.product(
        e.choice('entertainment', { none: 0, host: 4000, performer: 7000, activity: 5500 }, 0),
        e.atLeast(e.var('hours'), 2),
      ),
    },
    {
      id: 'favours',
      label: 'Return gifts',
      category: 'things',
      decision: 'Return gifts',
      leadTimeDays: 10,
      when: { op: 'is', id: 'ageGroup', value: 'child' },
      amount: e.scale(e.var('guests'), 220),
    },
    {
      id: 'photography',
      label: 'Photography',
      category: 'people',
      decision: 'Photographer',
      leadTimeDays: 21,
      when: { op: 'is', id: 'ageGroup', value: 'milestone' },
      amount: e.const(18000),
    },
    {
      id: 'helpers',
      label: 'Helpers on the day',
      category: 'people',
      decision: 'Helpers',
      leadTimeDays: 7,
      when: { op: 'compare', left: e.var('guests'), cmp: '>', right: e.const(30) },
      amount: e.product(e.quantity('helpers'), e.const(700), e.var('hours')),
    },
    {
      id: 'shelter',
      label: 'Shade and seating hire',
      category: 'things',
      decision: 'Venue',
      leadTimeDays: 14,
      when: { op: 'is', id: 'venueType', value: 'outdoor' },
      amount: e.sum(e.const(4500), e.scale(e.quantity('tables'), 400)),
    },
  ],

  constraints: [
    {
      id: 'homeCrowd',
      severity: 'error',
      message: 'That is more people than a home comfortably holds.',
      hint: 'Past roughly thirty, seating and washrooms become the problem, not the food.',
      when: {
        op: 'and',
        of: [
          { op: 'is', id: 'venueType', value: 'home' },
          { op: 'compare', left: e.var('guests'), cmp: '>', right: e.const(30) },
        ],
      },
    },
    {
      id: 'tooShortForAMeal',
      severity: 'warning',
      message: 'A seated meal does not fit in a short party.',
      hint: 'Serving and clearing a seated meal takes about ninety minutes on its own.',
      when: {
        op: 'and',
        of: [
          { op: 'is', id: 'foodStyle', value: 'seated' },
          { op: 'compare', left: e.var('hours'), cmp: '<', right: e.const(3) },
        ],
      },
    },
    {
      id: 'restlessChildren',
      severity: 'warning',
      message: 'A long party for children with nothing arranged to do.',
      hint: 'Beyond about three hours, children need a structured activity.',
      when: {
        op: 'and',
        of: [
          { op: 'is', id: 'ageGroup', value: 'child' },
          { op: 'is', id: 'entertainment', value: 'none' },
          { op: 'compare', left: e.var('hours'), cmp: '>', right: e.const(3) },
        ],
      },
    },
  ],

  tasks: [
    {
      id: 'orderCake',
      label: 'Order the cake',
      leadTimeDays: 7,
      when: { op: 'always' },
    },
    {
      id: 'dietaryNeeds',
      label: 'Ask about allergies and dietary needs',
      leadTimeDays: 10,
      when: { op: 'compare', left: e.var('guests'), cmp: '>=', right: e.const(20) },
    },
    {
      id: 'parkingPlan',
      label: 'Work out where guests will park',
      leadTimeDays: 7,
      when: { op: 'compare', left: e.var('guests'), cmp: '>', right: e.const(50) },
    },
    {
      id: 'wetWeatherPlan',
      label: 'Agree a wet weather fallback',
      leadTimeDays: 10,
      when: { op: 'is', id: 'venueType', value: 'outdoor' },
    },
  ],

  runOfShow: [
    { id: 'setup', label: 'Setting up', durationMin: 60 },
    { id: 'arrival', label: 'Guests arrive', durationMin: 30 },
    {
      id: 'activity',
      label: 'Games or activity',
      durationMin: 45,
      when: { op: 'not', of: { op: 'is', id: 'entertainment', value: 'none' } },
    },
    { id: 'food', label: 'Food served', durationMin: 45 },
  ],
};
