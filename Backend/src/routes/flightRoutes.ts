import { Router } from 'express';
import { FlightController } from '../controllers/flightController';
import { validate } from '../middlewares/validate';
import {
  airportSearchSchema,
  activeFlightsSchema,
  createRouteSchema,
  flightTrackSchema,
  flightPlanDetailSchema,
  fuelSchema,
  liveFlightSchema,
  routeIntelligenceSchema,
  searchFlightPlansSchema,
} from '../validators/flightSchemas';

export function createFlightRoutes(controller: FlightController): Router {
  const router = Router();

  router.get('/airports', validate(airportSearchSchema), controller.searchAirports);
  router.get('/airports/search', validate(airportSearchSchema), controller.searchAirports);
  router.post('/routes', validate(createRouteSchema), controller.createRoute);
  router.get('/routes/:id/active-flights', validate(activeFlightsSchema), controller.getActiveFlights);
  router.get('/flights/:provider/:flightId', validate(liveFlightSchema), controller.getLiveFlight);
  router.get('/flights/:provider/:flightId/track', validate(flightTrackSchema), controller.getFlightTrack);
  router.get('/flightplans', validate(searchFlightPlansSchema), controller.searchFlightPlans);
  router.get('/flightplan/:id', validate(flightPlanDetailSchema), controller.getFlightPlan);
  router.get('/flightplan/:id/intelligence', validate(routeIntelligenceSchema), controller.getRouteIntelligence);
  router.get('/flightplan/:id/active-flights', validate(activeFlightsSchema), controller.getActiveFlights);
  router.get('/fuel-data', validate(fuelSchema), controller.getFuelEstimate);

  return router;
}
