"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fuelSchema = exports.airportSearchSchema = exports.flightTrackSchema = exports.liveFlightSchema = exports.activeFlightsSchema = exports.routeIntelligenceSchema = exports.flightPlanDetailSchema = exports.createRouteSchema = exports.searchFlightPlansSchema = void 0;
const zod_1 = require("zod");
const icaoCode = zod_1.z.string().trim().min(3).max(4).transform((value) => value.toUpperCase());
const provider = zod_1.z.enum(['opensky', 'adsblol', 'mock']);
exports.searchFlightPlansSchema = zod_1.z.object({
    query: zod_1.z.object({
        fromICAO: icaoCode,
        toICAO: icaoCode,
        limit: zod_1.z.coerce.number().int().min(1).max(25).default(10),
    }),
});
exports.createRouteSchema = zod_1.z.object({
    body: zod_1.z.object({
        fromICAO: icaoCode,
        toICAO: icaoCode,
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
exports.activeFlightsSchema = zod_1.z.object({
    query: zod_1.z.object({
        radiusKm: zod_1.z.coerce.number().min(25).max(600).default(150),
        limit: zod_1.z.coerce.number().int().min(1).max(100).default(25),
    }),
    params: zod_1.z.object({
        id: zod_1.z.string().trim().min(3),
    }),
});
exports.liveFlightSchema = zod_1.z.object({
    query: zod_1.z.object({
        routeId: zod_1.z.string().trim().optional(),
    }),
    params: zod_1.z.object({
        provider,
        flightId: zod_1.z.string().trim().min(2),
    }),
});
exports.flightTrackSchema = zod_1.z.object({
    params: zod_1.z.object({
        provider,
        flightId: zod_1.z.string().trim().min(2),
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
