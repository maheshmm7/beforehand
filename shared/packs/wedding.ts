import { expr } from '../engine/expr';
import type { EventPack } from '../engine/types';

const e = expr;

/**
 * Wedding costs, as a graph rather than a list.
 *
 * Figures are hand-authored planning estimates in rupees for an Indian city
 * wedding, chosen to be defensible rather than exact: they are a starting point
 * that a real quote replaces. Every rule states what it depends on, so the
 * engine can explain each number and recompute the ones a change touches.
 */
export const weddingPack: EventPack = {
  kind: 'wedding',
  label: 'Wedding',
  blurb: 'Several functions, two families, and a guest count that drives almost every cost.',
  anchorLabel: 'The ceremony',

  variables: [
    {
      kind: 'number',
      id: 'guests',
      label: 'Guests',
      min: 50,
      max: 800,
      step: 10,
      fallback: 350,
      unit: 'guests',
      help: 'The headcount nearly every other number is derived from.',
    },
    {
      kind: 'number',
      id: 'outOfTownShare',
      label: 'Guests travelling in',
      min: 0,
      max: 60,
      step: 2,
      fallback: 18,
      unit: '% travelling in',
      help: 'Drives transport and rooms, which are easy to forget until late.',
    },
    {
      kind: 'choice',
      id: 'venueClass',
      label: 'Venue',
      fallback: 'banquet',
      options: [
        { id: 'hotel', label: 'Hotel ballroom', note: 'Everything included, least to arrange' },
        { id: 'banquet', label: 'Banquet hall', note: 'The common middle' },
        { id: 'lawn', label: 'Open lawn', note: 'Cheaper to hire, more to bring in' },
        { id: 'hall', label: 'Community hall', note: 'Lowest cost, most self-managed' },
      ],
    },
    {
      kind: 'choice',
      id: 'menuTier',
      label: 'Menu',
      fallback: 'standard',
      options: [
        { id: 'standard', label: 'Standard' },
        { id: 'premium', label: 'Premium' },
        { id: 'signature', label: 'Signature', note: 'Live counters and a tasting' },
      ],
    },
    {
      kind: 'choice',
      id: 'functions',
      label: 'Functions',
      fallback: 'classic',
      options: [
        { id: 'ceremony', label: 'Ceremony only' },
        { id: 'classic', label: 'Three functions' },
        { id: 'full', label: 'Four functions' },
      ],
    },
    {
      kind: 'choice',
      id: 'decorLevel',
      label: 'Décor',
      fallback: 'dressed',
      options: [
        { id: 'simple', label: 'Simple' },
        { id: 'dressed', label: 'Dressed' },
        { id: 'elaborate', label: 'Elaborate' },
      ],
    },
    {
      kind: 'choice',
      id: 'photography',
      label: 'Photography',
      fallback: 'full',
      options: [
        { id: 'essential', label: 'Essential' },
        { id: 'full', label: 'Full coverage' },
        { id: 'cinematic', label: 'Cinematic film' },
      ],
    },
  ],

  quantities: [
    { id: 'tables', label: 'tables', expr: e.perBlock(e.var('guests'), 10) },
    { id: 'households', label: 'households', expr: e.perBlock(e.var('guests'), 3) },
    {
      id: 'functionCount',
      label: 'functions',
      expr: e.choice('functions', { ceremony: 1, classic: 3, full: 4 }, 3),
    },
    {
      id: 'extraFunctions',
      label: 'extra functions',
      expr: e.atLeast(e.sum(e.quantity('functionCount'), e.const(-1)), 0),
    },
    {
      // Not everyone comes to every function, so servings are a fraction of
      // guests times functions rather than the whole product.
      id: 'mealServings',
      label: 'servings',
      expr: e.product(
        e.var('guests'),
        e.choice('functions', { ceremony: 1, classic: 2.2, full: 2.8 }, 2.2),
      ),
    },
    {
      id: 'travellingGuests',
      label: 'guests travelling in',
      expr: e.product(e.var('guests'), e.scale(e.var('outOfTownShare'), 0.01)),
    },
    { id: 'shuttles', label: 'shuttles', expr: e.perBlock(e.quantity('travellingGuests'), 45) },
    { id: 'rooms', label: 'rooms', expr: e.perBlock(e.quantity('travellingGuests'), 2) },
    { id: 'servers', label: 'servers', expr: e.perBlock(e.var('guests'), 25) },
  ],

  costRules: [
    {
      id: 'venue',
      label: 'Venue hire',
      category: 'venue',
      decision: 'Venue',
      leadTimeDays: 120,
      amount: e.choice(
        'venueClass',
        { hotel: 420000, banquet: 180000, lawn: 260000, hall: 60000 },
        180000,
      ),
    },
    {
      id: 'venueExtraDays',
      label: 'Space for the other functions',
      category: 'venue',
      decision: 'Venue',
      leadTimeDays: 120,
      when: { op: 'compare', left: e.quantity('extraFunctions'), cmp: '>', right: e.const(0) },
      amount: e.product(
        e.choice('venueClass', { hotel: 60000, banquet: 28000, lawn: 35000, hall: 8000 }, 28000),
        e.quantity('extraFunctions'),
      ),
    },
    {
      id: 'catering',
      label: 'Catering',
      category: 'food',
      decision: 'Caterer',
      // A caterer needs longer to accept a bigger order.
      leadTimeDays: e.sum(e.const(45), e.perBlock(e.quantity('mealServings'), 400)),
      amount: e.product(
        e.quantity('mealServings'),
        e.choice('menuTier', { standard: 450, premium: 750, signature: 1200 }, 450),
      ),
    },
    {
      id: 'serviceStaff',
      label: 'Service staff',
      category: 'people',
      decision: 'Caterer',
      leadTimeDays: e.sum(e.const(21), e.perBlock(e.quantity('servers'), 6)),
      amount: e.product(e.quantity('servers'), e.const(1200), e.quantity('functionCount')),
    },
    {
      id: 'seating',
      label: 'Seating and tables',
      category: 'things',
      decision: 'Décor',
      leadTimeDays: 30,
      amount: e.scale(e.quantity('tables'), 900),
    },
    {
      id: 'decor',
      label: 'Décor and stage',
      category: 'things',
      decision: 'Décor',
      leadTimeDays: 40,
      amount: e.product(
        e.choice('decorLevel', { simple: 45000, dressed: 120000, elaborate: 260000 }, 120000),
        e.atLeast(e.scale(e.quantity('functionCount'), 0.5), 1),
      ),
    },
    {
      id: 'invitations',
      label: 'Invitations',
      category: 'paperwork',
      decision: 'Guest list',
      // Printing and posting a longer list takes longer.
      leadTimeDays: e.sum(e.const(28), e.perBlock(e.quantity('households'), 60)),
      amount: e.scale(e.quantity('households'), 95),
    },
    {
      id: 'photography',
      label: 'Photography',
      category: 'people',
      decision: 'Photographer',
      leadTimeDays: 90,
      amount: e.choice(
        'photography',
        { essential: 85000, full: 165000, cinematic: 320000 },
        165000,
      ),
    },
    {
      id: 'transport',
      label: 'Guest transport',
      category: 'travel',
      decision: 'Transport',
      leadTimeDays: e.sum(e.const(14), e.scale(e.quantity('shuttles'), 4)),
      when: { op: 'compare', left: e.quantity('shuttles'), cmp: '>', right: e.const(0) },
      amount: e.scale(e.quantity('shuttles'), 7500),
    },
    {
      id: 'accommodation',
      label: 'Rooms for guests travelling in',
      category: 'travel',
      decision: 'Accommodation',
      leadTimeDays: 45,
      when: { op: 'compare', left: e.quantity('rooms'), cmp: '>', right: e.const(0) },
      amount: e.scale(e.quantity('rooms'), 2600),
    },
    {
      id: 'sanitation',
      label: 'Water and sanitation',
      category: 'things',
      decision: 'Venue',
      leadTimeDays: 15,
      when: { op: 'is', id: 'venueClass', value: 'lawn' },
      amount: e.scale(e.var('guests'), 40),
    },
    {
      id: 'power',
      label: 'Power backup',
      category: 'things',
      decision: 'Venue',
      leadTimeDays: 15,
      when: { op: 'is', id: 'venueClass', value: 'lawn' },
      amount: e.const(45000),
    },
    {
      id: 'rainCover',
      label: 'Rain cover',
      category: 'things',
      decision: 'Venue',
      leadTimeDays: 20,
      when: { op: 'is', id: 'venueClass', value: 'lawn' },
      amount: e.const(85000),
    },
    {
      id: 'rituals',
      label: 'Priest and rituals',
      category: 'people',
      decision: 'Ceremony',
      leadTimeDays: 60,
      amount: e.const(35000),
    },
    {
      id: 'entertainment',
      label: 'Music and entertainment',
      category: 'people',
      decision: 'Entertainment',
      leadTimeDays: 35,
      when: { op: 'not', of: { op: 'is', id: 'functions', value: 'ceremony' } },
      amount: e.const(95000),
    },
    {
      id: 'favours',
      label: 'Gifts and return favours',
      category: 'things',
      decision: 'Gifts',
      leadTimeDays: 25,
      amount: e.scale(e.quantity('households'), 180),
    },
  ],

  constraints: [
    {
      id: 'capacity',
      severity: 'error',
      message: 'More guests than the venue holds.',
      hint: 'Cut the list, split a function, or move to a larger venue.',
      when: {
        op: 'compare',
        left: e.var('guests'),
        cmp: '>',
        right: e.choice('venueClass', { hotel: 450, banquet: 300, lawn: 700, hall: 180 }, 300),
      },
    },
    {
      id: 'lawnCrowd',
      severity: 'warning',
      message: 'A large crowd on an open lawn needs its own plan.',
      hint: 'Entry queues, lighting and drainage all become your problem outdoors.',
      when: {
        op: 'and',
        of: [
          { op: 'is', id: 'venueClass', value: 'lawn' },
          { op: 'compare', left: e.var('guests'), cmp: '>', right: e.const(400) },
        ],
      },
    },
    {
      id: 'strandedGuests',
      severity: 'warning',
      message: 'Guests are travelling in with no rooms budgeted.',
      hint: 'Either block rooms or tell them early enough to book their own.',
      when: {
        op: 'and',
        of: [
          { op: 'compare', left: e.quantity('travellingGuests'), cmp: '>=', right: e.const(30) },
          { op: 'is', id: 'venueClass', value: 'hall' },
        ],
      },
    },
  ],

  tasks: [
    {
      id: 'secondServingLine',
      label: 'Add a second serving line',
      leadTimeDays: 30,
      when: { op: 'compare', left: e.var('guests'), cmp: '>', right: e.const(380) },
    },
    {
      id: 'extraWashrooms',
      label: 'Hire extra washrooms',
      leadTimeDays: 20,
      when: {
        op: 'and',
        of: [
          { op: 'is', id: 'venueClass', value: 'lawn' },
          { op: 'compare', left: e.var('guests'), cmp: '>', right: e.const(250) },
        ],
      },
    },
    {
      id: 'tasting',
      label: 'Book a tasting with the chef',
      leadTimeDays: 50,
      when: { op: 'is', id: 'menuTier', value: 'signature' },
    },
    {
      id: 'crowdMarshals',
      label: 'Arrange crowd marshals at the gate',
      leadTimeDays: 15,
      when: { op: 'compare', left: e.var('guests'), cmp: '>', right: e.const(500) },
    },
    {
      id: 'shuttleCoordinator',
      label: 'Name someone to run the shuttles',
      leadTimeDays: 15,
      when: { op: 'compare', left: e.quantity('shuttles'), cmp: '>=', right: e.const(2) },
    },
  ],

  runOfShow: [
    { id: 'makeup', label: 'Hair and make-up', durationMin: 150 },
    { id: 'dressing', label: 'Dressing', durationMin: 60 },
    { id: 'familyPhotos', label: 'Family photographs', durationMin: 45 },
    {
      id: 'procession',
      label: 'Arrival procession',
      durationMin: 45,
      when: { op: 'not', of: { op: 'is', id: 'functions', value: 'ceremony' } },
    },
    { id: 'seating', label: 'Guests seated', durationMin: 30 },
  ],
};
