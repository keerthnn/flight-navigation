"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFlightRoutes = createFlightRoutes;
const express_1 = require("express");
const validate_1 = require("../middlewares/validate");
const flightSchemas_1 = require("../validators/flightSchemas");
function createFlightRoutes(controller) {
    const router = (0, express_1.Router)();
    router.get('/airports', (0, validate_1.validate)(flightSchemas_1.airportSearchSchema), controller.searchAirports);
    router.get('/airports/search', (0, validate_1.validate)(flightSchemas_1.airportSearchSchema), controller.searchAirports);
    router.post('/routes', (0, validate_1.validate)(flightSchemas_1.createRouteSchema), controller.createRoute);
    router.get('/routes/:id/active-flights', (0, validate_1.validate)(flightSchemas_1.activeFlightsSchema), controller.getActiveFlights);
    router.get('/flights/:provider/:flightId', (0, validate_1.validate)(flightSchemas_1.liveFlightSchema), controller.getLiveFlight);
    router.get('/flights/:provider/:flightId/track', (0, validate_1.validate)(flightSchemas_1.flightTrackSchema), controller.getFlightTrack);
    router.get('/flightplans', (0, validate_1.validate)(flightSchemas_1.searchFlightPlansSchema), controller.searchFlightPlans);
    router.get('/flightplan/:id', (0, validate_1.validate)(flightSchemas_1.flightPlanDetailSchema), controller.getFlightPlan);
    router.get('/flightplan/:id/intelligence', (0, validate_1.validate)(flightSchemas_1.routeIntelligenceSchema), controller.getRouteIntelligence);
    router.get('/flightplan/:id/active-flights', (0, validate_1.validate)(flightSchemas_1.activeFlightsSchema), controller.getActiveFlights);
    router.get('/fuel-data', (0, validate_1.validate)(flightSchemas_1.fuelSchema), controller.getFuelEstimate);
    return router;
}
