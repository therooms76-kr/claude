/**
 * Base provider interface and abstract class
 */
import type {
  LLMProvider,
  LLMRequest,
  LLMResponse,
  ProviderConfig,
  TokenUsage,
} from '../types';

export interface ILLMProvider {
  readonly name: LLMProvider;
  readonly config: ProviderConfig;

  /**
   * Check if the provider is available and healthy
   */
  isHealthy(): Promise<boolean>;

  /**
   * Check if the provider supports the given model
   */
  supportsModel(model: string): boolean;

  /**
   * Send a completion request to the provider
   */
  complete(request: LLMRequest): Promise<LLMResponse>;

  /**
   * Stream completion response (for streaming mode)
   */
  streamComplete?(request: LLMRequest): AsyncGenerator<LLMResponse>;

  /**
   * Calculate cost based on token usage
   */
  calculateCost(usage: TokenUsage, model: string): number;

  /**
   * Get provider health metrics
   */
  getMetrics(): ProviderMetrics;
}

export interface ProviderMetrics {
  requestCount: number;
  errorCount: number;
  totalTokens: number;
  totalCost: number;
  averageLatency: number;
  lastRequestTime?: Date;
  lastErrorTime?: Date;
}

export abstract class BaseLLMProvider implements ILLMProvider {
  protected metrics: ProviderMetrics = {
    requestCount: 0,
    errorCount: 0,
    totalTokens: 0,
    totalCost: 0,
    averageLatency: 0,
  };

  constructor(
    public readonly name: LLMProvider,
    public readonly config: ProviderConfig
  ) {}

  abstract isHealthy(): Promise<boolean>;
  abstract complete(request: LLMRequest): Promise<LLMResponse>;

  supportsModel(model: string): boolean {
    return this.config.models.some((m) => m.name === model);
  }

  calculateCost(usage: TokenUsage, model: string): number {
    const modelConfig = this.config.models.find((m) => m.name === model);
    if (!modelConfig) {
      return 0;
    }

    const promptCost = (usage.promptTokens / 1000) * modelConfig.costPer1kPromptTokens;
    const completionCost = (usage.completionTokens / 1000) * modelConfig.costPer1kCompletionTokens;

    return promptCost + completionCost;
  }

  getMetrics(): ProviderMetrics {
    return { ...this.metrics };
  }

  protected updateMetrics(latency: number, tokens: number, cost: number, isError = false): void {
    this.metrics.requestCount++;
    this.metrics.totalTokens += tokens;
    this.metrics.totalCost += cost;
    this.metrics.lastRequestTime = new Date();

    if (isError) {
      this.metrics.errorCount++;
      this.metrics.lastErrorTime = new Date();
    }

    // Update average latency (exponential moving average)
    this.metrics.averageLatency =
      this.metrics.averageLatency === 0
        ? latency
        : this.metrics.averageLatency * 0.9 + latency * 0.1;
  }

  protected getModelConfig(model: string) {
    const modelConfig = this.config.models.find((m) => m.name === model);
    if (!modelConfig) {
      throw new Error(`Model ${model} is not supported by provider ${this.name}`);
    }
    return modelConfig;
  }
}
