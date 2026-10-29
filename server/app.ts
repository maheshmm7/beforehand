import express, { type Express } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { type Config } from './config';
import { errorBody, statusFor } from './errors';
import { errorHandler } from './errorHandler';

const JSON_BODY_LIMIT = '32kb';

/** Rate limiting runs before body parsing so a flood costs us no parse work. */
const apiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(statusFor('rate_limited')).json(errorBody('rate_limited'));
  },
});

export function createApp(config: Config): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          'default-src': ["'none'"],
          'script-src': ["'self'"],
          'style-src': ["'self'", "'unsafe-inline'"],
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
  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.use('/api', express.json({ limit: JSON_BODY_LIMIT, strict: true }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', assistant: config.geminiApiKey === undefined ? 'off' : 'on' });
  });

  app.use('/api', (_req, res) => {
    res.status(statusFor('not_found')).json(errorBody('not_found'));
  });

  app.use(errorHandler);

  return app;
}
