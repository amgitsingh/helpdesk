import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV ?? 'development',
  // Only enable Sentry when a DSN is configured
  enabled: !!process.env.SENTRY_DSN,
});
