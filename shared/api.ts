import { z } from 'zod';
import { eventKindSchema } from './plan';

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

export const describeRequestSchema = z.strictObject({
  text: userText,
  kind: eventKindSchema,
  /** The levers this pack offers, so the model can only answer in those terms. */
  variableIds: z.array(z.string().max(60)).max(40),
});

export const describeResponseSchema = z.strictObject({
  name: z.string().trim().max(60),
  place: z.string().trim().max(60),
  values: z.record(z.string().max(60), z.union([z.number(), z.string().max(60)])),
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
export type DescribeResponse = z.infer<typeof describeResponseSchema>;
export type Idea = z.infer<typeof ideaSchema>;
export type IdeasRequest = z.infer<typeof ideasRequestSchema>;
export type IdeasResponse = z.infer<typeof ideasResponseSchema>;

export const apiErrorSchema = z.object({
  error: z.object({ code: z.string(), message: z.string() }),
});
