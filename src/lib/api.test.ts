import { afterEach, describe, expect, it, vi } from 'vitest';
import { describePlan, readQuote, suggestIdeas } from './api';

function reply(status: number, body: unknown): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve({
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(body),
      }),
    ),
  );
}

const goodQuote = {
  vendor: 'Lotus',
  amount: 165000,
  inclusions: [],
  exclusions: [],
  evidence: 'all in',
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the api client', () => {
  it('returns what the server sent when it matches the contract', async () => {
    reply(200, goodQuote);

    const result = await readQuote({ text: 'x', lineLabel: 'Venue' });

    expect(result).toEqual({ ok: true, value: goodQuote });
  });

  it('posts json to the right path', async () => {
    reply(200, goodQuote);

    await readQuote({ text: 'x', lineLabel: 'Venue' });

    expect(fetch).toHaveBeenCalledWith(
      '/api/quote',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ text: 'x', lineLabel: 'Venue' }),
      }),
    );
  });

  it('turns a known error code into words a person can act on', async () => {
    reply(503, { error: { code: 'ai_unavailable', message: 'off' } });

    const result = await readQuote({ text: 'x', lineLabel: 'Venue' });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain('switched off');
  });

  it('falls back to a plain message for a code it does not know', async () => {
    reply(500, { error: { code: 'something_new', message: 'x' } });

    const result = await readQuote({ text: 'x', lineLabel: 'Venue' });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain('Something went wrong');
  });

  it('refuses a success body that does not match the contract', async () => {
    reply(200, { vendor: 'Lotus' });

    const result = await readQuote({ text: 'x', lineLabel: 'Venue' });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain('could not verify');
  });

  it('reports a network failure rather than throwing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))),
    );

    const result = await readQuote({ text: 'x', lineLabel: 'Venue' });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain('Could not reach the server');
  });

  it('reports an unreadable body rather than throwing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.reject(new Error('not json')),
        }),
      ),
    );

    const result = await readQuote({ text: 'x', lineLabel: 'Venue' });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain('could not verify');
  });

  it('says nothing answered when the gateway returns a page instead of json', async () => {
    // What a dev proxy sends when the api behind it is not running: a 500
    // with an HTML body. Blaming the reply sends people looking in the wrong
    // place; the api simply is not there.
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.reject(new Error('Unexpected token <')),
        }),
      ),
    );

    const result = await describePlan({ text: 'x', kind: 'birthday', levers: [] });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain('not answering');
  });

  it('carries the describe and ideas contracts too', async () => {
    reply(200, { name: 'A', place: 'B', settings: [{ id: 'guests', value: '350' }], notes: [] });
    const described = await describePlan({
      text: 'x',
      kind: 'wedding',
      levers: [{ id: 'guests', label: 'Guests', kind: 'number', range: '50 to 800' }],
    });
    expect(described.ok).toBe(true);

    reply(200, { ideas: [] });
    const ideas = await suggestIdeas({ kind: 'wedding', summary: 'x', headroom: 1 });
    expect(ideas).toEqual({ ok: true, value: { ideas: [] } });
  });
});
