/**
 * Core type definitions for TS GenAI Gateway
 */

// LLM Provider types
export enum LLMProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
  GROQ = 'groq',
  MISTRAL = 'mistral',
  CUSTOM = 'custom',
}

// Request & Response types
export interface LLMRequest {
  model: string;
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stream?: boolean;
  user?: string;
  metadata?: Record<string, unknown>;
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  id: string;
  model: string;
  provider: LLMProvider;
  choices: Choice[];
  usage: TokenUsage;
  latency: number;
  metadata?: Record<string, unknown>;
}

export interface Choice {
  index: number;
  message: Message;
  finishReason: string;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// Configuration types
export interface GatewayConfig {
  server: ServerConfig;
  providers: ProviderConfig[];
  security: SecurityConfig;
  observability: ObservabilityConfig;
  guardrails: GuardrailsConfig;
  loadBalancing: LoadBalancingConfig;
}

export interface ServerConfig {
  port: number;
  host: string;
  environment: 'development' | 'production' | 'staging';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface ProviderConfig {
  name: LLMProvider;
  apiKey: string;
  baseUrl?: string;
  models: ModelConfig[];
  enabled: boolean;
  priority?: number;
  timeout?: number;
}

export interface ModelConfig {
  name: string;
  displayName?: string;
  maxTokens: number;
  costPer1kPromptTokens: number;
  costPer1kCompletionTokens: number;
  supportsStreaming: boolean;
}

export interface SecurityConfig {
  jwtSecret: string;
  jwtExpiration: string;
  apiKeyHeader: string;
  enableRBAC: boolean;
  rateLimiting: RateLimitConfig;
}

export interface RateLimitConfig {
  enabled: boolean;
  maxRequests: number;
  windowMs: number;
  redis?: RedisConfig;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
}

export interface ObservabilityConfig {
  enableMetrics: boolean;
  metricsPort: number;
  enableTracing: boolean;
  jaegerEndpoint?: string;
}

export interface GuardrailsConfig {
  enablePIIFilter: boolean;
  enableToxicityFilter: boolean;
  toxicityThreshold: number;
  customFilters?: string[];
}

export interface LoadBalancingConfig {
  enabled: boolean;
  strategy: 'round-robin' | 'latency-based' | 'weighted' | 'least-connections';
  enableFailover: boolean;
  healthCheckInterval?: number;
}

// Authentication & Authorization types
export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  apiKeys: ApiKey[];
  quotas: UserQuota;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  DEVELOPER = 'developer',
  USER = 'user',
}

export interface ApiKey {
  key: string;
  name: string;
  enabled: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export interface UserQuota {
  maxRequests: number;
  maxTokens: number;
  maxCost: number;
  currentRequests: number;
  currentTokens: number;
  currentCost: number;
  resetAt: Date;
}

// Metrics types
export interface RequestMetrics {
  requestId: string;
  userId?: string;
  provider: LLMProvider;
  model: string;
  latency: number;
  tokenUsage: TokenUsage;
  cost: number;
  statusCode: number;
  timestamp: Date;
  error?: string;
}

// Guardrails types
export interface GuardrailResult {
  passed: boolean;
  violations: Violation[];
  filteredContent?: string;
}

export interface Violation {
  type: 'pii' | 'toxicity' | 'custom';
  severity: 'low' | 'medium' | 'high';
  description: string;
  location?: string;
}

// Load balancing types
export interface ProviderHealth {
  provider: LLMProvider;
  healthy: boolean;
  averageLatency: number;
  errorRate: number;
  lastChecked: Date;
}

export interface RoutingDecision {
  provider: LLMProvider;
  model: string;
  reason: string;
  alternativeProviders?: LLMProvider[];
}
