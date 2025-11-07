/**
 * Google Gemini provider implementation
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';
import type { LLMProvider, LLMRequest, LLMResponse, ProviderConfig } from '../types';
import { BaseLLMProvider } from './base';
import { logger } from '../utils/logger';

export class GoogleProvider extends BaseLLMProvider {
  private client: GoogleGenerativeAI;

  constructor(config: ProviderConfig) {
    super('google' as LLMProvider, config);
    this.client = new GoogleGenerativeAI(config.apiKey);
  }

  async isHealthy(): Promise<boolean> {
    try {
      // Google doesn't have a dedicated health check
      // Consider healthy if client is initialized
      return true;
    } catch (error) {
      logger.error({ err: error, provider: this.name }, 'Google health check failed');
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
        'Sending request to Google'
      );

      const model = this.client.getGenerativeModel({ model: request.model });

      // Convert messages to Gemini format
      const systemMessage = request.messages.find((msg) => msg.role === 'system');
      const userMessages = request.messages.filter((msg) => msg.role !== 'system');

      const history = userMessages.slice(0, -1).map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

      const chat = model.startChat({
        history,
        generationConfig: {
          temperature: request.temperature,
          maxOutputTokens: request.maxTokens,
          topP: request.topP,
        },
      });

      const lastMessage = userMessages[userMessages.length - 1];
      const result = await chat.sendMessage(lastMessage.content);
      const response = await result.response;

      const latency = Date.now() - startTime;

      // Google doesn't provide token counts in the same way
      // Estimate based on text length
      const promptTokens = Math.ceil(
        request.messages.reduce((sum, msg) => sum + msg.content.length, 0) / 4
      );
      const completionTokens = Math.ceil((response.text()?.length || 0) / 4);

      const usage = {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      };

      const cost = this.calculateCost(usage, request.model);
      this.updateMetrics(latency, usage.totalTokens, cost);

      const llmResponse: LLMResponse = {
        id: uuidv4(),
        model: request.model,
        provider: this.name,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: response.text() || '',
            },
            finishReason: 'stop',
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
        'Google request completed'
      );

      return llmResponse;
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
        'Google request failed'
      );

      throw error;
    }
  }

  async *streamComplete(request: LLMRequest): AsyncGenerator<LLMResponse> {
    const startTime = Date.now();

    try {
      const model = this.client.getGenerativeModel({ model: request.model });

      const userMessages = request.messages.filter((msg) => msg.role !== 'system');
      const history = userMessages.slice(0, -1).map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

      const chat = model.startChat({ history });

      const lastMessage = userMessages[userMessages.length - 1];
      const result = await chat.sendMessageStream(lastMessage.content);

      for await (const chunk of result.stream) {
        const latency = Date.now() - startTime;
        const text = chunk.text();

        const response: LLMResponse = {
          id: uuidv4(),
          model: request.model,
          provider: this.name,
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: text,
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
    } catch (error) {
      const latency = Date.now() - startTime;
      this.updateMetrics(latency, 0, 0, true);
      throw error;
    }
  }
}
