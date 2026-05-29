"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routeSimulationQuerySchema = void 0;
const zod_1 = require("zod");
exports.routeSimulationQuerySchema = zod_1.z.object({
    flightPlanId: zod_1.z.string().trim().min(3),
    aircraft: zod_1.z.string().trim().default('A320'),
    intervalMs: zod_1.z.coerce.number().int().min(100).max(5000).default(750),
});
