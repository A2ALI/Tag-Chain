import * as Sentry from '@sentry/browser';

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const handleError = (error: unknown) => {
  if (error instanceof AppError) {
    console.error(`[${error.code}] ${error.message}`);
    Sentry.captureException(error);
  } else {
    console.error('Unexpected error:', error);
    Sentry.captureException(error);
  }
  throw error;
};