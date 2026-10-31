// @vitest-environment node
import type { Request } from 'express';
import { describe, expect, it } from 'vitest';
import { clientKey } from './app.ts';
import { readConfig } from './config.ts';

/**
 * A rate limit is only worth the address it is keyed on. This server trusted
 * `x-forwarded-for` through Express's `trust proxy`, which reads the first
 * hop — the one the client writes. Measured against the running API, seventy
 * requests with a rotating header drew no refusals at all, and twenty
 * assistant calls against a limit of twelve drew none either.
 */
function request(forwarded?: string, socket = '203.0.113.9'): Request {
  return {
    headers: forwarded === undefined ? {} : { 'x-forwarded-for': forwarded },
    socket: { remoteAddress: socket },
  } as unknown as Request;
}

describe('clientKey', () => {
  describe('with no proxy in front', () => {
    it('keys on the connection, not on anything the client wrote', () => {
      const direct = clientKey(request(undefined), 0);

      expect(clientKey(request('10.0.0.1'), 0)).toBe(direct);
      expect(clientKey(request('10.0.0.2'), 0)).toBe(direct);
      expect(clientKey(request('10.0.0.3, 10.0.0.4'), 0)).toBe(direct);
    });
  });

  describe('with one proxy in front', () => {
    it('keys on the hop that proxy added', () => {
      // The proxy appends the address it saw; the client sent nothing.
      expect(clientKey(request('198.51.100.7'), 1)).toBe(clientKey(request('198.51.100.7'), 1));
      expect(clientKey(request('198.51.100.7'), 1)).not.toBe(clientKey(request('198.51.100.8'), 1));
    });

    it('ignores whatever the client put in front of it', () => {
      const real = clientKey(request('198.51.100.7'), 1);

      // The same client, rotating the only part of the header it controls.
      expect(clientKey(request('1.1.1.1, 198.51.100.7'), 1)).toBe(real);
      expect(clientKey(request('2.2.2.2, 198.51.100.7'), 1)).toBe(real);
      expect(clientKey(request('3.3.3.3, 4.4.4.4, 198.51.100.7'), 1)).toBe(real);
    });

    it('falls back to the connection when the header is missing or empty', () => {
      const direct = clientKey(request(undefined), 0);

      expect(clientKey(request(undefined), 1)).toBe(direct);
      expect(clientKey(request('   '), 1)).toBe(direct);
      expect(clientKey(request(' , , '), 1)).toBe(direct);
    });
  });

  describe('with two proxies in front', () => {
    it('counts back past both of them', () => {
      const real = clientKey(request('198.51.100.7, 10.0.0.1'), 2);

      expect(clientKey(request('9.9.9.9, 198.51.100.7, 10.0.0.1'), 2)).toBe(real);
    });
  });

  it('collapses an IPv6 address to its prefix, so a client cannot walk its own range', () => {
    const one = clientKey(request('2001:db8:abcd:0012::1'), 1);
    const two = clientKey(request('2001:db8:abcd:0012::2'), 1);
    const elsewhere = clientKey(request('2001:db8:9999:0012::1'), 1);

    // A whole /56 shares one budget: an address is cheap, a prefix is not.
    expect(one).toBe(two);
    expect(one).not.toBe(elsewhere);
  });

  describe('how many hops to trust', () => {
    it('trusts none of them unless told otherwise', () => {
      expect(readConfig({}).trustedProxyHops).toBe(0);
    });

    it('trusts one on Vercel, which puts exactly one proxy in front', () => {
      expect(readConfig({ VERCEL: '1' }).trustedProxyHops).toBe(1);
    });

    it('takes a stated number over either default', () => {
      expect(readConfig({ TRUSTED_PROXY_HOPS: '2' }).trustedProxyHops).toBe(2);
      expect(readConfig({ VERCEL: '1', TRUSTED_PROXY_HOPS: '0' }).trustedProxyHops).toBe(0);
    });

    it('ignores a number that is not one', () => {
      expect(readConfig({ TRUSTED_PROXY_HOPS: 'lots' }).trustedProxyHops).toBe(0);
      expect(readConfig({ TRUSTED_PROXY_HOPS: '-1' }).trustedProxyHops).toBe(0);
    });
  });
});
