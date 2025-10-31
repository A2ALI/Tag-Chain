// Mock Sentry implementation for now
export function initSentry() {
  if(!process.env.SENTRY_DSN) {
    console.warn('Sentry DSN not configured')
    return
  }

  console.log('✅ Sentry initialized')
}