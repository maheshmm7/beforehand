// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readConfig } from './config.ts';

describe('readConfig', () => {
  it('falls back to defaults when nothing is set', () => {
    const config = readConfig({});

    expect(config.geminiApiKey).toBeUndefined();
    expect(config.model).toBe('gemini-3.6-flash');
    expect(config.fallbackModel).toBe('gemini-3.5-flash');
    expect(config.port).toBe(8787);
    expect(config.isProduction).toBe(false);
  });

  it('treats a present but empty variable as absent', () => {
    const config = readConfig({
      GEMINI_API_KEY: '',
      GEMINI_MODEL: '   ',
      PORT: '',
    });

    expect(config.geminiApiKey).toBeUndefined();
    expect(config.model).toBe('gemini-3.6-flash');
    expect(config.port).toBe(8787);
  });

  it('trims the values it does accept', () => {
    // secret-scan-allow: a fixture, not a credential
    const config = readConfig({ GEMINI_API_KEY: '  a-real-looking-key  ' });

    expect(config.geminiApiKey).toBe('a-real-looking-key');
  });

  it('reads a numeric port and ignores a nonsense one', () => {
    expect(readConfig({ PORT: '3000' }).port).toBe(3000);
    expect(readConfig({ PORT: 'eighty' }).port).toBe(8787);
    expect(readConfig({ PORT: '-1' }).port).toBe(8787);
  });

  it('detects production', () => {
    expect(readConfig({ NODE_ENV: 'production' }).isProduction).toBe(true);
    expect(readConfig({ NODE_ENV: 'development' }).isProduction).toBe(false);
  });
});
