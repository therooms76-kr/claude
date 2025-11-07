/**
 * Metrics endpoint for Prometheus scraping
 */
import type { FastifyInstance } from 'fastify';
import { metricsCollector } from '../observability/metrics';
import { config } from '../config/config';

export async function metricsRoutes(fastify: FastifyInstance): Promise<void> {
  if (!config.observability.enableMetrics || !metricsCollector) {
    return;
  }

  // Prometheus metrics endpoint
  fastify.get('/metrics', async (request, reply) => {
    const metrics = await metricsCollector.getMetrics();

    void reply
      .code(200)
      .header('Content-Type', metricsCollector.getRegistry().contentType)
      .send(metrics);
  });
}
