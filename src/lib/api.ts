import type { z } from 'zod';
import {
  apiErrorSchema,
  describeResponseSchema,
  ideasResponseSchema,
  readQuoteResponseSchema,
  type DescribeRequest,
  type DescribeResponse,
  type IdeasRequest,
  type IdeasResponse,
  type ReadQuoteRequest,
  type ReadQuoteResponse,
} from '@shared/api';

export type ApiResult<T> = { ok: true; value: T } | { ok: false; message: string };

const MESSAGES: Readonly<Record<string, string>> = {
  ai_unavailable: 'The assistant is switched off on this deployment. Everything else still works.',
  ai_unreadable: 'The assistant replied with something this app could not verify. Nothing changed.',
  rate_limited: 'Too many requests just now. Give it a moment.',
  payload_too_large: 'That is longer than this can accept. Try a shorter extract.',
  bad_request: 'That request did not look right. Nothing was sent.',
};

async function post<T>(
  path: string,
  body: unknown,
  schema: z.ZodType<T>,
  signal?: AbortSignal,
): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: signal ?? null,
    });
  } catch {
    return { ok: false, message: 'Could not reach the server. Check your connection.' };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return { ok: false, message: 'The server sent something unreadable.' };
  }

  if (!response.ok) {
    const parsed = apiErrorSchema.safeParse(payload);
    const code = parsed.success ? parsed.data.error.code : 'internal';
    return { ok: false, message: MESSAGES[code] ?? 'Something went wrong. Nothing changed.' };
  }

  const parsed = schema.safeParse(payload);
  return parsed.success
    ? { ok: true, value: parsed.data }
    : { ok: false, message: MESSAGES.ai_unreadable ?? 'Unreadable reply.' };
}

export function readQuote(
  request: ReadQuoteRequest,
  signal?: AbortSignal,
): Promise<ApiResult<ReadQuoteResponse>> {
  return post('/api/quote', request, readQuoteResponseSchema, signal);
}

export function describePlan(
  request: DescribeRequest,
  signal?: AbortSignal,
): Promise<ApiResult<DescribeResponse>> {
  return post('/api/describe', request, describeResponseSchema, signal);
}

export function suggestIdeas(
  request: IdeasRequest,
  signal?: AbortSignal,
): Promise<ApiResult<IdeasResponse>> {
  return post('/api/ideas', request, ideasResponseSchema, signal);
}
