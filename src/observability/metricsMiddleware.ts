/**
 * Fastify middleware for collecting metrics
 */
import type { FastifyRequest, FastifyReply } from 'fastify';
import { metricsCollector } from './metrics';

export async function metricsMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!metricsCollector) {
    return;
  }

  const startTime = Date.now();

  // Increment active connections
  metricsCollector.activeConnections.inc();

  // Hook to record metrics after response
  reply.raw.on('finish', () => {
    const duration = Date.now() - startTime;

    // Extract model from request body if available
    const model = (request.body as any)?.model || 'unknown';

    // Record request metrics
    metricsCollector.recordRequest(
      request.method,
      request.routerPath || request.url,
      reply.statusCode,
      model,
      duration
    );

    // Decrement active connections
    metricsCollector.activeConnections.dec();

    // Record errors if status code indicates failure
    if (reply.statusCode >= 400) {
      metricsCollector.recordError(
        request.method,
        request.routerPath || request.url,
        reply.statusCode.toString(),
        model
      );
    }
  });
}
