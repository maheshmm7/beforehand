// @vitest-environment node
import { readFileSync } from 'node:fs';
import { type AddressInfo } from 'node:net';
import { type Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createApp } from './app.ts';
import { readConfig } from './config.ts';
import { SECURITY_HEADERS } from './securityHeaders.ts';

/**
 * The policy is declared twice: Helmet serves it for the API, and vercel.json
 * serves it for the static files. Nothing stops the two drifting apart except
 * this test.
 */

const vercelSchema = z.object({
  headers: z.array(
    z.object({
      source: z.string(),
      headers: z.array(z.object({ key: z.string(), value: z.string() })),
    }),
  ),
});

function directives(policy: string): Map<string, string> {
  return new Map(
    policy
      .split(';')
      .map((part) => part.trim())
      .filter((part) => part !== '')
      .map((part) => {
        const [name, ...rest] = part.split(/\s+/);
        return [name ?? '', rest.join(' ')] as const;
      }),
  );
}

let server: Server;
let origin = '';

beforeAll(async () => {
  const app = createApp(readConfig({}), undefined);
  server = await new Promise<Server>((resolve) => {
    const listening = app.listen(0, () => {
      resolve(listening);
    });
  });
  origin = `http://127.0.0.1:${String((server.address() as AddressInfo).port)}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => {
    server.close(() => {
      resolve();
    });
  });
});

function normalise(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

describe('the security headers', () => {
  it('are all present on the api, with the agreed values', async () => {
    const response = await fetch(`${origin}/api/health`);

    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      expect(normalise(response.headers.get(name) ?? ''), name).toBe(normalise(value));
    }
  });

  it('are all present on the static host, with the same values', () => {
    const config = vercelSchema.parse(JSON.parse(readFileSync('vercel.json', 'utf8')));
    const served = new Map(
      config.headers
        .filter((entry) => entry.source === '/(.*)')
        .flatMap((entry) => entry.headers)
        .map((header) => [header.key.toLowerCase(), header.value] as const),
    );

    // Set in two files, so the only thing stopping them drifting is this.
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      expect(normalise(served.get(name) ?? ''), name).toBe(normalise(value));
    }
  });
});

describe('content security policy', () => {
  it('is identical in the API and in the hosting configuration', async () => {
    const served = (await fetch(`${origin}/api/health`)).headers.get('content-security-policy');
    expect(served).not.toBeNull();

    const config = vercelSchema.parse(JSON.parse(readFileSync('vercel.json', 'utf8')));
    const hosted = config.headers
      .flatMap((entry) => entry.headers)
      .find((header) => header.key === 'Content-Security-Policy');
    expect(hosted).toBeDefined();

    expect(Object.fromEntries(directives(served ?? ''))).toEqual(
      Object.fromEntries(directives(hosted?.value ?? '')),
    );
  });

  it('allows nothing by default and no inline script', async () => {
    const served = directives(
      (await fetch(`${origin}/api/health`)).headers.get('content-security-policy') ?? '',
    );

    expect(served.get('default-src')).toBe("'none'");
    expect(served.get('script-src')).toBe("'self'");
    expect(served.get('frame-ancestors')).toBe("'none'");
    expect(served.get('object-src')).toBe("'none'");
  });

  it('permits inline style attributes but not inline style elements', async () => {
    const served = directives(
      (await fetch(`${origin}/api/health`)).headers.get('content-security-policy') ?? '',
    );

    expect(served.get('style-src')).toBe("'self'");
    expect(served.get('style-src-attr')).toBe("'unsafe-inline'");
  });
});
