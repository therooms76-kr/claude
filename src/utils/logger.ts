/**
 * Centralized logging utility using Pino
 */
import pino from 'pino';
import { config } from '../config/config';

export const logger = pino({
  level: config.server.logLevel,
  transport:
    config.server.environment === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  base: {
    env: config.server.environment,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export default logger;
