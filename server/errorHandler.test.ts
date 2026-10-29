// @vitest-environment node
import { type Request, type Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { errorHandler } from './errorHandler';
import { HttpError, errorBody } from './errors';

function fakeResponse(headersSent = false): Response & {
  body: unknown;
  statusCode: number;
} {
  const res = {
    headersSent,
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res as unknown as Response & { body: unknown; statusCode: number };
}

const request = {} as Request;

describe('errorHandler', () => {
  it('answers an HttpError with its own code', () => {
    const res = fakeResponse();

    errorHandler(new HttpError('ai_unavailable'), request, res, vi.fn());

    expect(res.statusCode).toBe(503);
    expect(res.body).toEqual(errorBody('ai_unavailable'));
  });

  it('turns an oversized body into payload_too_large', () => {
    const res = fakeResponse();

    errorHandler({ type: 'entity.too.large' }, request, res, vi.fn());

    expect(res.statusCode).toBe(413);
  });

  it('turns a malformed body into bad_request', () => {
    const res = fakeResponse();

    errorHandler({ type: 'entity.parse.failed' }, request, res, vi.fn());

    expect(res.statusCode).toBe(400);
  });

  it('falls back to internal for anything else, leaking nothing', () => {
    const res = fakeResponse();

    errorHandler(new Error('connect ECONNREFUSED 10.0.0.4:443'), request, res, vi.fn());

    expect(res.statusCode).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain('ECONNREFUSED');
  });

  it('hands the error on once the response has started', () => {
    const res = fakeResponse(true);
    const next = vi.fn();
    const original = new Error('late');

    errorHandler(original, request, res, next);

    expect(next).toHaveBeenCalledWith(original);
    expect(res.statusCode).toBe(0);
  });
});
