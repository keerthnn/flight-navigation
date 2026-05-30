import { NextApiRequest } from 'next';
import { z } from 'zod';

export function queryObject(request: NextApiRequest): Record<string, string> {
  const entries = Object.entries(request.query).map(([key, value]) => [
    key,
    Array.isArray(value) ? value[0] : value,
  ]);
  return Object.fromEntries(entries) as Record<string, string>;
}

export function paramsObject(request: NextApiRequest): Record<string, string> {
  return queryObject(request);
}

export function validateRequest<T extends z.ZodTypeAny>(
  req: NextApiRequest,
  schema?: T,
): z.output<T> | { query: Record<string, string>; params: Record<string, string>; body: unknown } {
  const input = {
    query: queryObject(req),
    params: paramsObject(req),
    body: req.body,
  };

  if (!schema) return input;
  return schema.parse(input);
}
