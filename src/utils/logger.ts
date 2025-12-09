/**
 * Debug logger utility with controlled output.
 * Only logs in development mode (__DEV__), silent in production.
 * Provides scoped logging for easier debugging.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogData {
  [key: string]: unknown;
}

const formatMessage = (scope: string, message: string): string => {
  return `[${scope}] ${message}`;
};

const formatData = (data?: LogData): string => {
  if (!data) return '';
  return JSON.stringify(data, null, 2);
};

/**
 * Logger with scoped output that only logs in development.
 *
 * Usage:
 * ```typescript
 * import { logger } from '../utils/logger';
 *
 * logger.debug('FreeRun', 'Starting game', { difficulty: 'easy' });
 * logger.info('Ads', 'Ad loaded successfully');
 * logger.warn('Network', 'Connection unstable');
 * logger.error('Game', 'Failed to save state', { error });
 * ```
 */
export const logger = {
  /**
   * Debug level logging - for detailed debugging information
   */
  debug: (scope: string, message: string, data?: LogData): void => {
    if (__DEV__) {
      if (data) {
        console.log(formatMessage(scope, message), data);
      } else {
        console.log(formatMessage(scope, message));
      }
    }
  },

  /**
   * Info level logging - for general information
   */
  info: (scope: string, message: string, data?: LogData): void => {
    if (__DEV__) {
      if (data) {
        console.info(formatMessage(scope, message), data);
      } else {
        console.info(formatMessage(scope, message));
      }
    }
  },

  /**
   * Warning level logging - for potential issues
   */
  warn: (scope: string, message: string, data?: LogData): void => {
    if (__DEV__) {
      if (data) {
        console.warn(formatMessage(scope, message), data);
      } else {
        console.warn(formatMessage(scope, message));
      }
    }
  },

  /**
   * Error level logging - for errors and exceptions
   */
  error: (scope: string, message: string, data?: LogData): void => {
    if (__DEV__) {
      if (data) {
        console.error(formatMessage(scope, message), data);
      } else {
        console.error(formatMessage(scope, message));
      }
    }
  },
};

/**
 * Create a scoped logger for a specific module.
 *
 * Usage:
 * ```typescript
 * import { createScopedLogger } from '../utils/logger';
 *
 * const log = createScopedLogger('FreeRun');
 * log.debug('Starting game', { difficulty: 'easy' });
 * log.info('Game completed');
 * ```
 */
export const createScopedLogger = (scope: string) => ({
  debug: (message: string, data?: LogData) => logger.debug(scope, message, data),
  info: (message: string, data?: LogData) => logger.info(scope, message, data),
  warn: (message: string, data?: LogData) => logger.warn(scope, message, data),
  error: (message: string, data?: LogData) => logger.error(scope, message, data),
});

export default logger;
