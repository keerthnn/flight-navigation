"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricsController = metricsController;
const memoryCache_1 = require("../cache/memoryCache");
const metrics_1 = require("./metrics");
function metricsController(_req, res) {
    res.json(metrics_1.metrics.snapshot(memoryCache_1.cache.size()));
}
