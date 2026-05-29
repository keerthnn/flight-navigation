"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.liveFlightStreamQuerySchema = exports.liveFlightStreamParamsSchema = void 0;
const zod_1 = require("zod");
exports.liveFlightStreamParamsSchema = zod_1.z.object({
    provider: zod_1.z.enum(['opensky', 'adsblol', 'mock']),
    flightId: zod_1.z.string().trim().min(2),
});
exports.liveFlightStreamQuerySchema = zod_1.z.object({
    routeId: zod_1.z.string().trim().optional(),
    intervalMs: zod_1.z.coerce.number().int().min(5000).max(15000).default(10000),
});
