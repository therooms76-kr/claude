/**
 * Request router for handling LLM requests with load balancing and failover
 */
import type { ILLMProvider } from '../providers/base';
import type { ProviderFactory } from '../providers/factory';
import type { LLMRequest, LLMResponse, LLMProvider, RoutingDecision } from '../types';
import { LoadBalancer } from './loadBalancer';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';

export class RequestRouter {
  private loadBalancer: LoadBalancer;
  private maxRetries = 3;

  constructor(private providerFactory: ProviderFactory) {
    this.loadBalancer = new LoadBalancer(config.loadBalancing);
  }

  /**
   * Route a request to the appropriate provider
   */
  async route(request: LLMRequest): Promise<LLMResponse> {
    const routingDecision = this.makeRoutingDecision(request.model);

    if (!routingDecision) {
      throw createError(
        `No provider available for model: ${request.model}`,
        404,
        'MODEL_NOT_FOUND'
      );
    }

    logger.info(
      {
        model: request.model,
        provider: routingDecision.provider,
        reason: routingDecision.reason,
      },
      'Routing request'
    );

    // Execute request with retry and failover
    return await this.executeWithRetry(request, routingDecision);
  }

  /**
   * Make routing decision based on model and load balancing
   */
  private makeRoutingDecision(model: string): RoutingDecision | null {
    const allProviders = this.providerFactory.getAllProviders();

    if (config.loadBalancing.enabled) {
      const provider = this.loadBalancer.selectProvider(allProviders, model);
      if (!provider) {
        return null;
      }

      const alternativeProviders = allProviders
        .filter((p) => p.supportsModel(model) && p.name !== provider.name)
        .map((p) => p.name);

      return {
        provider: provider.name,
        model,
        reason: `Load balancing strategy: ${config.loadBalancing.strategy}`,
        alternativeProviders,
      };
    } else {
      // Without load balancing, just pick the first supporting provider
      const provider = this.providerFactory.getProviderForModel(model);
      if (!provider) {
        return null;
      }

      return {
        provider: provider.name,
        model,
        reason: 'Direct routing (load balancing disabled)',
      };
    }
  }

  /**
   * Execute request with retry and failover logic
   */
  private async executeWithRetry(
    request: LLMRequest,
    routingDecision: RoutingDecision
  ): Promise<LLMResponse> {
    const failedProviders: LLMProvider[] = [];
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        // Select provider (with failover if enabled)
        const allProviders = this.providerFactory.getAllProviders();
        const provider = config.loadBalancing.enableFailover
          ? this.loadBalancer.selectWithFailover(allProviders, request.model, failedProviders)
          : this.providerFactory.getProvider(routingDecision.provider);

        if (!provider) {
          throw createError(
            `No healthy provider available for model: ${request.model}`,
            503,
            'NO_PROVIDER_AVAILABLE'
          );
        }

        logger.debug(
          {
            provider: provider.name,
            model: request.model,
            attempt: attempt + 1,
          },
          'Executing request'
        );

        const response = await provider.complete(request);
        return response;
      } catch (error) {
        lastError = error as Error;
        const currentProvider = routingDecision.provider;

        logger.warn(
          {
            err: error,
            provider: currentProvider,
            model: request.model,
            attempt: attempt + 1,
            maxRetries: this.maxRetries,
          },
          'Request failed, attempting failover'
        );

        // Add failed provider to the list
        if (!failedProviders.includes(currentProvider)) {
          failedProviders.push(currentProvider);
        }

        // If failover is disabled or no alternatives, throw error
        if (!config.loadBalancing.enableFailover || !routingDecision.alternativeProviders) {
          throw error;
        }

        // If all providers failed, throw error
        if (failedProviders.length >= this.getAllProvidersForModel(request.model).length) {
          throw createError(
            'All providers failed to process the request',
            503,
            'ALL_PROVIDERS_FAILED',
            { failedProviders, lastError: lastError?.message }
          );
        }

        // Wait before retry (exponential backoff)
        const backoffMs = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }

    // If we exhausted all retries
    throw createError(
      'Request failed after all retry attempts',
      503,
      'MAX_RETRIES_EXCEEDED',
      { failedProviders, lastError: lastError?.message }
    );
  }

  /**
   * Get all providers that support a given model
   */
  private getAllProvidersForModel(model: string): ILLMProvider[] {
    return this.providerFactory.getAllProviders().filter((p) => p.supportsModel(model));
  }

  /**
   * Stream a request to the appropriate provider
   */
  async *streamRoute(request: LLMRequest): AsyncGenerator<LLMResponse> {
    const routingDecision = this.makeRoutingDecision(request.model);

    if (!routingDecision) {
      throw createError(
        `No provider available for model: ${request.model}`,
        404,
        'MODEL_NOT_FOUND'
      );
    }

    const provider = this.providerFactory.getProvider(routingDecision.provider);
    if (!provider) {
      throw createError(
        `Provider ${routingDecision.provider} not found`,
        404,
        'PROVIDER_NOT_FOUND'
      );
    }

    if (!provider.streamComplete) {
      throw createError(
        `Provider ${routingDecision.provider} does not support streaming`,
        400,
        'STREAMING_NOT_SUPPORTED'
      );
    }

    logger.info(
      {
        model: request.model,
        provider: routingDecision.provider,
        reason: routingDecision.reason,
      },
      'Routing streaming request'
    );

    yield* provider.streamComplete(request);
  }
}
