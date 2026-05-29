"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_http_1 = require("node:http");
const ws_1 = __importDefault(require("ws"));
const vitest_1 = require("vitest");
const app_1 = require("../app");
const routeSimulation_1 = require("../websocket/routeSimulation");
const flightService_1 = require("../services/flightService");
const mockProviders_1 = require("../mocks/mockProviders");
(0, vitest_1.describe)('route simulation websocket', () => {
    const servers = [];
    (0, vitest_1.afterEach)(async () => {
        await Promise.all(servers.map((server) => new Promise((resolve) => server.close(() => resolve()))));
        servers.length = 0;
    });
    (0, vitest_1.it)('streams simulation frames for a route', async () => {
        const flightService = new flightService_1.FlightService(new mockProviders_1.MockAirportRepository(), (0, mockProviders_1.createMockFlightPlanProvider)(), (0, mockProviders_1.createMockWeatherProvider)(), (0, mockProviders_1.createMockFuelProvider)());
        const server = (0, node_http_1.createServer)((0, app_1.createApp)());
        servers.push(server);
        const socketServer = (0, routeSimulation_1.attachRouteSimulationWebSocket)(server, flightService);
        servers.push(socketServer);
        await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
        const address = server.address();
        if (!address || typeof address === 'string')
            throw new Error('Expected server address');
        const frame = await new Promise((resolve, reject) => {
            const client = new ws_1.default(`ws://127.0.0.1:${address.port}/ws/simulation?flightPlanId=generated-VIDP-VOBL&intervalMs=100`);
            client.on('message', (data) => {
                resolve(JSON.parse(String(data)));
                client.close();
            });
            client.on('error', reject);
        });
        (0, vitest_1.expect)(frame.type).toBe('simulation-frame');
        (0, vitest_1.expect)(frame.flightPlanId).toBe('generated-VIDP-VOBL');
        (0, vitest_1.expect)(frame.position).toEqual(vitest_1.expect.objectContaining({ lat: vitest_1.expect.any(Number), lon: vitest_1.expect.any(Number) }));
    });
});
