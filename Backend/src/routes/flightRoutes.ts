import { Router } from 'express';
import { FlightController } from '../controllers/flightController';
import { validate } from '../middlewares/validate';
import {
  airportSearchSchema,
  flightPlanDetailSchema,
  fuelSchema,
  routeIntelligenceSchema,
  searchFlightPlansSchema,
} from '../validators/flightSchemas';

export function createFlightRoutes(controller: FlightController): Router {
  const router = Router();

  router.get('/airports', validate(airportSearchSchema), controller.searchAirports);
  router.get('/flightplans', validate(searchFlightPlansSchema), controller.searchFlightPlans);
  router.get('/flightplan/:id', validate(flightPlanDetailSchema), controller.getFlightPlan);
  router.get('/flightplan/:id/intelligence', validate(routeIntelligenceSchema), controller.getRouteIntelligence);
  router.get('/fuel-data', validate(fuelSchema), controller.getFuelEstimate);

  return router;
}
