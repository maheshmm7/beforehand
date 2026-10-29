import { describe, expect, it } from 'vitest';
import { hasPersonalDetail, redact } from './redact';

describe('redact', () => {
  it('removes an email address', () => {
    expect(redact('write to ravi.kumar@example.com today')).toBe('write to [email] today');
  });

  it('removes an Indian mobile number, written either way', () => {
    expect(redact('call 9876543210')).toBe('call [phone]');
    expect(redact('call +91 9876543210')).toBe('call [phone]');
  });

  it('removes a long run of digits that could be an account', () => {
    expect(redact('a/c 1234 5678 9012 3456')).toBe('a/c [number]');
  });

  it('removes a link and an identifier', () => {
    expect(redact('see https://example.com/x')).toBe('see [link]');
    expect(redact('PAN ABCDE1234F')).toBe('PAN [id]');
  });

  it('leaves prices and ordinary words alone', () => {
    const text = '450 per plate for 350 guests, starters included';
    expect(redact(text)).toBe(text);
  });

  it('reports whether anything would be removed', () => {
    expect(hasPersonalDetail('450 a plate')).toBe(false);
    expect(hasPersonalDetail('ring me on 9876543210')).toBe(true);
  });
});
