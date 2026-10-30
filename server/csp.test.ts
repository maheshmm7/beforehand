// @vitest-environment node
import { readFileSync } from 'node:fs';
import { type AddressInfo } from 'node:net';
import { type Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createApp } from './app';
import { readConfig } from './config';

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
