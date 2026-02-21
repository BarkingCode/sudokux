/**
 * Sentry Service - Centralized error tracking and performance monitoring
 */
import * as Sentry from '@sentry/react-native';

// Set user context when user is identified
export const setSentryUser = (userId: string, displayName?: string) => {
  Sentry.setUser({ id: userId, username: displayName });
};

export const clearSentryUser = () => {
  Sentry.setUser(null);
};

// Add breadcrumb for game events
export const addGameBreadcrumb = (message: string, data?: Record<string, any>) => {
  Sentry.addBreadcrumb({
    category: 'game',
    message,
    data,
    level: 'info',
  });
};

// Add breadcrumb for ad events
export const addAdBreadcrumb = (message: string, data?: Record<string, any>) => {
  Sentry.addBreadcrumb({
    category: 'ads',
    message,
    data,
    level: 'info',
  });
};

// Capture non-fatal errors with context
export const captureGameError = (error: Error, context?: Record<string, any>) => {
  Sentry.withScope((scope) => {
    scope.setTag('domain', 'game');
    if (context) scope.setExtras(context);
    Sentry.captureException(error);
  });
};

export const captureAdError = (error: Error, adType: string, context?: Record<string, any>) => {
  Sentry.withScope((scope) => {
    scope.setTag('domain', 'ads');
    scope.setTag('ad_type', adType);
    if (context) scope.setExtras(context);
    Sentry.captureException(error);
  });
};

export const captureServiceError = (service: string, error: Error, context?: Record<string, any>) => {
  Sentry.withScope((scope) => {
    scope.setTag('domain', 'service');
    scope.setTag('service', service);
    if (context) scope.setExtras(context);
    Sentry.captureException(error);
  });
};

// Performance monitoring
export const startTransaction = (name: string, op: string) => {
  return Sentry.startInactiveSpan({ name, op });
};
