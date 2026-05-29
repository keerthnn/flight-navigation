"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const vitest_1 = require("vitest");
const app_1 = require("../app");
(0, vitest_1.describe)('flight navigation API', () => {
    const app = (0, app_1.createApp)();
    (0, vitest_1.it)('returns health status', async () => {
        const response = await (0, supertest_1.default)(app).get('/api/health').expect(200);
        (0, vitest_1.expect)(response.body.status).toBe('ok');
    });
    (0, vitest_1.it)('searches airports from the seeded dataset', async () => {
        const response = await (0, supertest_1.default)(app).get('/api/airports?q=Indira&limit=3').expect(200);
        (0, vitest_1.expect)(response.body[0].icao).toBe('VIDP');
    });
    (0, vitest_1.it)('returns fallback flight plans without external keys', async () => {
        const response = await (0, supertest_1.default)(app).get('/api/flightplans?fromICAO=VIDP&toICAO=VOBL').expect(200);
        (0, vitest_1.expect)(response.body[0].id).toContain('generated-VIDP-VOBL');
    });
    (0, vitest_1.it)('returns provider status details', async () => {
        const response = await (0, supertest_1.default)(app).get('/api/providers').expect(200);
        (0, vitest_1.expect)(response.body.flightPlans.mode).toMatch(/flightplandb-live|generated-fallback/);
        (0, vitest_1.expect)(response.body.realtime.path).toContain('/ws/flights');
    });
    (0, vitest_1.it)('returns monitoring metrics', async () => {
        const response = await (0, supertest_1.default)(app).get('/api/monitoring/metrics').expect(200);
        (0, vitest_1.expect)(response.body.requests.total).toBeGreaterThanOrEqual(1);
        (0, vitest_1.expect)(response.body.cache).toEqual(vitest_1.expect.objectContaining({ hits: vitest_1.expect.any(Number), misses: vitest_1.expect.any(Number) }));
    });
    (0, vitest_1.it)('returns active flights near a route', async () => {
        const response = await (0, supertest_1.default)(app).get('/api/flightplan/generated-VIDP-VOBL/active-flights?radiusKm=150&limit=5').expect(200);
        (0, vitest_1.expect)(response.body.flights.length).toBeGreaterThan(0);
        (0, vitest_1.expect)(response.body.flights[0]).toEqual(vitest_1.expect.objectContaining({ latitude: vitest_1.expect.any(Number), longitude: vitest_1.expect.any(Number) }));
    });
    (0, vitest_1.it)('creates a route corridor with the route-first API', async () => {
        const response = await (0, supertest_1.default)(app).post('/api/routes').send({ fromICAO: 'VIDP', toICAO: 'VOBL' }).expect(201);
        (0, vitest_1.expect)(response.body.id).toContain('generated-VIDP-VOBL');
        (0, vitest_1.expect)(response.body.route.nodes.length).toBeGreaterThan(2);
    });
    (0, vitest_1.it)('returns selected flight detail and unavailable track metadata', async () => {
        const detail = await (0, supertest_1.default)(app).get('/api/flights/mock/mock-VIDP-0?routeId=generated-VIDP-VOBL').expect(200);
        const track = await (0, supertest_1.default)(app).get('/api/flights/mock/mock-VIDP-0/track').expect(200);
        (0, vitest_1.expect)(detail.body.flight.provider).toBe('mock');
        (0, vitest_1.expect)(detail.body.routeContext.progressPercent).toEqual(vitest_1.expect.any(Number));
        (0, vitest_1.expect)(track.body.available).toBe(true);
    });
});
