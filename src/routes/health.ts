/**
 * Health check and status routes
 */
import type { FastifyInstance } from 'fastify';
import { config } from '../config/config';

export async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  // Basic health check
  fastify.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  // Readiness check
  fastify.get('/ready', async () => {
    // TODO: Add checks for database, Redis, etc.
    const checks = {
      server: true,
      providers: config.providers.filter((p) => p.enabled).length > 0,
    };

    const isReady = Object.values(checks).every((check) => check === true);

    return {
      ready: isReady,
      checks,
      timestamp: new Date().toISOString(),
    };
  });

  // Liveness check
  fastify.get('/live', async () => {
    return {
      alive: true,
      timestamp: new Date().toISOString(),
    };
  });

  // Status and configuration info
  fastify.get('/status', async () => {
    return {
      version: '1.0.0',
      environment: config.server.environment,
      providers: config.providers
        .filter((p) => p.enabled)
        .map((p) => ({
          name: p.name,
          models: p.models.map((m) => m.name),
        })),
      features: {
        metrics: config.observability.enableMetrics,
        tracing: config.observability.enableTracing,
        rateLimiting: config.security.rateLimiting.enabled,
        loadBalancing: config.loadBalancing.enabled,
        guardrails: {
          piiFilter: config.guardrails.enablePIIFilter,
          toxicityFilter: config.guardrails.enableToxicityFilter,
        },
      },
      timestamp: new Date().toISOString(),
    };
  });
}
