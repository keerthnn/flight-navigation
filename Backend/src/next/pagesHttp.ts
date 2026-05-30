import { NextApiRequest, NextApiResponse } from 'next';
import { ZodError } from 'zod';
import { corsOrigins } from '../config/env';
import { logger } from '../config/logger';
import { HttpError } from '../utils/httpError';

export function queryObject(request: NextApiRequest): Record<string, string> {
  const query = request.query;
  const entries = Object.entries(query).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]);
  return Object.fromEntries(entries) as Record<string, string>;
}

export function handleApiError(error: unknown): { status: number; body: unknown } {
  if (error instanceof ZodError) {
    return { status: 400, body: { error: 'Invalid request', details: error.flatten() } };
  }

  if (error instanceof HttpError) {
    return { status: error.statusCode, body: { error: error.message, details: error.details } };
  }

  logger.error({ err: error }, 'Unhandled API error');
  return { status: 500, body: { error: 'Unexpected server error' } };
}

export function applyCors(req: NextApiRequest, res: NextApiResponse): boolean {
  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : undefined;
  const allowedOrigin = origin && corsOrigins.includes(origin) ? origin : undefined;

  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }

  return false;
}
