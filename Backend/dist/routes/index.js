"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApiRoutes = createApiRoutes;
const express_1 = require("express");
const healthController_1 = require("../controllers/healthController");
const monitoringRoutes_1 = require("../monitoring/monitoringRoutes");
const flightRoutes_1 = require("./flightRoutes");
function createApiRoutes(flightController) {
    const router = (0, express_1.Router)();
    router.get('/health', healthController_1.healthController);
    router.get('/providers', healthController_1.providersController);
    router.use('/monitoring', (0, monitoringRoutes_1.createMonitoringRoutes)());
    router.use('/', (0, flightRoutes_1.createFlightRoutes)(flightController));
    return router;
}
