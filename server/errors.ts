/** Stable, non-revealing error codes. The client maps these to wording; the
 *  response body never carries a stack trace or an upstream message. */
export const ERROR_CODES = [
  'bad_request',
  'payload_too_large',
  'rate_limited',
  'ai_unavailable',
  'ai_unreadable',
  'not_found',
  'internal',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export interface ApiError {
  readonly error: { readonly code: ErrorCode; readonly message: string };
}

const STATUS: Readonly<Record<ErrorCode, number>> = {
  bad_request: 400,
  payload_too_large: 413,
  rate_limited: 429,
  ai_unavailable: 503,
  ai_unreadable: 502,
  not_found: 404,
  internal: 500,
};

const MESSAGE: Readonly<Record<ErrorCode, string>> = {
  bad_request: 'That request did not match what this endpoint accepts.',
  payload_too_large: 'That request body is larger than this endpoint accepts.',
  rate_limited: 'Too many requests from this address. Try again shortly.',
  ai_unavailable: 'The planning assistant is not configured or not reachable right now.',
  ai_unreadable: 'The assistant replied in a shape this server could not verify.',
  not_found: 'No such endpoint.',
  internal: 'Something went wrong on the server.',
};

export function statusFor(code: ErrorCode): number {
  return STATUS[code];
}

export function errorBody(code: ErrorCode): ApiError {
  return { error: { code, message: MESSAGE[code] } };
}

export class HttpError extends Error {
  readonly code: ErrorCode;

  constructor(code: ErrorCode) {
    super(code);
    this.name = 'HttpError';
    this.code = code;
  }
}
