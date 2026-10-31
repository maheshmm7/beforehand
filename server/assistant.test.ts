// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

/**
 * The retry chain is the least visible and most failure-prone code in the
 * server: three attempts, two of which only happen under conditions a live
 * model produces rarely. Every path through it is driven here against a
 * stand-in for the SDK.
 */

interface Request {
  readonly model: string;
  readonly config: { readonly responseSchema?: unknown; readonly thinkingConfig?: unknown };
}

let reply: (request: Request) => Promise<{ text?: string }>;
let seen: Request[] = [];

vi.mock('@google/genai', () => ({
  ThinkingLevel: { LOW: 'LOW' },
  GoogleGenAI: class {
    models = {
      generateContent: async (request: Request): Promise<{ text?: string }> => {
        seen.push(request);
        return reply(request);
      },
    };
  },
}));

const { createAssistant } = await import('./gemini.ts');
const { readConfig } = await import('./config.ts');
const { HttpError } = await import('./errors.ts');

const schema = z.strictObject({ vendor: z.string(), amount: z.number() });
const good = '{"vendor":"Lotus","amount":165000}';

function ask(env: Record<string, string> = {}): Promise<z.infer<typeof schema>> {
  // secret-scan-allow: a fixture, not a credential
  const assistant = createAssistant(readConfig({ GEMINI_API_KEY: 'test-key-value', ...env }));
  if (assistant === undefined) throw new Error('the assistant should exist with a key');
  return assistant.ask({ instruction: 'be brief', prompt: 'a quote', schema });
}

function failWith(status: number): Error {
  return Object.assign(new Error(`status ${String(status)}`), { status });
}

beforeEach(() => {
  seen = [];
  reply = () => Promise.resolve({ text: good });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('the assistant', () => {
  it('writes the upstream reason to the server log, with the key scrubbed', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    reply = () =>
      Promise.reject(
        // secret-scan-allow: a fixture, not a credential
        Object.assign(new Error('API key not valid: test-key-value'), { status: 400 }),
      );

    await expect(ask()).rejects.toBeInstanceOf(HttpError);

    const written = warn.mock.calls.map((call) => String(call[0])).join(' ');
    // Enough to tell a revoked key from a retired model, which the stable
    // code the client gets cannot say.
    expect(written).toContain('API key not valid');
    // secret-scan-allow: a fixture, not a credential
    expect(written).not.toContain('test-key-value');
    expect(written).toContain('[key]');
    warn.mockRestore();
  });

  it('asks once, with a schema, when the model answers', async () => {
    await expect(ask()).resolves.toEqual({ vendor: 'Lotus', amount: 165000 });

    expect(seen).toHaveLength(1);
    expect(seen[0]?.model).toBe('gemini-3.6-flash');
    expect(seen[0]?.config.responseSchema).toBeDefined();
  });

  it('asks the older model to think less, because it bills for it', async () => {
    await ask({ GEMINI_MODEL: 'gemini-2.5-flash' });

    expect(seen[0]?.config.thinkingConfig).toEqual({ thinkingBudget: 0 });
  });

  it('asks the current model for the lowest thinking level instead', async () => {
    await ask();

    expect(seen[0]?.config.thinkingConfig).toEqual({ thinkingLevel: 'LOW' });
  });

  it('drops the schema and asks again when the model refuses it', async () => {
    let calls = 0;
    reply = () => {
      calls += 1;
      if (calls === 1) return Promise.reject(failWith(400));
      return Promise.resolve({ text: `here you go ${good} — hope that helps` });
    };

    await expect(ask()).resolves.toEqual({ vendor: 'Lotus', amount: 165000 });

    expect(seen).toHaveLength(2);
    expect(seen[1]?.model).toBe('gemini-3.6-flash');
    expect(seen[1]?.config.responseSchema).toBeUndefined();
  });

  it('never drops the schema when nothing refused it', async () => {
    let calls = 0;
    reply = () => {
      calls += 1;
      if (calls === 1) return Promise.resolve({ text: 'I would rather not answer that.' });
      return Promise.resolve({ text: good });
    };

    await expect(ask()).resolves.toEqual({ vendor: 'Lotus', amount: 165000 });

    // Straight to the steadier model: the plain-JSON retry is only for a
    // schema that was refused.
    expect(seen).toHaveLength(2);
    expect(seen[1]?.model).toBe('gemini-3.5-flash');
    expect(seen[1]?.config.responseSchema).toBeDefined();
  });

  it('falls back to the steadier model when the primary is overloaded', async () => {
    let calls = 0;
    reply = () => {
      calls += 1;
      if (calls === 1) return Promise.reject(failWith(503));
      return Promise.resolve({ text: good });
    };

    await expect(ask()).resolves.toEqual({ vendor: 'Lotus', amount: 165000 });

    expect(seen).toHaveLength(2);
    expect(seen[1]?.model).toBe('gemini-3.5-flash');
  }, 10_000);

  it('reads an overload reported as a code rather than a status', async () => {
    let calls = 0;
    reply = () => {
      calls += 1;
      if (calls === 1) return Promise.reject(Object.assign(new Error('busy'), { code: 429 }));
      return Promise.resolve({ text: good });
    };

    await expect(ask()).resolves.toEqual({ vendor: 'Lotus', amount: 165000 });
    expect(seen).toHaveLength(2);
  }, 10_000);

  it('gives up as unavailable when every attempt fails', async () => {
    reply = () => Promise.reject(failWith(503));

    await expect(ask()).rejects.toMatchObject({ code: 'ai_unavailable' });
    expect(seen).toHaveLength(2);
  }, 10_000);

  it('gives up as unreadable when the last reply still is not json', async () => {
    reply = () => Promise.resolve({ text: 'no json anywhere in this reply' });

    await expect(ask()).rejects.toMatchObject({ code: 'ai_unreadable' });
    expect(seen).toHaveLength(2);
  });

  it('refuses a reply that parses but does not match the contract', async () => {
    reply = () => Promise.resolve({ text: '{"vendor":"Lotus"}' });

    await expect(ask()).rejects.toBeInstanceOf(HttpError);
  });

  it('treats a missing body as a reply it cannot read', async () => {
    reply = () => Promise.resolve({});

    await expect(ask()).rejects.toMatchObject({ code: 'ai_unreadable' });
  });

  it('does not retry an error the model raised about the request itself', async () => {
    let calls = 0;
    reply = () => {
      calls += 1;
      if (calls === 1) return Promise.resolve({ text: 'not json' });
      return Promise.reject(failWith(401));
    };

    // The first reply is unreadable so it tries again; the second failure is
    // the last attempt, so it is reported rather than retried.
    await expect(ask()).rejects.toMatchObject({ code: 'ai_unavailable' });
    expect(seen).toHaveLength(2);
  });
});
