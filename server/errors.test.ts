// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { ERROR_CODES, HttpError, errorBody, statusFor } from './errors.ts';

describe('errors', () => {
  it('maps every code to a status and a message', () => {
    for (const code of ERROR_CODES) {
      expect(statusFor(code)).toBeGreaterThanOrEqual(400);
      expect(errorBody(code).error.message.length).toBeGreaterThan(0);
    }
  });

  it('never leaks an upstream message through the body', () => {
    for (const code of ERROR_CODES) {
      const body = errorBody(code);
      expect(Object.keys(body.error).sort()).toEqual(['code', 'message']);
      expect(body.error.code).toBe(code);
    }
  });

  it('carries its code on the thrown error', () => {
    const error = new HttpError('rate_limited');

    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe('rate_limited');
    expect(error.name).toBe('HttpError');
  });
});
