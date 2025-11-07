/**
 * Role-Based Access Control (RBAC) middleware
 */
import type { FastifyRequest, FastifyReply } from 'fastify';
import type { UserRole } from '../types';
import { authService } from '../services/auth';
import { createError } from './errorHandler';

/**
 * Middleware to check if user has required role
 */
export function requireRole(requiredRole: UserRole) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const user = (request as any).user;

    if (!user) {
      throw createError('Authentication required', 401, 'UNAUTHORIZED');
    }

    if (!authService.hasRole(user, requiredRole)) {
      throw createError('Insufficient permissions', 403, 'FORBIDDEN');
    }
  };
}

/**
 * Middleware to check if user has permission for a resource
 */
export function requirePermission(resource: string, action: string) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const user = (request as any).user;

    if (!user) {
      throw createError('Authentication required', 401, 'UNAUTHORIZED');
    }

    if (!authService.hasPermission(user, resource, action)) {
      throw createError(
        `Insufficient permissions for ${resource}:${action}`,
        403,
        'FORBIDDEN'
      );
    }
  };
}

/**
 * Middleware to check user quotas
 */
export async function checkQuota(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const user = (request as any).user;

  if (!user) {
    throw createError('Authentication required', 401, 'UNAUTHORIZED');
  }

  if (!authService.validateQuota(user)) {
    throw createError('Quota exceeded', 429, 'QUOTA_EXCEEDED', {
      currentRequests: user.quotas.currentRequests,
      maxRequests: user.quotas.maxRequests,
      currentTokens: user.quotas.currentTokens,
      maxTokens: user.quotas.maxTokens,
      currentCost: user.quotas.currentCost,
      maxCost: user.quotas.maxCost,
      resetAt: user.quotas.resetAt,
    });
  }
}
