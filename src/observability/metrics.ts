/**
 * Prometheus metrics collector
 */
import { Registry, Counter, Histogram, Gauge } from 'prom-client';
import type { LLMProvider } from '../types';
import { config } from '../config/config';
import { logger } from '../utils/logger';

export class MetricsCollector {
  private registry: Registry;

  // Request metrics
  public requestsTotal: Counter;
  public requestDuration: Histogram;
  public requestErrors: Counter;

  // Token metrics
  public tokensTotal: Counter;
  public tokensByProvider: Counter;

  // Cost metrics
  public costTotal: Counter;

  // Provider metrics
  public providerRequests: Counter;
  public providerErrors: Counter;
  public providerLatency: Histogram;
  public providerHealth: Gauge;

  // System metrics
  public activeConnections: Gauge;

  constructor() {
    this.registry = new Registry();

    // Request metrics
    this.requestsTotal = new Counter({
      name: 'gateway_requests_total',
      help: 'Total number of requests',
      labelNames: ['method', 'route', 'status_code', 'model'],
      registers: [this.registry],
    });

    this.requestDuration = new Histogram({
      name: 'gateway_request_duration_seconds',
      help: 'Request duration in seconds',
      labelNames: ['method', 'route', 'model', 'provider'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
      registers: [this.registry],
    });

    this.requestErrors = new Counter({
      name: 'gateway_request_errors_total',
      help: 'Total number of request errors',
      labelNames: ['method', 'route', 'error_code', 'model'],
      registers: [this.registry],
    });

    // Token metrics
    this.tokensTotal = new Counter({
      name: 'gateway_tokens_total',
      help: 'Total number of tokens processed',
      labelNames: ['type', 'model', 'provider'],
      registers: [this.registry],
    });

    this.tokensByProvider = new Counter({
      name: 'gateway_tokens_by_provider_total',
      help: 'Total tokens by provider',
      labelNames: ['provider', 'type'],
      registers: [this.registry],
    });

    // Cost metrics
    this.costTotal = new Counter({
      name: 'gateway_cost_total',
      help: 'Total cost in USD',
      labelNames: ['model', 'provider', 'user_id'],
      registers: [this.registry],
    });

    // Provider metrics
    this.providerRequests = new Counter({
      name: 'gateway_provider_requests_total',
      help: 'Total requests per provider',
      labelNames: ['provider', 'model', 'status'],
      registers: [this.registry],
    });

    this.providerErrors = new Counter({
      name: 'gateway_provider_errors_total',
      help: 'Total errors per provider',
      labelNames: ['provider', 'model', 'error_type'],
      registers: [this.registry],
    });

    this.providerLatency = new Histogram({
      name: 'gateway_provider_latency_seconds',
      help: 'Provider request latency in seconds',
      labelNames: ['provider', 'model'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
      registers: [this.registry],
    });

    this.providerHealth = new Gauge({
      name: 'gateway_provider_health',
      help: 'Provider health status (1 = healthy, 0 = unhealthy)',
      labelNames: ['provider'],
      registers: [this.registry],
    });

    // System metrics
    this.activeConnections = new Gauge({
      name: 'gateway_active_connections',
      help: 'Number of active connections',
      registers: [this.registry],
    });

    logger.info('Metrics collector initialized');
  }

  /**
   * Record a request
   */
  recordRequest(
    method: string,
    route: string,
    statusCode: number,
    model: string,
    durationMs: number,
    provider?: LLMProvider
  ): void {
    this.requestsTotal.inc({
      method,
      route,
      status_code: statusCode,
      model,
    });

    this.requestDuration.observe(
      {
        method,
        route,
        model,
        provider: provider || 'unknown',
      },
      durationMs / 1000
    );
  }

  /**
   * Record request error
   */
  recordError(method: string, route: string, errorCode: string, model: string): void {
    this.requestErrors.inc({
      method,
      route,
      error_code: errorCode,
      model,
    });
  }

  /**
   * Record token usage
   */
  recordTokens(
    promptTokens: number,
    completionTokens: number,
    model: string,
    provider: LLMProvider
  ): void {
    this.tokensTotal.inc(
      {
        type: 'prompt',
        model,
        provider,
      },
      promptTokens
    );

    this.tokensTotal.inc(
      {
        type: 'completion',
        model,
        provider,
      },
      completionTokens
    );

    this.tokensByProvider.inc(
      {
        provider,
        type: 'prompt',
      },
      promptTokens
    );

    this.tokensByProvider.inc(
      {
        provider,
        type: 'completion',
      },
      completionTokens
    );
  }

  /**
   * Record cost
   */
  recordCost(cost: number, model: string, provider: LLMProvider, userId?: string): void {
    this.costTotal.inc(
      {
        model,
        provider,
        user_id: userId || 'anonymous',
      },
      cost
    );
  }

  /**
   * Record provider request
   */
  recordProviderRequest(provider: LLMProvider, model: string, status: 'success' | 'error'): void {
    this.providerRequests.inc({
      provider,
      model,
      status,
    });
  }

  /**
   * Record provider error
   */
  recordProviderError(provider: LLMProvider, model: string, errorType: string): void {
    this.providerErrors.inc({
      provider,
      model,
      error_type: errorType,
    });
  }

  /**
   * Record provider latency
   */
  recordProviderLatency(provider: LLMProvider, model: string, latencyMs: number): void {
    this.providerLatency.observe(
      {
        provider,
        model,
      },
      latencyMs / 1000
    );
  }

  /**
   * Set provider health status
   */
  setProviderHealth(provider: LLMProvider, healthy: boolean): void {
    this.providerHealth.set(
      {
        provider,
      },
      healthy ? 1 : 0
    );
  }

  /**
   * Get metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    return await this.registry.metrics();
  }

  /**
   * Get metrics registry
   */
  getRegistry(): Registry {
    return this.registry;
  }
}

// Export singleton instance
export const metricsCollector = config.observability.enableMetrics
  ? new MetricsCollector()
  : null;
