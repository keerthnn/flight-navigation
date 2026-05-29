import { z } from 'zod';

export const liveFlightStreamParamsSchema = z.object({
  provider: z.enum(['opensky', 'adsblol', 'mock']),
  flightId: z.string().trim().min(2),
});

export const liveFlightStreamQuerySchema = z.object({
  routeId: z.string().trim().optional(),
  intervalMs: z.coerce.number().int().min(5000).max(15000).default(10000),
});
