import { z } from 'zod';
import { eventKindSchema } from './plan.ts';

/**
 * One schema per exchange, shared by the browser, the server and the model's
 * response format. The server validates what the model returns against the
 * same shape the client is promised, so a creative reply fails closed.
 */

const userText = z.string().trim().min(1).max(4000);

export const readQuoteRequestSchema = z.strictObject({
  text: userText,
  /** What the planner was looking at, so the model knows what it is reading. */
  lineLabel: z.string().trim().min(1).max(80),
});

export const readQuoteResponseSchema = z.strictObject({
  vendor: z.string().trim().max(80),
  amount: z.number().min(0).max(100_000_000),
  inclusions: z.array(z.string().trim().max(120)).max(12),
  exclusions: z.array(z.string().trim().max(120)).max(12),
  /** The sentence the amount was read from, so the planner can check it. */
  evidence: z.string().trim().max(400),
});

/** A lever as the model needs to see it: the options matter as much as the id,
 *  because it can only answer in terms it has been given. */
export const describeLeverSchema = z.strictObject({
  id: z.string().max(60),
  label: z.string().max(80),
  kind: z.enum(['number', 'choice']),
  range: z.string().max(40).optional(),
  options: z.array(z.string().max(80)).max(16).optional(),
});

export const describeRequestSchema = z.strictObject({
  text: userText,
  kind: eventKindSchema,
  /** The levers this pack offers, so the model can only answer in those terms. */
  levers: z.array(describeLeverSchema).max(40),
});

/** One setting the model understood, always as text. The client turns it into
 *  a number or an option using the pack, which is the only thing that knows. */
export const describeSettingSchema = z.strictObject({
  id: z.string().trim().max(60),
  value: z.string().trim().max(60),
});

export const describeResponseSchema = z.strictObject({
  name: z.string().trim().max(60),
  place: z.string().trim().max(60),
  settings: z.array(describeSettingSchema).max(40),
  notes: z.array(z.string().trim().max(200)).max(6),
});

export const ideaSchema = z.strictObject({
  title: z.string().trim().min(1).max(80),
  why: z.string().trim().max(240),
  estimatedCost: z.number().min(0).max(10_000_000),
  leadTimeDays: z.number().int().min(0).max(365),
});

export const ideasRequestSchema = z.strictObject({
  kind: eventKindSchema,
  /** A short, already-redacted summary of the plan. Never the whole plan. */
  summary: z.string().trim().min(1).max(1200),
  headroom: z.number().min(-100_000_000).max(100_000_000),
});

export const ideasResponseSchema = z.strictObject({
  ideas: z.array(ideaSchema).max(6),
});

export type ReadQuoteRequest = z.infer<typeof readQuoteRequestSchema>;
export type ReadQuoteResponse = z.infer<typeof readQuoteResponseSchema>;
export type DescribeRequest = z.infer<typeof describeRequestSchema>;
export type DescribeLever = z.infer<typeof describeLeverSchema>;
export type DescribeResponse = z.infer<typeof describeResponseSchema>;
export type DescribeSetting = z.infer<typeof describeSettingSchema>;
export type Idea = z.infer<typeof ideaSchema>;
export type IdeasRequest = z.infer<typeof ideasRequestSchema>;
export type IdeasResponse = z.infer<typeof ideasResponseSchema>;

export const apiErrorSchema = z.object({
  error: z.object({ code: z.string(), message: z.string() }),
});
