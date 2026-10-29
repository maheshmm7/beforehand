import { type ErrorRequestHandler } from 'express';
import { HttpError, errorBody, statusFor } from './errors';

function bodyParserCode(error: unknown): 'payload_too_large' | 'bad_request' | undefined {
  if (typeof error !== 'object' || error === null || !('type' in error)) return undefined;
  const { type } = error;
  if (type === 'entity.too.large') return 'payload_too_large';
  if (typeof type === 'string' && type.startsWith('entity.')) return 'bad_request';
  return undefined;
}

/** The last word on every failure: a stable code, never a stack trace, never
 *  anything the upstream service said. */
export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof HttpError) {
    res.status(statusFor(error.code)).json(errorBody(error.code));
    return;
  }

  const parserCode = bodyParserCode(error);
  if (parserCode !== undefined) {
    res.status(statusFor(parserCode)).json(errorBody(parserCode));
    return;
  }

  res.status(statusFor('internal')).json(errorBody('internal'));
};
