/**
 * Request validation middleware
 */
import type { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { createError } from './errorHandler';

// Schema for LLM completion request
export const llmRequestSchema = z.object({
  model: z.string().min(1, 'Model is required'),
  messages: z
    .array(
      z.object({
        role: z.enum(['system', 'user', 'assistant']),
        content: z.string().min(1),
      })
    )
    .min(1, 'At least one message is required'),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).optional(),
  topP: z.number().min(0).max(1).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
  stream: z.boolean().optional(),
  user: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type ValidatedLLMRequest = z.infer<typeof llmRequestSchema>;

/**
 * Validate LLM request body
 */
export async function validateLLMRequest(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const result = llmRequestSchema.safeParse(request.body);

    if (!result.success) {
      const errors = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      throw createError('Validation failed', 400, 'VALIDATION_ERROR', errors);
    }

    // Attach validated data to request
    (request as any).validatedBody = result.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Validate API key from header
 */
export async function validateApiKey(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const apiKey = request.headers['x-api-key'] as string;

  if (!apiKey) {
    throw createError('API key is required', 401, 'MISSING_API_KEY');
  }

  // TODO: Implement actual API key validation against database
  // For now, just check if it exists
  if (apiKey.length < 32) {
    throw createError('Invalid API key format', 401, 'INVALID_API_KEY');
  }

  // Attach user info to request
  (request as any).user = {
    id: 'user-123', // TODO: Get from database
    apiKey,
  };
}
