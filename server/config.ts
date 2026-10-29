import { z } from 'zod';

/** A variable that exists but is empty is treated as absent. An empty string
 *  in a hosting dashboard is the most common way to break a strict config. */
const presentString = z
  .string()
  .transform((value) => value.trim())
  .refine((value) => value.length > 0)
  .optional()
  .catch(undefined);

const EnvSchema = z.object({
  GEMINI_API_KEY: presentString,
  GEMINI_MODEL: presentString,
  GEMINI_FALLBACK_MODEL: presentString,
  PORT: presentString,
  NODE_ENV: presentString,
});

export interface Config {
  readonly geminiApiKey: string | undefined;
  readonly model: string;
  readonly fallbackModel: string;
  readonly port: number;
  readonly isProduction: boolean;
}

const DEFAULT_MODEL = 'gemini-3.6-flash';
// Checked against the live API: gemini-2.5-flash now returns 404 for new
// keys, so a fallback pointing at it turned every flap into a failure.
const DEFAULT_FALLBACK_MODEL = 'gemini-3.5-flash';
const DEFAULT_PORT = 8787;

function emptyToUndefined(value: string | undefined): string | undefined {
  return value === undefined || value.trim() === '' ? undefined : value.trim();
}

export function readConfig(source: Record<string, string | undefined> = process.env): Config {
  const parsed = EnvSchema.parse({
    GEMINI_API_KEY: emptyToUndefined(source.GEMINI_API_KEY),
    GEMINI_MODEL: emptyToUndefined(source.GEMINI_MODEL),
    GEMINI_FALLBACK_MODEL: emptyToUndefined(source.GEMINI_FALLBACK_MODEL),
    PORT: emptyToUndefined(source.PORT),
    NODE_ENV: emptyToUndefined(source.NODE_ENV),
  });

  const port = Number.parseInt(parsed.PORT ?? '', 10);

  return {
    geminiApiKey: parsed.GEMINI_API_KEY,
    model: parsed.GEMINI_MODEL ?? DEFAULT_MODEL,
    fallbackModel: parsed.GEMINI_FALLBACK_MODEL ?? DEFAULT_FALLBACK_MODEL,
    port: Number.isFinite(port) && port > 0 ? port : DEFAULT_PORT,
    isProduction: parsed.NODE_ENV === 'production',
  };
}
