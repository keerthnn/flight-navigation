import { NextApiRequest, NextApiResponse } from 'next';
import { serviceContainer } from '@/src/next/serviceContainer';
import {
  activeFlightsSchema,
  airportSearchSchema,
  createRouteSchema,
  flightPlanDetailSchema,
  flightTrackSchema,
  fuelSchema,
  liveFlightSchema,
  routeIntelligenceSchema,
  searchFlightPlansSchema,
} from '@/src/validators/flightSchemas';
import { applyCors, handleApiError, queryObject } from '@/src/next/pagesHttp';

function getSlug(req: NextApiRequest): string[] {
  const value = req.query.slug;
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (applyCors(req, res)) return;

  try {
    const slug = getSlug(req);
    const method = req.method ?? 'GET';

    if (method === 'GET' && slug.length === 1 && slug[0] === 'airports') {
      const parsed = airportSearchSchema.parse({ query: queryObject(req) });
      const result = await serviceContainer.flightService.searchAirports(parsed.query.q, parsed.query.limit);
      return res.status(200).json(result);
    }

    if (method === 'GET' && slug.length === 2 && slug[0] === 'airports' && slug[1] === 'search') {
      const parsed = airportSearchSchema.parse({ query: queryObject(req) });
      const result = await serviceContainer.flightService.searchAirports(parsed.query.q, parsed.query.limit);
      return res.status(200).json(result);
    }

    if (method === 'POST' && slug.length === 1 && slug[0] === 'routes') {
      const parsed = createRouteSchema.parse({ body: req.body });
      const result = await serviceContainer.flightService.createRoute(parsed.body.fromICAO, parsed.body.toICAO);
      return res.status(201).json(result);
    }

    if (method === 'GET' && slug.length === 3 && slug[0] === 'routes' && slug[2] === 'active-flights') {
      const parsed = activeFlightsSchema.parse({ params: { id: slug[1] }, query: queryObject(req) });
      const result = await serviceContainer.flightService.getActiveFlightsNearRoute(
        parsed.params.id,
        parsed.query.radiusKm,
        parsed.query.limit,
      );
      return res.status(200).json(result);
    }

    if (method === 'GET' && slug.length === 1 && slug[0] === 'flightplans') {
      const parsed = searchFlightPlansSchema.parse({ query: queryObject(req) });
      const result = await serviceContainer.flightService.searchFlightPlans(
        parsed.query.fromICAO,
        parsed.query.toICAO,
        parsed.query.limit,
      );
      return res.status(200).json(result);
    }

    if (method === 'GET' && slug.length === 2 && slug[0] === 'flightplan') {
      const parsed = flightPlanDetailSchema.parse({ params: { id: slug[1] } });
      const result = await serviceContainer.flightService.getFlightPlan(parsed.params.id);
      return res.status(200).json(result);
    }

    if (method === 'GET' && slug.length === 3 && slug[0] === 'flightplan' && slug[2] === 'intelligence') {
      const parsed = routeIntelligenceSchema.parse({ params: { id: slug[1] }, query: queryObject(req) });
      const result = await serviceContainer.flightService.getRouteIntelligence(parsed.params.id, parsed.query.aircraft);
      return res.status(200).json(result);
    }

    if (method === 'GET' && slug.length === 3 && slug[0] === 'flightplan' && slug[2] === 'active-flights') {
      const parsed = activeFlightsSchema.parse({ params: { id: slug[1] }, query: queryObject(req) });
      const result = await serviceContainer.flightService.getActiveFlightsNearRoute(
        parsed.params.id,
        parsed.query.radiusKm,
        parsed.query.limit,
      );
      return res.status(200).json(result);
    }

    if (method === 'GET' && slug.length === 3 && slug[0] === 'flights') {
      const parsed = liveFlightSchema.parse({
        params: { provider: slug[1], flightId: slug[2] },
        query: queryObject(req),
      });
      const result = await serviceContainer.flightService.getLiveFlight(
        parsed.params.provider,
        parsed.params.flightId,
        parsed.query.routeId,
      );
      return res.status(200).json(result);
    }

    if (method === 'GET' && slug.length === 4 && slug[0] === 'flights' && slug[3] === 'track') {
      const parsed = flightTrackSchema.parse({ params: { provider: slug[1], flightId: slug[2] } });
      const result = await serviceContainer.flightService.getFlightTrack(parsed.params.provider, parsed.params.flightId);
      return res.status(200).json(result);
    }

    if (method === 'GET' && slug.length === 1 && slug[0] === 'fuel-data') {
      const parsed = fuelSchema.parse({ query: queryObject(req) });
      const result = await serviceContainer.flightService.getFuelEstimate(parsed.query.aircraft, parsed.query.distance);
      return res.status(200).json(result);
    }

    return res.status(404).json({ error: `Route not found: ${method} /api/${slug.join('/')}` });
  } catch (error) {
    const failure = handleApiError(error);
    return res.status(failure.status).json(failure.body);
  }
}
