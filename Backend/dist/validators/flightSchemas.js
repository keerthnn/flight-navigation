"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fuelSchema = exports.airportSearchSchema = exports.routeIntelligenceSchema = exports.flightPlanDetailSchema = exports.searchFlightPlansSchema = void 0;
const zod_1 = require("zod");
const icaoCode = zod_1.z.string().trim().min(3).max(4).transform((value) => value.toUpperCase());
exports.searchFlightPlansSchema = zod_1.z.object({
    query: zod_1.z.object({
        fromICAO: icaoCode,
        toICAO: icaoCode,
        limit: zod_1.z.coerce.number().int().min(1).max(25).default(10),
    }),
});
exports.flightPlanDetailSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().trim().min(3),
    }),
});
exports.routeIntelligenceSchema = zod_1.z.object({
    query: zod_1.z.object({
        aircraft: zod_1.z.string().trim().default('A320'),
    }),
    params: zod_1.z.object({
        id: zod_1.z.string().trim().min(3),
    }),
});
exports.airportSearchSchema = zod_1.z.object({
    query: zod_1.z.object({
        q: zod_1.z.string().trim().min(1),
        limit: zod_1.z.coerce.number().int().min(1).max(20).default(8),
    }),
});
exports.fuelSchema = zod_1.z.object({
    query: zod_1.z.object({
        aircraft: zod_1.z.string().trim().default('A320'),
        distance: zod_1.z.coerce.number().positive(),
    }),
});
