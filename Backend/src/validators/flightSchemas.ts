import { z } from 'zod';

const icaoCode = z.string().trim().min(3).max(4).transform((value) => value.toUpperCase());
const provider = z.enum(['opensky', 'adsblol', 'mock']);

export const searchFlightPlansSchema = z.object({
  query: z.object({
    fromICAO: icaoCode,
    toICAO: icaoCode,
    limit: z.coerce.number().int().min(1).max(25).default(10),
  }),
});

export const createRouteSchema = z.object({
  body: z.object({
    fromICAO: icaoCode,
    toICAO: icaoCode,
  }),
});

export const flightPlanDetailSchema = z.object({
  params: z.object({
    id: z.string().trim().min(3),
  }),
});

export const routeIntelligenceSchema = z.object({
  query: z.object({
    aircraft: z.string().trim().default('A320'),
  }),
  params: z.object({
    id: z.string().trim().min(3),
  }),
});

export const activeFlightsSchema = z.object({
  query: z.object({
    radiusKm: z.coerce.number().min(25).max(600).default(150),
    limit: z.coerce.number().int().min(1).max(100).default(25),
  }),
  params: z.object({
    id: z.string().trim().min(3),
  }),
});

export const liveFlightSchema = z.object({
  query: z.object({
    routeId: z.string().trim().optional(),
  }),
  params: z.object({
    provider,
    flightId: z.string().trim().min(2),
  }),
});

export const flightTrackSchema = z.object({
  params: z.object({
    provider,
    flightId: z.string().trim().min(2),
  }),
});

export const airportSearchSchema = z.object({
  query: z.object({
    q: z.string().trim().min(1),
    limit: z.coerce.number().int().min(1).max(20).default(8),
  }),
});

export const fuelSchema = z.object({
  query: z.object({
    aircraft: z.string().trim().default('A320'),
    distance: z.coerce.number().positive(),
  }),
});
