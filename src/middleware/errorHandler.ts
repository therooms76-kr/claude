/**
 * Global error handler middleware
 */
import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { logger } from '../utils/logger';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export class GatewayError extends Error implements ApiError {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR', details?: unknown) {
    super(message);
    this.name = 'GatewayError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  error: FastifyError | ApiError,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  const statusCode = (error as ApiError).statusCode || error.statusCode || 500;
  const code = (error as ApiError).code || error.code || 'INTERNAL_ERROR';

  // Log the error
  logger.error(
    {
      err: error,
      requestId: request.id,
      method: request.method,
      url: request.url,
      statusCode,
    },
    'Request error'
  );

  // Send error response
  void reply.status(statusCode).send({
    error: {
      code,
      message: error.message,
      details: (error as ApiError).details,
      requestId: request.id,
    },
  });
}

export function createError(
  message: string,
  statusCode = 500,
  code = 'INTERNAL_ERROR',
  details?: unknown
): GatewayError {
  return new GatewayError(message, statusCode, code, details);
}
