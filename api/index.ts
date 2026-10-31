import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApp } from '../server/app';
import { readConfig } from '../server/config';

/**
 * One serverless function serves every /api route.
 *
 * The application is built once per cold start. If that build throws, the
 * platform reports nothing but a generic invocation failure, which leaves
 * whoever runs this with no way to tell a bad environment from a bad
 * dependency. So the failure is caught, written to the server log, and
 * reported on the health route — the one endpoint whose whole job is to say
 * whether this thing is working. Every other route still answers with a
 * stable code and nothing else.
 */
let app: ReturnType<typeof createApp> | undefined;
let bootError: string | undefined;

try {
  app = createApp(readConfig());
} catch (error) {
  bootError = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  console.error('api: could not start', error);
}

export default function handler(request: IncomingMessage, response: ServerResponse): void {
  if (app !== undefined) {
    app(request, response);
    return;
  }

  const body =
    request.url?.startsWith('/api/health') === true
      ? { status: 'error', assistant: 'off', reason: (bootError ?? 'unknown').slice(0, 300) }
      : { error: { code: 'ai_unavailable', message: 'The server is not available right now.' } };

  response.statusCode = 503;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(body));
}
