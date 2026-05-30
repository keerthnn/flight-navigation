import { Router } from "express";
import { FlightController } from "../controllers/flightController";
import { asyncHandler } from "../middlewares/asyncHandler";
import { validate } from "../middlewares/validate";
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
} from "../validators/flightSchemas";

export function createFlightRoutes(controller: FlightController): Router {
  const router = Router();

  router.get(
    "/airports",
    validate(airportSearchSchema),
    asyncHandler(controller.searchAirports),
  );
  router.get(
    "/airports/search",
    validate(airportSearchSchema),
    asyncHandler(controller.searchAirports),
  );
  router.post(
    "/routes",
    validate(createRouteSchema),
    asyncHandler(controller.createRoute),
  );
  router.get(
    "/routes/:id/active-flights",
    validate(activeFlightsSchema),
    asyncHandler(controller.getActiveFlights),
  );
  router.get(
    "/flights/:provider/:flightId",
    validate(liveFlightSchema),
    asyncHandler(controller.getLiveFlight),
  );
  router.get(
    "/flights/:provider/:flightId/track",
    validate(flightTrackSchema),
    asyncHandler(controller.getFlightTrack),
  );
  router.get(
    "/flightplans",
    validate(searchFlightPlansSchema),
    asyncHandler(controller.searchFlightPlans),
  );
  router.get(
    "/flightplan/:id",
    validate(flightPlanDetailSchema),
    asyncHandler(controller.getFlightPlan),
  );
  router.get(
    "/flightplan/:id/intelligence",
    validate(routeIntelligenceSchema),
    asyncHandler(controller.getRouteIntelligence),
  );
  router.get(
    "/flightplan/:id/active-flights",
    validate(activeFlightsSchema),
    asyncHandler(controller.getActiveFlights),
  );
  router.get(
    "/fuel-data",
    validate(fuelSchema),
    asyncHandler(controller.getFuelEstimate),
  );

  return router;
}
