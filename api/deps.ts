import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * Loads each thing `index.ts` depends on, one at a time, and reports which
 * one fails. The platform's invocation error names nothing, and the function
 * dies before any of its own code runs, so the only way to find the import
 * that kills it is to try them separately.
 *
 * Every specifier is a literal, so a bundler can still see them. Goes as soon
 * as the question is settled.
 */
async function attempt(load: () => Promise<unknown>): Promise<string> {
  try {
    await load();
    return 'ok';
  } catch (error) {
    return error instanceof Error ? `${error.name}: ${error.message}`.slice(0, 240) : 'failed';
  }
}

export default async function handler(
  _request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  const checked: Record<string, string> = {
    express: await attempt(() => import('express')),
    helmet: await attempt(() => import('helmet')),
    'express-rate-limit': await attempt(() => import('express-rate-limit')),
    zod: await attempt(() => import('zod')),
    '@google/genai': await attempt(() => import('@google/genai')),
    'shared/plan': await attempt(() => import('../shared/plan.ts')),
    'shared/engine': await attempt(() => import('../shared/engine/index.ts')),
    'server/config': await attempt(() => import('../server/config.ts')),
    'server/securityHeaders': await attempt(() => import('../server/securityHeaders.ts')),
    'server/gemini': await attempt(() => import('../server/gemini.ts')),
    'server/routes': await attempt(() => import('../server/routes.ts')),
    'server/app': await attempt(() => import('../server/app.ts')),
  };

  response.statusCode = 200;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify({ node: process.version, checked }, null, 2));
}
