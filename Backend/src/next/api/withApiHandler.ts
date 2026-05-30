import { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import { ZodTypeAny, z } from 'zod';
import { corsOrigins } from '../../config/env';
import { mapApiError } from './apiError';
import { validateRequest } from './validate';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type HandlerContext<TSchema extends ZodTypeAny | undefined> = {
  req: NextApiRequest;
  res: NextApiResponse;
  parsed: TSchema extends ZodTypeAny
    ? z.output<TSchema>
    : { query: Record<string, string>; params: Record<string, string>; body: unknown };
};

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

export function withApiHandler<TSchema extends ZodTypeAny | undefined>(options: {
  method: Method;
  schema?: TSchema;
  handler: (ctx: HandlerContext<TSchema>) => Promise<void> | void;
}): NextApiHandler {
  return async function wrapped(req, res) {
    if (applyCors(req, res)) return;

    if (req.method !== options.method) {
      res.setHeader('Allow', `${options.method},OPTIONS`);
      return res.status(405).json({ error: `Method ${req.method ?? 'UNKNOWN'} not allowed` });
    }

    try {
      const parsed = validateRequest(req, options.schema as TSchema);
      await options.handler({ req, res, parsed } as HandlerContext<TSchema>);
    } catch (error) {
      const failure = mapApiError(error);
      return res.status(failure.status).json(failure.body);
    }
  };
}
