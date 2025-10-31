import * as Sentry from '@sentry/nextjs'

export function initSentry() {
  if(!process.env.SENTRY_DSN) {
    console.warn('Sentry DSN not configured')
    return
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV || 'development',
    release: 'tagchain@' + (process.env.npm_package_version || '0.0.1'),
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  })
  console.log('✅ Sentry initialized')
}