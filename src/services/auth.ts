/**
 * Authentication and authorization service
 */
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import type { User, UserRole, ApiKey } from '../types';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';

export class AuthService {
  /**
   * Generate a JWT token for a user
   */
  generateToken(user: User): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      config.security.jwtSecret,
      {
        expiresIn: config.security.jwtExpiration,
      }
    );
  }

  /**
   * Verify a JWT token
   */
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, config.security.jwtSecret);
    } catch (error) {
      throw createError('Invalid or expired token', 401, 'INVALID_TOKEN');
    }
  }

  /**
   * Hash a password
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify a password
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Generate an API key
   */
  generateApiKey(): string {
    // Generate a secure random API key
    return `gw_${uuidv4().replace(/-/g, '')}`;
  }

  /**
   * Validate API key format
   */
  isValidApiKeyFormat(apiKey: string): boolean {
    // Check if it starts with 'gw_' and has correct length
    return apiKey.startsWith('gw_') && apiKey.length === 35;
  }

  /**
   * Check if user has required role
   */
  hasRole(user: User, requiredRole: UserRole): boolean {
    const roleHierarchy: Record<UserRole, number> = {
      [UserRole.ADMIN]: 3,
      [UserRole.DEVELOPER]: 2,
      [UserRole.USER]: 1,
    };

    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  }

  /**
   * Check if user has permission to access a resource
   */
  hasPermission(user: User, resource: string, action: string): boolean {
    // Simple RBAC implementation
    const permissions: Record<UserRole, Set<string>> = {
      [UserRole.ADMIN]: new Set([
        'users:read',
        'users:write',
        'users:delete',
        'models:read',
        'models:write',
        'metrics:read',
        'config:read',
        'config:write',
        'completions:create',
      ]),
      [UserRole.DEVELOPER]: new Set([
        'users:read',
        'models:read',
        'metrics:read',
        'config:read',
        'completions:create',
      ]),
      [UserRole.USER]: new Set(['models:read', 'completions:create']),
    };

    const permission = `${resource}:${action}`;
    return permissions[user.role]?.has(permission) || false;
  }

  /**
   * Validate user quota
   */
  validateQuota(user: User): boolean {
    const { quotas } = user;

    // Check if quotas are exceeded
    if (quotas.maxRequests > 0 && quotas.currentRequests >= quotas.maxRequests) {
      logger.warn({ userId: user.id }, 'Request quota exceeded');
      return false;
    }

    if (quotas.maxTokens > 0 && quotas.currentTokens >= quotas.maxTokens) {
      logger.warn({ userId: user.id }, 'Token quota exceeded');
      return false;
    }

    if (quotas.maxCost > 0 && quotas.currentCost >= quotas.maxCost) {
      logger.warn({ userId: user.id }, 'Cost quota exceeded');
      return false;
    }

    return true;
  }

  /**
   * Update user quotas
   */
  updateQuota(user: User, tokens: number, cost: number): void {
    user.quotas.currentRequests++;
    user.quotas.currentTokens += tokens;
    user.quotas.currentCost += cost;

    // TODO: Persist to database
    logger.debug(
      {
        userId: user.id,
        requests: user.quotas.currentRequests,
        tokens: user.quotas.currentTokens,
        cost: user.quotas.currentCost,
      },
      'Updated user quota'
    );
  }

  /**
   * Reset user quotas (should be called periodically)
   */
  resetQuota(user: User): void {
    user.quotas.currentRequests = 0;
    user.quotas.currentTokens = 0;
    user.quotas.currentCost = 0;
    user.quotas.resetAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // TODO: Persist to database
    logger.info({ userId: user.id }, 'Reset user quota');
  }
}

// Export singleton instance
export const authService = new AuthService();
