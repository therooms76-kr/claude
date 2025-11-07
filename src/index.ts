/**
 * Main entry point for TS GenAI Gateway
 */
import { createApp } from './app';
import { config } from './config/config';
import { logger } from './utils/logger';

async function start(): Promise<void> {
  try {
    logger.info('Starting TS GenAI Gateway...');
    logger.info({
      environment: config.server.environment,
      port: config.server.port,
      host: config.server.host,
    });

    const app = await createApp();

    await app.listen({
      port: config.server.port,
      host: config.server.host,
    });

    logger.info(
      `✅ TS GenAI Gateway is running on http://${config.server.host}:${config.server.port}`
    );
    logger.info(`📊 Health check: http://${config.server.host}:${config.server.port}/health`);
    logger.info(`🎯 API endpoint: http://${config.server.host}:${config.server.port}/v1/chat/completions`);

    // Graceful shutdown
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
    signals.forEach((signal) => {
      process.on(signal, async () => {
        logger.info(`Received ${signal}, shutting down gracefully...`);
        await app.close();
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error(error, 'Failed to start server');
    process.exit(1);
  }
}

// Start the server
void start();
