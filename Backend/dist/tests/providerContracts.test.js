"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const mockProviders_1 = require("../mocks/mockProviders");
(0, vitest_1.describe)('mock provider contracts', () => {
    (0, vitest_1.it)('returns airport, route, weather, and fuel data using provider interfaces', async () => {
        const airports = new mockProviders_1.MockAirportRepository();
        const flightPlans = (0, mockProviders_1.createMockFlightPlanProvider)();
        const weather = (0, mockProviders_1.createMockWeatherProvider)();
        const fuel = (0, mockProviders_1.createMockFuelProvider)();
        const [departure] = await airports.search('Indira');
        const [plan] = await flightPlans.search('VIDP', 'VOBL', 1);
        const detail = await flightPlans.getById(plan.id);
        const routeWeather = await weather.getRouteWeather(detail.route.nodes);
        const estimate = await fuel.estimate('A320', detail.distance);
        (0, vitest_1.expect)(departure.icao).toBe('VIDP');
        (0, vitest_1.expect)(detail.route.nodes.length).toBeGreaterThan(2);
        (0, vitest_1.expect)(routeWeather).toHaveLength(detail.route.nodes.length);
        (0, vitest_1.expect)(estimate.fuelKg).toBeGreaterThan(0);
    });
});
