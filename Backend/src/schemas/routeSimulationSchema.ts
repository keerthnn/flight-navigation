import { z } from 'zod';

export const routeSimulationQuerySchema = z.object({
  flightPlanId: z.string().trim().min(3),
  aircraft: z.string().trim().default('A320'),
  intervalMs: z.coerce.number().int().min(100).max(5000).default(750),
});

export type RouteSimulationQuery = z.infer<typeof routeSimulationQuerySchema>;
