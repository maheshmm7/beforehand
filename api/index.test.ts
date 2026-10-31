// @vitest-environment node
import type { IncomingMessage, ServerResponse } from 'node:http';
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * The serverless entry is the one piece of this server that only ever runs
 * on the deployment, which is exactly where a fault is hardest to see: the
 * platform answers a generic invocation error and names nothing. What it
 * does when the application cannot be built is therefore worth pinning.
 */
let fails: false | 'error' = false;

vi.mock('../server/app.ts', () => ({
  createApp: () => {
    if (fails === 'error') throw new Error('GEMINI_API_KEY is shaped wrong');
    const app = (_request: IncomingMessage, response: ServerResponse): void => {
      response.statusCode = 200;
      response.end('served by the application');
    };
    return app;
  },
}));

vi.mock('../server/config.ts', () => ({ readConfig: () => ({}) }));

function reply(): { res: ServerResponse; body: () => string; status: () => number } {
  let body = '';
  let status = 0;
  const res = {
    set statusCode(value: number) {
      status = value;
    },
    get statusCode() {
      return status;
    },
    setHeader: () => undefined,
    end: (chunk?: string) => {
      body = chunk ?? '';
    },
  } as unknown as ServerResponse;
  return { res, body: () => body, status: () => status };
}

type Handler = (request: IncomingMessage, response: ServerResponse) => void;

async function load(broken: false | 'error'): Promise<Handler> {
  fails = broken;
  vi.resetModules();
  const mod = await import('./index.ts');
  return mod.default;
}

afterEach(() => {
  fails = false;
});

describe('the serverless entry', () => {
  it('hands the request to the application when it was built', async () => {
    const handler = await load(false);
    const { res, body, status } = reply();

    handler({ url: '/api/health' } as IncomingMessage, res);

    expect(status()).toBe(200);
    expect(body()).toBe('served by the application');
  });

  it('says on the health route why it could not start', async () => {
    const handler = await load('error');
    const { res, body, status } = reply();

    handler({ url: '/api/health' } as IncomingMessage, res);

    expect(status()).toBe(503);
    const reported: unknown = JSON.parse(body());
    expect(reported).toMatchObject({ status: 'error', assistant: 'off' });
    // The reason is the point: the platform's own error names nothing.
    expect(JSON.stringify(reported)).toContain('GEMINI_API_KEY is shaped wrong');
  });

  it('treats a request with no path as one of the other routes', async () => {
    const handler = await load('error');
    const { res, body, status } = reply();

    handler({} as IncomingMessage, res);

    expect(status()).toBe(503);
    expect(body()).toContain('ai_unavailable');
  });

  it('tells every other route a stable code and nothing more', async () => {
    const handler = await load('error');
    const { res, body, status } = reply();

    handler({ url: '/api/ideas' } as IncomingMessage, res);

    expect(status()).toBe(503);
    expect(body()).toContain('ai_unavailable');
    // No reason here: only the route whose job is to report one gets it.
    expect(body()).not.toContain('GEMINI_API_KEY');
  });
});
