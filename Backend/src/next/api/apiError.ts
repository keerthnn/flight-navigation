import { ZodError } from 'zod';
import { logger } from '../../config/logger';
import { HttpError } from '../../utils/httpError';

export function mapApiError(error: unknown): { status: number; body: unknown } {
  if (error instanceof ZodError) {
    return { status: 400, body: { error: 'Invalid request', details: error.flatten() } };
  }

  if (error instanceof HttpError) {
    return { status: error.statusCode, body: { error: error.message, details: error.details } };
  }

  logger.error({ err: error }, 'Unhandled API error');
  return { status: 500, body: { error: 'Unexpected server error' } };
}
