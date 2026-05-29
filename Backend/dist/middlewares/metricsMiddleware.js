"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricsMiddleware = metricsMiddleware;
const metrics_1 = require("../monitoring/metrics");
function metricsMiddleware(req, res, next) {
    res.on('finish', () => metrics_1.metrics.recordRequest(req.method, res.statusCode));
    next();
}
