import { Router, type Request, type Response } from 'express';
import type { z } from 'zod';
import {
  describeRequestSchema,
  describeResponseSchema,
  ideasRequestSchema,
  ideasResponseSchema,
  readQuoteRequestSchema,
  readQuoteResponseSchema,
} from '../shared/api.ts';
import { redact } from '../shared/redact.ts';
import type { Assistant } from './gemini.ts';
import { fence } from './gemini.ts';
import { HttpError } from './errors.ts';

/** Parses a body against the contract, or refuses it. Unknown fields are
 *  rejected by the schemas themselves. */
function body<T>(request: Request, schema: z.ZodType<T>): T {
  const parsed = schema.safeParse(request.body);
  if (!parsed.success) throw new HttpError('bad_request');
  return parsed.data;
}

const QUOTE_INSTRUCTION = [
  'You read a single message from an events vendor and report what was promised.',
  'Report only what the message states. Never invent a price, a name or a term.',
  'amount is the total in rupees as a plain number, with no symbol and no separators.',
  'If the message gives a per-unit price and a quantity, multiply them for the total.',
  'If no total can be worked out, return 0.',
  'inclusions and exclusions are short phrases, at most 12 of each.',
  'evidence is the single sentence the amount came from, copied exactly, under 400 characters.',
  'If the vendor is not named, return an empty string.',
].join(' ');

const DESCRIBE_INSTRUCTION = [
  'You turn a description of an event into settings for a planning tool.',
  'You are given the settings that exist and the values each one accepts. Use only those ids, and for a choice use only the exact option id shown before the bracket.',
  'Omit any setting the description does not support. Never guess a budget.',
  'Numbers must be plain numbers. Choice settings take one of the ids listed for them.',
  'settings is a list of {id, value} pairs. value is always text: a plain number for a number setting, or the exact option id for a choice.',
  'name is a short title for the plan, or an empty string.',
  'place is a city or venue, or an empty string.',
  'notes holds at most 6 short remarks about what you could not determine.',
].join(' ');

const IDEAS_INSTRUCTION = [
  'You suggest practical additions to an event that is already being planned.',
  'Every suggestion must fit inside the stated headroom in rupees. Suggest nothing above it.',
  'Give at most 5. Prefer specific, bookable things over themes or moods.',
  'estimatedCost is a plain number in rupees. leadTimeDays is whole days of notice needed.',
  'why is one sentence saying what it adds for this particular event, under 240 characters.',
  'Suggest nothing that needs more notice than the event allows.',
].join(' ');

export function createRoutes(assistant: Assistant | undefined): Router {
  const router = Router();

  const need = (): Assistant => {
    if (assistant === undefined) throw new HttpError('ai_unavailable');
    return assistant;
  };

  router.post('/quote', (request: Request, response: Response, next) => {
    void (async () => {
      try {
        const input = body(request, readQuoteRequestSchema);
        // Redacted in the browser already; done again because that can be bypassed.
        const result = await need().ask({
          instruction: QUOTE_INSTRUCTION,
          prompt: [
            `The planner is recording a price for: ${redact(input.lineLabel)}.`,
            fence('vendor message', redact(input.text)),
          ].join('\n\n'),
          schema: readQuoteResponseSchema,
        });
        response.json(result);
      } catch (error) {
        next(error);
      }
    })();
  });

  router.post('/describe', (request: Request, response: Response, next) => {
    void (async () => {
      try {
        const input = body(request, describeRequestSchema);
        const result = await need().ask({
          instruction: DESCRIBE_INSTRUCTION,
          prompt: [
            `Event type: ${input.kind}.`,
            'Settings that exist, with the values each one accepts:',
            input.levers
              .map((lever) =>
                lever.kind === 'number'
                  ? `- ${lever.id} (${lever.label}): a number from ${lever.range ?? 'any'}`
                  : `- ${lever.id} (${lever.label}): one of ${(lever.options ?? []).join(', ')}`,
              )
              .join('\n'),
            fence('description', redact(input.text)),
          ].join('\n\n'),
          schema: describeResponseSchema,
        });
        // Only settings this pack actually has are passed back to the client.
        const allowed = new Set(input.levers.map((lever) => lever.id));
        const settings = result.settings.filter((setting) => allowed.has(setting.id));
        response.json({ ...result, settings });
      } catch (error) {
        next(error);
      }
    })();
  });

  router.post('/ideas', (request: Request, response: Response, next) => {
    void (async () => {
      try {
        const input = body(request, ideasRequestSchema);
        const result = await need().ask({
          instruction: IDEAS_INSTRUCTION,
          prompt: [
            `Event type: ${input.kind}.`,
            `Headroom in rupees: ${String(Math.round(input.headroom))}.`,
            fence('plan summary', redact(input.summary)),
          ].join('\n\n'),
          schema: ideasResponseSchema,
        });
        // The model is asked to respect the headroom; this enforces it.
        const ideas = result.ideas
          .filter((idea) => idea.estimatedCost <= Math.max(input.headroom, 0))
          .slice(0, 5);
        response.json({ ideas });
      } catch (error) {
        next(error);
      }
    })();
  });

  return router;
}
