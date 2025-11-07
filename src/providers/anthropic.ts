/**
 * Anthropic provider implementation
 */
import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';
import type { LLMProvider, LLMRequest, LLMResponse, ProviderConfig } from '../types';
import { BaseLLMProvider } from './base';
import { logger } from '../utils/logger';

export class AnthropicProvider extends BaseLLMProvider {
  private client: Anthropic;

  constructor(config: ProviderConfig) {
    super('anthropic' as LLMProvider, config);
    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
      timeout: config.timeout || 60000,
    });
  }

  async isHealthy(): Promise<boolean> {
    try {
      // Anthropic doesn't have a dedicated health check endpoint
      // We'll consider it healthy if we can create the client
      return true;
    } catch (error) {
      logger.error({ err: error, provider: this.name }, 'Anthropic health check failed');
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
        'Sending request to Anthropic'
      );

      // Separate system message from other messages
      const systemMessage = request.messages.find((msg) => msg.role === 'system');
      const userMessages = request.messages.filter((msg) => msg.role !== 'system');

      const completion = await this.client.messages.create({
        model: request.model,
        max_tokens: request.maxTokens || 4096,
        system: systemMessage?.content,
        messages: userMessages.map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
        temperature: request.temperature,
        top_p: request.topP,
        stream: request.stream || false,
      });

      const latency = Date.now() - startTime;

      const usage = {
        promptTokens: completion.usage.input_tokens,
        completionTokens: completion.usage.output_tokens,
        totalTokens: completion.usage.input_tokens + completion.usage.output_tokens,
      };

      const cost = this.calculateCost(usage, request.model);
      this.updateMetrics(latency, usage.totalTokens, cost);

      const response: LLMResponse = {
        id: completion.id || uuidv4(),
        model: completion.model,
        provider: this.name,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: completion.content[0].type === 'text' ? completion.content[0].text : '',
            },
            finishReason: completion.stop_reason || 'stop',
          },
        ],
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
        'Anthropic request completed'
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
        'Anthropic request failed'
      );

      throw error;
    }
  }

  async *streamComplete(request: LLMRequest): AsyncGenerator<LLMResponse> {
    const startTime = Date.now();

    try {
      const systemMessage = request.messages.find((msg) => msg.role === 'system');
      const userMessages = request.messages.filter((msg) => msg.role !== 'system');

      const stream = await this.client.messages.stream({
        model: request.model,
        max_tokens: request.maxTokens || 4096,
        system: systemMessage?.content,
        messages: userMessages.map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
        temperature: request.temperature,
      });

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          const latency = Date.now() - startTime;

          const response: LLMResponse = {
            id: uuidv4(),
            model: request.model,
            provider: this.name,
            choices: [
              {
                index: 0,
                message: {
                  role: 'assistant',
                  content: chunk.delta.text,
                },
                finishReason: '',
              },
            ],
            usage: {
              promptTokens: 0,
              completionTokens: 0,
              totalTokens: 0,
            },
            latency,
          };

          yield response;
        }
      }
    } catch (error) {
      const latency = Date.now() - startTime;
      this.updateMetrics(latency, 0, 0, true);
      throw error;
    }
  }
}
