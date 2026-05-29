import compression from 'compression';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { corsOrigins, env } from './config/env';
import { logger } from './config/logger';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { metricsMiddleware } from './middlewares/metricsMiddleware';
import { requestContext } from './middlewares/requestContext';
import { createApiRoutes } from './routes';
import { createServiceContainer, ServiceContainer } from './services/serviceContainer';

export function createApp(container: ServiceContainer = createServiceContainer()) {
  const app = express();

  app.use(requestContext);
  app.use(metricsMiddleware);
  app.use(pinoHttp({ logger }));
  app.use(helmet());
  app.use(compression());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`Origin ${origin} is not allowed by CORS`));
      },
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      limit: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.get('/', (_req, res) => res.json({ service: 'flight-navigation-backend', status: 'running' }));
  app.use('/api', createApiRoutes(container.flightController));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
