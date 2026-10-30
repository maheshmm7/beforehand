import express, { type Express, type RequestHandler, type Response } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { type Config } from './config';
import { errorBody, statusFor } from './errors';
import { errorHandler } from './errorHandler';
import { createAssistant, type Assistant } from './gemini';
import { createRoutes } from './routes';

const JSON_BODY_LIMIT = '32kb';

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
      handler: refuse,
    });

  // Reading a health check and asking a language model are not the same cost,
  // so they do not share a budget.
  const apiLimiter = limiter(60);
  const assistantLimiter = limiter(12);

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

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
    }),
  );

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
