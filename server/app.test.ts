// @vitest-environment node
import { type AddressInfo } from 'node:net';
import { type Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createApp } from './app.ts';
import { readConfig } from './config.ts';

const ErrorBody = z.object({ error: z.object({ code: z.string(), message: z.string() }) });

let server: Server;
let origin: string;

beforeAll(async () => {
  const app = createApp(readConfig({}));
  server = await new Promise<Server>((resolve) => {
    const listening = app.listen(0, () => {
      resolve(listening);
    });
  });
  const address = server.address() as AddressInfo;
  origin = `http://127.0.0.1:${String(address.port)}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => {
    server.close(() => {
      resolve();
    });
  });
});

describe('api', () => {
  it('reports health and whether the assistant is configured', async () => {
    const response = await fetch(`${origin}/api/health`);

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({ status: 'ok', assistant: 'off' });
  });

  it('sends security headers and hides the framework', async () => {
    const response = await fetch(`${origin}/api/health`);

    expect(response.headers.get('x-powered-by')).toBeNull();
    expect(response.headers.get('content-security-policy')).toContain("default-src 'none'");
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('referrer-policy')).toBe('no-referrer');
  });

  it('answers an unknown api route with a stable code', async () => {
    const response = await fetch(`${origin}/api/nope`);

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: { code: 'not_found', message: 'No such endpoint.' },
    });
  });

  it('rejects a body larger than the limit', async () => {
    const response = await fetch(`${origin}/api/health`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ blob: 'x'.repeat(64 * 1024) }),
    });

    expect(response.status).toBe(413);
    expect(ErrorBody.parse(await response.json()).error.code).toBe('payload_too_large');
  });

  it('rejects a malformed json body', async () => {
    const response = await fetch(`${origin}/api/health`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{not json',
    });

    expect(response.status).toBe(400);
    expect(ErrorBody.parse(await response.json()).error.code).toBe('bad_request');
  });
});
