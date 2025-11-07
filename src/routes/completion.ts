/**
 * LLM completion routes
 */
import type { FastifyInstance } from 'fastify';
import { validateLLMRequest, validateApiKey } from '../middleware/validation';
import { requirePermission, checkQuota } from '../middleware/rbac';
import { applyGuardrails } from '../middleware/guardrails';
import { logger } from '../utils/logger';
import type { ValidatedLLMRequest } from '../middleware/validation';
import type { RequestRouter } from '../services/router';
import type { ProviderFactory } from '../providers/factory';

export async function completionRoutes(fastify: FastifyInstance): Promise<void> {
  const router = (fastify as any).router as RequestRouter;
  const providerFactory = (fastify as any).providerFactory as ProviderFactory;

  // Chat completion endpoint
  fastify.post(
    '/v1/chat/completions',
    {
      preHandler: [
        validateApiKey,
        requirePermission('completions', 'create'),
        checkQuota,
        validateLLMRequest,
        applyGuardrails,
      ],
    },
    async (request, reply) => {
      const validatedBody = (request as any).validatedBody as ValidatedLLMRequest;
      const user = (request as any).user;

      logger.info(
        {
          requestId: request.id,
          userId: user.id,
          model: validatedBody.model,
          messageCount: validatedBody.messages.length,
        },
        'Processing completion request'
      );

      // Route the request through the router
      const response = await router.route(validatedBody);

      // Return OpenAI-compatible response format
      return {
        id: response.id,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: response.model,
        choices: response.choices,
        usage: {
          prompt_tokens: response.usage.promptTokens,
          completion_tokens: response.usage.completionTokens,
          total_tokens: response.usage.totalTokens,
        },
        system_fingerprint: null,
        metadata: {
          provider: response.provider,
          latency: response.latency,
          cost: response.metadata?.cost,
        },
      };
    }
  );

  // List available models
  fastify.get(
    '/v1/models',
    {
      preHandler: [validateApiKey, requirePermission('models', 'read')],
    },
    async () => {
      const models = providerFactory.getSupportedModels();

      return {
        object: 'list',
        data: models.map((model) => ({
          id: model,
          object: 'model',
          created: Math.floor(Date.now() / 1000),
          owned_by: 'gateway',
        })),
      };
    }
  );
}
