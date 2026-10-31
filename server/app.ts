import express, { type Express, type Request, type RequestHandler, type Response } from 'express';
import helmet from 'helmet';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { type Config } from './config.ts';
import { errorBody, statusFor } from './errors.ts';
import { errorHandler } from './errorHandler.ts';
import { createAssistant, type Assistant } from './gemini.ts';
import { createRoutes } from './routes.ts';
import { HSTS_MAX_AGE_SECONDS, PERMISSIONS_POLICY } from './securityHeaders.ts';

const JSON_BODY_LIMIT = '32kb';

/**
 * Who a request is from, for the purpose of spending a budget.
 *
 * A proxy appends the address it saw to the end of `x-forwarded-for`, so with
 * one proxy in front the last hop is the only part of that header a client
 * cannot write. Reading the first hop — which is what `trust proxy` does —
 * lets anyone rotate a header and hold an unlimited number of budgets, which
 * was true of this server until it was measured: seventy requests with a
 * rotating header drew no refusals at all, and twenty assistant calls against
 * a limit of twelve drew none either.
 *
 * With no proxy in front, the header is ignored outright.
 */
export function clientKey(request: Request, trustedHops: number): string {
  const direct = request.socket.remoteAddress ?? 'unknown';
  if (trustedHops <= 0) return ipKeyGenerator(direct);

  const header = request.headers['x-forwarded-for'];
  const chain = Array.isArray(header) ? header.join(',') : (header ?? '');
  const hops = chain
    .split(',')
    .map((hop) => hop.trim())
    .filter((hop) => hop !== '');

  // Count back past the proxies we actually have. With one proxy in front,
  // that is the last hop — the only one a client cannot write.
  const observed = hops[hops.length - trustedHops];

  // ipKeyGenerator collapses an IPv6 address to its /56, so a client cannot
  // simply move along its own prefix to get another budget.
  return ipKeyGenerator(observed ?? direct);
}

/** Rate limiting runs before body parsing so a flood costs us no parse work. */
export function createApp(
  config: Config,
  assistant: Assistant | undefined = createAssistant(config),
): Express {
  const app = express();

  // Built per app rather than per module, so one instance can never spend
  // another's budget — which also keeps the tests independent.
  const refuse = (_request: unknown, response: Response): void => {
    response.status(statusFor('rate_limited')).json(errorBody('rate_limited'));
  };
  const limiter = (limit: number): RequestHandler =>
    rateLimit({
      windowMs: 60_000,
      limit,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      keyGenerator: (request: Request) => clientKey(request, config.trustedProxyHops),
      handler: refuse,
    });

  // Reading a health check and asking a language model are not the same cost,
  // so they do not share a budget.
  const apiLimiter = limiter(60);
  const assistantLimiter = limiter(12);

  app.disable('x-powered-by');
  // Nothing in this app may take a client's word for where it came from. The
  // one thing that needs an address builds its own, above.
  app.set('trust proxy', false);

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          'default-src': ["'none'"],
          'script-src': ["'self'"],
          // Styles come from files; only the handful of inline style
          // attributes that carry a width or a fill percentage are allowed.
          'style-src': ["'self'"],
          'style-src-attr': ["'unsafe-inline'"],
          'img-src': ["'self'", 'data:'],
          'font-src': ["'self'"],
          'connect-src': ["'self'"],
          'base-uri': ["'none'"],
          'form-action': ["'none'"],
          'frame-ancestors': ["'none'"],
          'object-src': ["'none'"],
        },
      },
      referrerPolicy: { policy: 'no-referrer' },
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      // The static host sends DENY; the two had disagreed, with Helmet
      // defaulting to SAMEORIGIN.
      frameguard: { action: 'deny' },
      hsts: { maxAge: HSTS_MAX_AGE_SECONDS, includeSubDomains: true, preload: false },
    }),
  );

  // Helmet has no permissions policy of its own. Nothing here asks for a
  // camera, a microphone or a location, so nothing is granted one.
  app.use((_req, res, next) => {
    res.setHeader('Permissions-Policy', PERMISSIONS_POLICY);
    next();
  });

  app.use('/api', apiLimiter);
  for (const route of ['/api/quote', '/api/describe', '/api/ideas']) {
    app.use(route, assistantLimiter);
  }
  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.use('/api', express.json({ limit: JSON_BODY_LIMIT, strict: true }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', assistant: assistant === undefined ? 'off' : 'on' });
  });

  app.use('/api', createRoutes(assistant));

  app.use('/api', (_req, res) => {
    res.status(statusFor('not_found')).json(errorBody('not_found'));
  });

  app.use(errorHandler);

  return app;
}
