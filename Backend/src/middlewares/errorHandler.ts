import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger';
import { HttpError } from '../utils/httpError';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new HttpError(404, `Route not found: ${req.method} ${req.path}`));
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof ZodError) {
    res.status(400).json({ error: 'Invalid request', details: error.flatten() });
    return;
  }

  if (error instanceof HttpError) {
    res.status(error.statusCode).json({ error: error.message, details: error.details });
    return;
  }

  logger.error({ err: error }, 'Unhandled API error');
  res.status(500).json({ error: 'Unexpected server error' });
}
