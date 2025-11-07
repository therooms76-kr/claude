/**
 * Fastify application setup
 */
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { config } from './config/config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { metricsMiddleware } from './observability/metricsMiddleware';
import { healthRoutes } from './routes/health';
import { completionRoutes } from './routes/completion';
import { metricsRoutes } from './routes/metrics';
import { ProviderFactory } from './providers/factory';
import { RequestRouter } from './services/router';

export async function createApp() {
  const app = Fastify({
    logger: logger as any,
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
    disableRequestLogging: false,
    trustProxy: true,
  });

  // Initialize provider factory and router
  const providerFactory = new ProviderFactory(config.providers);
  const router = new RequestRouter(providerFactory);

  // Decorate app with router and provider factory
  app.decorate('providerFactory', providerFactory);
  app.decorate('router', router);

  // Register plugins
  await app.register(helmet, {
    contentSecurityPolicy: false,
  });

  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  // Rate limiting
  if (config.security.rateLimiting.enabled) {
    await app.register(rateLimit, {
      max: config.security.rateLimiting.maxRequests,
      timeWindow: config.security.rateLimiting.windowMs,
      redis: config.security.rateLimiting.redis
        ? {
            host: config.security.rateLimiting.redis.host,
            port: config.security.rateLimiting.redis.port,
            password: config.security.rateLimiting.redis.password,
          }
        : undefined,
    });
  }

  // Metrics middleware
  if (config.observability.enableMetrics) {
    app.addHook('onRequest', metricsMiddleware);
  }

  // Error handler
  app.setErrorHandler(errorHandler);

  // Register routes
  await app.register(healthRoutes);
  await app.register(completionRoutes);
  await app.register(metricsRoutes);

  // Root endpoint
  app.get('/', async () => {
    return {
      name: 'TS GenAI Gateway',
      version: '1.0.0',
      description: 'Enterprise TypeScript GenAI Gateway for unified LLM API access',
      endpoints: {
        health: '/health',
        ready: '/ready',
        live: '/live',
        status: '/status',
        chatCompletion: '/v1/chat/completions',
        models: '/v1/models',
        metrics: '/metrics',
      },
    };
  });

  return app;
}
