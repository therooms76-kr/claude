/**
 * Guardrails middleware for request/response filtering
 */
import type { FastifyRequest, FastifyReply } from 'fastify';
import { guardrailsService } from '../guardrails/guardrailsService';
import { createError } from './errorHandler';
import { logger } from '../utils/logger';

/**
 * Apply guardrails to incoming requests
 */
export async function applyGuardrails(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const body = request.body as any;

  if (!body || !body.messages) {
    return;
  }

  // Apply guardrails to all messages
  const result = await guardrailsService.applyToMessages(body.messages);

  if (!result.passed) {
    logger.warn(
      {
        requestId: request.id,
        violations: result.violations,
      },
      'Guardrails detected violations in request'
    );

    // Check if content should be blocked
    if (guardrailsService.shouldBlock(result.violations)) {
      throw createError(
        'Content violates safety guidelines and has been blocked',
        400,
        'CONTENT_BLOCKED',
        {
          violations: result.violations,
        }
      );
    }

    // Otherwise, use filtered content
    if (result.filteredMessages) {
      body.messages = result.filteredMessages;
      logger.info(
        {
          requestId: request.id,
        },
        'Applied content filtering to request'
      );
    }
  }
}
