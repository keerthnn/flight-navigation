"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFlightRoutes = createFlightRoutes;
const express_1 = require("express");
const validate_1 = require("../middlewares/validate");
const flightSchemas_1 = require("../validators/flightSchemas");
function createFlightRoutes(controller) {
    const router = (0, express_1.Router)();
    router.get('/airports', (0, validate_1.validate)(flightSchemas_1.airportSearchSchema), controller.searchAirports);
    router.get('/flightplans', (0, validate_1.validate)(flightSchemas_1.searchFlightPlansSchema), controller.searchFlightPlans);
    router.get('/flightplan/:id', (0, validate_1.validate)(flightSchemas_1.flightPlanDetailSchema), controller.getFlightPlan);
    router.get('/flightplan/:id/intelligence', (0, validate_1.validate)(flightSchemas_1.routeIntelligenceSchema), controller.getRouteIntelligence);
    router.get('/fuel-data', (0, validate_1.validate)(flightSchemas_1.fuelSchema), controller.getFuelEstimate);
    return router;
}
