/**
 * OpenAI provider implementation
 */
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import type { LLMProvider, LLMRequest, LLMResponse, ProviderConfig } from '../types';
import { BaseLLMProvider } from './base';
import { logger } from '../utils/logger';

export class OpenAIProvider extends BaseLLMProvider {
  private client: OpenAI;

  constructor(config: ProviderConfig) {
    super('openai' as LLMProvider, config);
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
      timeout: config.timeout || 60000,
    });
  }

  async isHealthy(): Promise<boolean> {
    try {
      // Try to list models as a health check
      await this.client.models.list();
      return true;
    } catch (error) {
      logger.error({ err: error, provider: this.name }, 'OpenAI health check failed');
      return false;
    }
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();

    try {
      logger.debug(
        {
          provider: this.name,
          model: request.model,
          messageCount: request.messages.length,
        },
        'Sending request to OpenAI'
      );

      const completion = await this.client.chat.completions.create({
        model: request.model,
        messages: request.messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: request.temperature,
        max_tokens: request.maxTokens,
        top_p: request.topP,
        frequency_penalty: request.frequencyPenalty,
        presence_penalty: request.presencePenalty,
        stream: request.stream || false,
        user: request.user,
      });

      const latency = Date.now() - startTime;

      const usage = {
        promptTokens: completion.usage?.prompt_tokens || 0,
        completionTokens: completion.usage?.completion_tokens || 0,
        totalTokens: completion.usage?.total_tokens || 0,
      };

      const cost = this.calculateCost(usage, request.model);
      this.updateMetrics(latency, usage.totalTokens, cost);

      const response: LLMResponse = {
        id: completion.id || uuidv4(),
        model: completion.model,
        provider: this.name,
        choices: completion.choices.map((choice) => ({
          index: choice.index,
          message: {
            role: choice.message.role as 'system' | 'user' | 'assistant',
            content: choice.message.content || '',
          },
          finishReason: choice.finish_reason || 'stop',
        })),
        usage,
        latency,
        metadata: {
          ...request.metadata,
          cost,
          timestamp: new Date().toISOString(),
        },
      };

      logger.debug(
        {
          provider: this.name,
          model: request.model,
          latency,
          tokens: usage.totalTokens,
          cost,
        },
        'OpenAI request completed'
      );

      return response;
    } catch (error) {
      const latency = Date.now() - startTime;
      this.updateMetrics(latency, 0, 0, true);

      logger.error(
        {
          err: error,
          provider: this.name,
          model: request.model,
          latency,
        },
        'OpenAI request failed'
      );

      throw error;
    }
  }

  async *streamComplete(request: LLMRequest): AsyncGenerator<LLMResponse> {
    const startTime = Date.now();

    try {
      const stream = await this.client.chat.completions.create({
        model: request.model,
        messages: request.messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: request.temperature,
        max_tokens: request.maxTokens,
        stream: true,
      });

      for await (const chunk of stream) {
        const latency = Date.now() - startTime;

        const response: LLMResponse = {
          id: chunk.id || uuidv4(),
          model: chunk.model,
          provider: this.name,
          choices: chunk.choices.map((choice) => ({
            index: choice.index,
            message: {
              role: 'assistant',
              content: choice.delta.content || '',
            },
            finishReason: choice.finish_reason || '',
          })),
          usage: {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
          },
          latency,
        };

        yield response;
      }
    } catch (error) {
      const latency = Date.now() - startTime;
      this.updateMetrics(latency, 0, 0, true);
      throw error;
    }
  }
}
