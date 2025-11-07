/**
 * Provider factory for creating and managing LLM providers
 */
import type { LLMProvider, ProviderConfig } from '../types';
import type { ILLMProvider } from './base';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { GoogleProvider } from './google';
import { logger } from '../utils/logger';

export class ProviderFactory {
  private providers: Map<LLMProvider, ILLMProvider> = new Map();

  constructor(configs: ProviderConfig[]) {
    this.initializeProviders(configs);
  }

  /**
   * Initialize all configured providers
   */
  private initializeProviders(configs: ProviderConfig[]): void {
    for (const config of configs) {
      if (!config.enabled) {
        logger.info({ provider: config.name }, 'Provider is disabled, skipping');
        continue;
      }

      try {
        const provider = this.createProvider(config);
        this.providers.set(config.name, provider);
        logger.info(
          {
            provider: config.name,
            models: config.models.length,
          },
          'Provider initialized'
        );
      } catch (error) {
        logger.error(
          {
            err: error,
            provider: config.name,
          },
          'Failed to initialize provider'
        );
      }
    }
  }

  /**
   * Create a provider instance based on config
   */
  private createProvider(config: ProviderConfig): ILLMProvider {
    switch (config.name) {
      case 'openai':
        return new OpenAIProvider(config);
      case 'anthropic':
        return new AnthropicProvider(config);
      case 'google':
        return new GoogleProvider(config);
      // Add more providers here
      default:
        throw new Error(`Unknown provider: ${config.name}`);
    }
  }

  /**
   * Get a provider by name
   */
  getProvider(name: LLMProvider): ILLMProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * Get a provider that supports the given model
   */
  getProviderForModel(model: string): ILLMProvider | undefined {
    for (const provider of this.providers.values()) {
      if (provider.supportsModel(model)) {
        return provider;
      }
    }
    return undefined;
  }

  /**
   * Get all available providers
   */
  getAllProviders(): ILLMProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get all healthy providers
   */
  async getHealthyProviders(): Promise<ILLMProvider[]> {
    const providers = this.getAllProviders();
    const healthChecks = await Promise.all(
      providers.map(async (provider) => ({
        provider,
        healthy: await provider.isHealthy(),
      }))
    );

    return healthChecks.filter((check) => check.healthy).map((check) => check.provider);
  }

  /**
   * Get provider health status
   */
  async getProviderHealth(): Promise<Map<LLMProvider, boolean>> {
    const healthMap = new Map<LLMProvider, boolean>();
    const providers = this.getAllProviders();

    await Promise.all(
      providers.map(async (provider) => {
        const healthy = await provider.isHealthy();
        healthMap.set(provider.name, healthy);
      })
    );

    return healthMap;
  }

  /**
   * Get all supported models across all providers
   */
  getSupportedModels(): string[] {
    const models = new Set<string>();
    for (const provider of this.providers.values()) {
      provider.config.models.forEach((model) => models.add(model.name));
    }
    return Array.from(models);
  }
}
