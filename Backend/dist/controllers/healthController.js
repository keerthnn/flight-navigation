"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthController = healthController;
exports.providersController = providersController;
const env_1 = require("../config/env");
function healthController(_req, res) {
    res.json({
        status: 'ok',
        service: 'flight-navigation-backend',
        timestamp: new Date().toISOString(),
    });
}
function providersController(_req, res) {
    res.json({
        flightPlans: {
            mode: env_1.env.FLIGHT_PLAN_DB_API_KEY ? 'flightplandb-live' : 'generated-fallback',
            configured: Boolean(env_1.env.FLIGHT_PLAN_DB_API_KEY),
            fallback: 'generated great-circle route provider',
        },
        aviationWeather: {
            mode: 'aviationweather.gov-primary',
            fallback: 'open-meteo, then deterministic synthetic weather',
            configured: true,
        },
        airports: {
            mode: 'bundled-csv',
            fallback: 'OurAirports-compatible CSV import boundary',
            configured: true,
        },
        fuel: {
            mode: 'local-estimator',
            fallback: 'provider interface ready for verified fuel APIs',
            configured: true,
        },
        realtime: {
            mode: 'websocket-route-simulation',
            path: '/ws/simulation?flightPlanId=<id>&aircraft=A320',
        },
    });
}
