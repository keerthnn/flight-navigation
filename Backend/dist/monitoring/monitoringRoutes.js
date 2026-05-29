"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMonitoringRoutes = createMonitoringRoutes;
const express_1 = require("express");
const monitoringController_1 = require("./monitoringController");
function createMonitoringRoutes() {
    const router = (0, express_1.Router)();
    router.get('/metrics', monitoringController_1.metricsController);
    return router;
}
