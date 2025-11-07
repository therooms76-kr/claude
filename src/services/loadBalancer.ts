/**
 * Load balancer for distributing requests across providers
 */
import type { ILLMProvider } from '../providers/base';
import type { LLMProvider, LoadBalancingConfig } from '../types';
import { logger } from '../utils/logger';

export interface LoadBalancerStrategy {
  selectProvider(providers: ILLMProvider[], model: string): ILLMProvider | null;
}

/**
 * Round-robin load balancing strategy
 */
export class RoundRobinStrategy implements LoadBalancerStrategy {
  private currentIndex = 0;

  selectProvider(providers: ILLMProvider[], model: string): ILLMProvider | null {
    const supportingProviders = providers.filter((p) => p.supportsModel(model));

    if (supportingProviders.length === 0) {
      return null;
    }

    const provider = supportingProviders[this.currentIndex % supportingProviders.length];
    this.currentIndex = (this.currentIndex + 1) % supportingProviders.length;

    return provider;
  }
}

/**
 * Latency-based load balancing strategy
 */
export class LatencyBasedStrategy implements LoadBalancerStrategy {
  selectProvider(providers: ILLMProvider[], model: string): ILLMProvider | null {
    const supportingProviders = providers.filter((p) => p.supportsModel(model));

    if (supportingProviders.length === 0) {
      return null;
    }

    // Select provider with lowest average latency
    let bestProvider = supportingProviders[0];
    let bestLatency = bestProvider.getMetrics().averageLatency || Infinity;

    for (const provider of supportingProviders) {
      const metrics = provider.getMetrics();
      const latency = metrics.averageLatency || 0;

      // If no requests yet, consider it the best option
      if (metrics.requestCount === 0) {
        return provider;
      }

      if (latency < bestLatency) {
        bestLatency = latency;
        bestProvider = provider;
      }
    }

    return bestProvider;
  }
}

/**
 * Weighted load balancing strategy
 */
export class WeightedStrategy implements LoadBalancerStrategy {
  private weights: Map<LLMProvider, number>;

  constructor(weights?: Map<LLMProvider, number>) {
    this.weights = weights || new Map();
  }

  selectProvider(providers: ILLMProvider[], model: string): ILLMProvider | null {
    const supportingProviders = providers.filter((p) => p.supportsModel(model));

    if (supportingProviders.length === 0) {
      return null;
    }

    // If no weights configured, use equal weights
    if (this.weights.size === 0) {
      return supportingProviders[Math.floor(Math.random() * supportingProviders.length)];
    }

    // Calculate total weight
    let totalWeight = 0;
    for (const provider of supportingProviders) {
      totalWeight += this.weights.get(provider.name) || 1;
    }

    // Random selection based on weights
    let random = Math.random() * totalWeight;
    for (const provider of supportingProviders) {
      const weight = this.weights.get(provider.name) || 1;
      random -= weight;
      if (random <= 0) {
        return provider;
      }
    }

    return supportingProviders[0];
  }

  setWeight(provider: LLMProvider, weight: number): void {
    this.weights.set(provider, weight);
  }
}

/**
 * Least connections load balancing strategy
 */
export class LeastConnectionsStrategy implements LoadBalancerStrategy {
  selectProvider(providers: ILLMProvider[], model: string): ILLMProvider | null {
    const supportingProviders = providers.filter((p) => p.supportsModel(model));

    if (supportingProviders.length === 0) {
      return null;
    }

    // Select provider with least request count
    let bestProvider = supportingProviders[0];
    let leastRequests = bestProvider.getMetrics().requestCount;

    for (const provider of supportingProviders) {
      const requestCount = provider.getMetrics().requestCount;
      if (requestCount < leastRequests) {
        leastRequests = requestCount;
        bestProvider = provider;
      }
    }

    return bestProvider;
  }
}

/**
 * Load balancer class
 */
export class LoadBalancer {
  private strategy: LoadBalancerStrategy;

  constructor(private config: LoadBalancingConfig) {
    this.strategy = this.createStrategy(config.strategy);
  }

  private createStrategy(strategyName: string): LoadBalancerStrategy {
    switch (strategyName) {
      case 'round-robin':
        return new RoundRobinStrategy();
      case 'latency-based':
        return new LatencyBasedStrategy();
      case 'weighted':
        return new WeightedStrategy();
      case 'least-connections':
        return new LeastConnectionsStrategy();
      default:
        logger.warn({ strategy: strategyName }, 'Unknown strategy, using round-robin');
        return new RoundRobinStrategy();
    }
  }

  /**
   * Select the best provider for a given model
   */
  selectProvider(
    providers: ILLMProvider[],
    model: string,
    excludeProviders: LLMProvider[] = []
  ): ILLMProvider | null {
    // Filter out excluded providers
    const availableProviders = providers.filter(
      (p) => !excludeProviders.includes(p.name)
    );

    const provider = this.strategy.selectProvider(availableProviders, model);

    if (provider) {
      logger.debug(
        {
          provider: provider.name,
          model,
          strategy: this.config.strategy,
        },
        'Provider selected by load balancer'
      );
    }

    return provider;
  }

  /**
   * Get the next provider with failover support
   */
  selectWithFailover(
    providers: ILLMProvider[],
    model: string,
    failedProviders: LLMProvider[] = []
  ): ILLMProvider | null {
    if (!this.config.enableFailover) {
      return this.selectProvider(providers, model);
    }

    return this.selectProvider(providers, model, failedProviders);
  }

  /**
   * Change the load balancing strategy
   */
  setStrategy(strategyName: string): void {
    this.strategy = this.createStrategy(strategyName);
    logger.info({ strategy: strategyName }, 'Load balancing strategy changed');
  }
}
