# TS GenAI Gateway

Enterprise TypeScript GenAI Gateway for unified LLM API access with observability, access control, and guardrails.

## Features

- 🚀 **Unified LLM API Access**: Single API for 250+ LLMs (OpenAI, Anthropic Claude, Google Gemini, Groq, Mistral, and more)
- 📊 **Observability**: Comprehensive metrics, logging, and distributed tracing
- 🔒 **Access Control**: RBAC, OAuth 2.0, API key authentication, and rate limiting
- 💰 **Quota Management**: Token-based and cost-based quotas per user/team
- ⚡ **Load Balancing**: Latency-based, weighted, and round-robin strategies
- 🔄 **Automatic Failover**: Seamless fallback to alternative providers
- 🛡️ **Guardrails**: PII filtering, toxicity detection, and content moderation
- 🏢 **Enterprise Ready**: SOC 2, HIPAA, and GDPR compliance support

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Redis (optional, for distributed rate limiting)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env and add your API keys
nano .env
```

### Configuration

Edit `.env` file and configure:

```env
# Server
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# LLM Provider API Keys
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GOOGLE_API_KEY=your_google_api_key

# Security
JWT_SECRET=your_secure_jwt_secret_min_32_chars
```

### Running

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## API Endpoints

### Health & Status

```bash
# Health check
GET /health

# Readiness check
GET /ready

# Liveness check
GET /live

# Status and configuration
GET /status
```

### Chat Completions

```bash
# Create chat completion
POST /v1/chat/completions
Headers:
  X-API-Key: your_api_key
  Content-Type: application/json

Body:
{
  "model": "gpt-4",
  "messages": [
    {"role": "user", "content": "Hello!"}
  ],
  "temperature": 0.7,
  "maxTokens": 1000
}
```

### Models

```bash
# List available models
GET /v1/models
```

## Architecture

```
src/
├── config/         # Configuration management
├── providers/      # LLM provider integrations
├── routes/         # API route handlers
├── middleware/     # Express/Fastify middleware
├── services/       # Business logic services
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
├── guardrails/     # Safety and compliance filters
├── observability/  # Metrics, logging, tracing
├── app.ts          # Fastify app setup
└── index.ts        # Entry point
```

## Development

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format
```

## Supported Providers

- **OpenAI**: GPT-4, GPT-4 Turbo, GPT-3.5 Turbo
- **Anthropic**: Claude 3 Opus, Claude 3 Sonnet, Claude 3 Haiku
- **Google**: Gemini Pro
- **Groq**: LLaMA models with high-speed inference
- **Mistral**: Mistral Large, Mistral Medium, Mistral Small
- **Self-hosted**: vLLM, SGLang, TGI, KServe, Triton

## Configuration Options

### Load Balancing

- `round-robin`: Distribute requests evenly
- `latency-based`: Route to fastest provider
- `weighted`: Custom weights per provider
- `least-connections`: Route to least busy provider

### Guardrails

- PII detection and filtering
- Toxicity detection
- Content moderation
- Custom filters

### Observability

- Prometheus metrics
- Structured logging with Pino
- Distributed tracing with Jaeger
- Request/response logging

## License

MIT
