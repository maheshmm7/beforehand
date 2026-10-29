/**
 * The planning engine's vocabulary.
 *
 * An event is a graph of coupled decisions. Levers are `variables`; anything
 * computed from them is a `quantity`; money, constraints, tasks and lead times
 * are declared as data over those, so the whole model can be evaluated,
 * explained and tested without running any UI.
 */

export type VariableId = string;
export type QuantityId = string;
export type RuleId = string;

/** A number read out of the plan, directly or by arithmetic over other values. */
export type Expr =
  | { readonly op: 'const'; readonly value: number }
  | { readonly op: 'var'; readonly id: VariableId }
  | { readonly op: 'quantity'; readonly id: QuantityId }
  /** The number attached to the chosen option of a choice variable. */
  | {
      readonly op: 'choice';
      readonly id: VariableId;
      readonly values: Readonly<Record<string, number>>;
      readonly fallback: number;
    }
  | { readonly op: 'scale'; readonly of: Expr; readonly by: number }
  /** ceil(of / size): tables of ten, one shuttle per forty-five, and so on. */
  | { readonly op: 'perBlock'; readonly of: Expr; readonly size: number }
  | { readonly op: 'sum'; readonly of: readonly Expr[] }
  | { readonly op: 'product'; readonly of: readonly Expr[] }
  | { readonly op: 'atLeast'; readonly of: Expr; readonly floor: number };

export type Comparator = '>' | '>=' | '<' | '<=' | '==';

export type Condition =
  | { readonly op: 'always' }
  | { readonly op: 'is'; readonly id: VariableId; readonly value: string }
  | {
      readonly op: 'compare';
      readonly left: Expr;
      readonly cmp: Comparator;
      readonly right: Expr;
    }
  | { readonly op: 'and'; readonly of: readonly Condition[] }
  | { readonly op: 'or'; readonly of: readonly Condition[] }
  | { readonly op: 'not'; readonly of: Condition };

export interface ChoiceOption {
  readonly id: string;
  readonly label: string;
  readonly note?: string;
}

export type VariableDef =
  | {
      readonly kind: 'number';
      readonly id: VariableId;
      readonly label: string;
      readonly min: number;
      readonly max: number;
      readonly step: number;
      readonly fallback: number;
      readonly unit?: string;
      readonly help?: string;
    }
  | {
      readonly kind: 'choice';
      readonly id: VariableId;
      readonly label: string;
      readonly options: readonly ChoiceOption[];
      readonly fallback: string;
      readonly help?: string;
    };

export interface QuantityDef {
  readonly id: QuantityId;
  readonly label: string;
  readonly expr: Expr;
}

export type CostCategory =
  'venue' | 'food' | 'people' | 'things' | 'travel' | 'paperwork' | 'income';

export interface CostRule {
  readonly id: RuleId;
  readonly label: string;
  readonly category: CostCategory;
  readonly amount: Expr;
  /** Omitted means the line always applies. */
  readonly when?: Condition;
  /**
   * Days before the event by which this has to be settled. An expression when
   * the notice needed grows with the plan: a longer guest list takes longer to
   * print and post, a bigger order takes a caterer longer to accept.
   */
  readonly leadTimeDays: number | Expr;
  /** The decision this line belongs to, so several lines can move together. */
  readonly decision: string;
}

export interface ConstraintDef {
  readonly id: string;
  readonly severity: 'error' | 'warning';
  readonly when: Condition;
  readonly message: string;
  readonly hint: string;
}

export interface TaskDef {
  readonly id: string;
  readonly label: string;
  readonly when: Condition;
  readonly leadTimeDays: number | Expr;
}

/** A stretch of the day itself, scheduled backwards from the anchor moment. */
export interface ShowSegmentDef {
  readonly id: string;
  readonly label: string;
  readonly durationMin: number;
  readonly when?: Condition;
}

export type EventKind = 'wedding' | 'birthday' | 'community';

export interface EventPack {
  readonly kind: EventKind;
  readonly label: string;
  readonly blurb: string;
  /** The one fixed moment the day is built around. */
  readonly anchorLabel: string;
  readonly variables: readonly VariableDef[];
  readonly quantities: readonly QuantityDef[];
  readonly costRules: readonly CostRule[];
  readonly constraints: readonly ConstraintDef[];
  readonly tasks: readonly TaskDef[];
  readonly runOfShow: readonly ShowSegmentDef[];
}

export type VariableValue = number | string;
export type VariableValues = Readonly<Record<VariableId, VariableValue>>;

export type LineState = 'estimated' | 'quoted' | 'paid';

/** What a vendor actually promised, in their own words. */
export interface Commitment {
  readonly id: string;
  readonly ruleId: RuleId;
  readonly vendor: string;
  readonly amount: number;
  readonly state: Exclude<LineState, 'estimated'>;
  /** The source text the amount was read from, kept verbatim as evidence. */
  readonly quote: string;
  readonly inclusions: readonly string[];
  readonly exclusions: readonly string[];
}

export interface CostLine {
  readonly ruleId: RuleId;
  readonly label: string;
  readonly category: CostCategory;
  readonly decision: string;
  /** What the plan is worth now: the commitment if there is one, else the estimate. */
  readonly amount: number;
  readonly estimate: number;
  readonly state: LineState;
  /** How the estimate was reached, in words. */
  readonly basis: string;
  readonly leadTimeDays: number;
  readonly vendor?: string;
  readonly quote?: string;
}

export interface Violation {
  readonly id: string;
  readonly severity: 'error' | 'warning';
  readonly message: string;
  readonly hint: string;
}

export interface ActiveTask {
  readonly id: string;
  readonly label: string;
  readonly leadTimeDays: number;
}

export interface Deadline {
  readonly id: string;
  readonly label: string;
  readonly dateIso: string;
  readonly daysBefore: number;
  /** True once money has been paid against it, so the decision cannot be undone for free. */
  readonly locked: boolean;
}

export interface ScheduledSegment {
  readonly id: string;
  readonly label: string;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly durationMin: number;
}

export interface Totals {
  readonly all: number;
  readonly paid: number;
  readonly quoted: number;
  readonly estimated: number;
  /** Still estimated: the part of the plan that can be changed for free. */
  readonly movable: number;
}

export interface Model {
  readonly lines: readonly CostLine[];
  readonly totals: Totals;
  readonly violations: readonly Violation[];
  readonly tasks: readonly ActiveTask[];
  readonly deadlines: readonly Deadline[];
  readonly runOfShow: readonly ScheduledSegment[];
}
