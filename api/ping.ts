import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * A function with no imports of its own, to tell two failures apart: a
 * platform that cannot run this project's TypeScript functions at all, and
 * one that cannot resolve what `index.ts` pulls in. Delete it once the
 * question is settled.
 */
export default function handler(_request: IncomingMessage, response: ServerResponse): void {
  response.statusCode = 200;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.end(
    JSON.stringify({
      ok: true,
      language: 'typescript',
      node: process.version,
      imports: 'none',
    }),
  );
}
