/**
 * Configuration loader and validator
 */
import dotenv from 'dotenv';
import { z } from 'zod';
import type { GatewayConfig, LLMProvider } from '../types';

// Load environment variables
dotenv.config();

// Zod schemas for validation
const serverConfigSchema = z.object({
  port: z.number().min(1).max(65535),
  host: z.string(),
  environment: z.enum(['development', 'production', 'staging']),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']),
});

const redisConfigSchema = z
  .object({
    host: z.string(),
    port: z.number(),
    password: z.string().optional(),
    db: z.number(),
  })
  .optional();

const rateLimitConfigSchema = z.object({
  enabled: z.boolean(),
  maxRequests: z.number().min(1),
  windowMs: z.number().min(1),
  redis: redisConfigSchema,
});

const securityConfigSchema = z.object({
  jwtSecret: z.string().min(32),
  jwtExpiration: z.string(),
  apiKeyHeader: z.string(),
  enableRBAC: z.boolean(),
  rateLimiting: rateLimitConfigSchema,
});

const observabilityConfigSchema = z.object({
  enableMetrics: z.boolean(),
  metricsPort: z.number().min(1).max(65535),
  enableTracing: z.boolean(),
  jaegerEndpoint: z.string().optional(),
});

const guardrailsConfigSchema = z.object({
  enablePIIFilter: z.boolean(),
  enableToxicityFilter: z.boolean(),
  toxicityThreshold: z.number().min(0).max(1),
  customFilters: z.array(z.string()).optional(),
});

const loadBalancingConfigSchema = z.object({
  enabled: z.boolean(),
  strategy: z.enum(['round-robin', 'latency-based', 'weighted', 'least-connections']),
  enableFailover: z.boolean(),
  healthCheckInterval: z.number().optional(),
});

/**
 * Load configuration from environment variables
 */
export function loadConfig(): GatewayConfig {
  const config: GatewayConfig = {
    server: {
      port: parseInt(process.env.PORT || '3000', 10),
      host: process.env.HOST || '0.0.0.0',
      environment: (process.env.NODE_ENV as 'development' | 'production' | 'staging') || 'development',
      logLevel: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
    },
    providers: loadProviderConfigs(),
    security: {
      jwtSecret: process.env.JWT_SECRET || '',
      jwtExpiration: process.env.JWT_EXPIRATION || '24h',
      apiKeyHeader: process.env.API_KEY_HEADER || 'X-API-Key',
      enableRBAC: process.env.ENABLE_RBAC === 'true',
      rateLimiting: {
        enabled: process.env.ENABLE_RATE_LIMITING !== 'false',
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
        redis: process.env.REDIS_HOST
          ? {
              host: process.env.REDIS_HOST,
              port: parseInt(process.env.REDIS_PORT || '6379', 10),
              password: process.env.REDIS_PASSWORD,
              db: parseInt(process.env.REDIS_DB || '0', 10),
            }
          : undefined,
      },
    },
    observability: {
      enableMetrics: process.env.ENABLE_METRICS === 'true',
      metricsPort: parseInt(process.env.METRICS_PORT || '9090', 10),
      enableTracing: process.env.ENABLE_TRACING === 'true',
      jaegerEndpoint: process.env.JAEGER_ENDPOINT,
    },
    guardrails: {
      enablePIIFilter: process.env.ENABLE_PII_FILTER === 'true',
      enableToxicityFilter: process.env.ENABLE_TOXICITY_FILTER === 'true',
      toxicityThreshold: parseFloat(process.env.TOXICITY_THRESHOLD || '0.7'),
    },
    loadBalancing: {
      enabled: process.env.ENABLE_LOAD_BALANCING === 'true',
      strategy: (process.env.LOAD_BALANCING_STRATEGY as any) || 'latency-based',
      enableFailover: process.env.ENABLE_FAILOVER !== 'false',
      healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000', 10),
    },
  };

  // Validate configuration
  validateConfig(config);

  return config;
}

/**
 * Load provider configurations from environment
 */
function loadProviderConfigs(): any[] {
  const providers: any[] = [];

  // OpenAI
  if (process.env.OPENAI_API_KEY) {
    providers.push({
      name: 'openai' as LLMProvider,
      apiKey: process.env.OPENAI_API_KEY,
      enabled: true,
      models: [
        {
          name: 'gpt-4',
          displayName: 'GPT-4',
          maxTokens: 8192,
          costPer1kPromptTokens: 0.03,
          costPer1kCompletionTokens: 0.06,
          supportsStreaming: true,
        },
        {
          name: 'gpt-4-turbo-preview',
          displayName: 'GPT-4 Turbo',
          maxTokens: 128000,
          costPer1kPromptTokens: 0.01,
          costPer1kCompletionTokens: 0.03,
          supportsStreaming: true,
        },
        {
          name: 'gpt-3.5-turbo',
          displayName: 'GPT-3.5 Turbo',
          maxTokens: 16384,
          costPer1kPromptTokens: 0.0005,
          costPer1kCompletionTokens: 0.0015,
          supportsStreaming: true,
        },
      ],
    });
  }

  // Anthropic
  if (process.env.ANTHROPIC_API_KEY) {
    providers.push({
      name: 'anthropic' as LLMProvider,
      apiKey: process.env.ANTHROPIC_API_KEY,
      enabled: true,
      models: [
        {
          name: 'claude-3-opus-20240229',
          displayName: 'Claude 3 Opus',
          maxTokens: 200000,
          costPer1kPromptTokens: 0.015,
          costPer1kCompletionTokens: 0.075,
          supportsStreaming: true,
        },
        {
          name: 'claude-3-sonnet-20240229',
          displayName: 'Claude 3 Sonnet',
          maxTokens: 200000,
          costPer1kPromptTokens: 0.003,
          costPer1kCompletionTokens: 0.015,
          supportsStreaming: true,
        },
        {
          name: 'claude-3-haiku-20240307',
          displayName: 'Claude 3 Haiku',
          maxTokens: 200000,
          costPer1kPromptTokens: 0.00025,
          costPer1kCompletionTokens: 0.00125,
          supportsStreaming: true,
        },
      ],
    });
  }

  // Google
  if (process.env.GOOGLE_API_KEY) {
    providers.push({
      name: 'google' as LLMProvider,
      apiKey: process.env.GOOGLE_API_KEY,
      enabled: true,
      models: [
        {
          name: 'gemini-pro',
          displayName: 'Gemini Pro',
          maxTokens: 32760,
          costPer1kPromptTokens: 0.0005,
          costPer1kCompletionTokens: 0.0015,
          supportsStreaming: true,
        },
      ],
    });
  }

  return providers;
}

/**
 * Validate the configuration
 */
function validateConfig(config: GatewayConfig): void {
  try {
    serverConfigSchema.parse(config.server);
    securityConfigSchema.parse(config.security);
    observabilityConfigSchema.parse(config.observability);
    guardrailsConfigSchema.parse(config.guardrails);
    loadBalancingConfigSchema.parse(config.loadBalancing);

    // Ensure at least one provider is configured
    if (config.providers.length === 0) {
      throw new Error('At least one LLM provider must be configured');
    }

    // Validate JWT secret in production
    if (config.server.environment === 'production' && config.security.jwtSecret.length < 32) {
      throw new Error('JWT secret must be at least 32 characters in production');
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new Error(`Configuration validation failed: ${messages}`);
    }
    throw error;
  }
}

// Export singleton instance
export const config = loadConfig();
