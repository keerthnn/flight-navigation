"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const airportRepository_1 = require("../repositories/airportRepository");
const flightPlanProvider_1 = require("../providers/flightPlanProvider");
const fuelProvider_1 = require("../providers/fuelProvider");
const weatherProvider_1 = require("../providers/weatherProvider");
(0, vitest_1.describe)('core aviation utilities', () => {
    (0, vitest_1.it)('generates fallback flight plans from seeded airports', async () => {
        const provider = new flightPlanProvider_1.GeneratedFlightPlanProvider(new airportRepository_1.AirportRepository());
        const plans = await provider.search('VIDP', 'VOBL', 2);
        (0, vitest_1.expect)(plans).toHaveLength(2);
        (0, vitest_1.expect)(plans[0].fromICAO).toBe('VIDP');
        (0, vitest_1.expect)(plans[0].toICAO).toBe('VOBL');
        (0, vitest_1.expect)(plans[0].distance).toBeGreaterThan(1000);
    });
    (0, vitest_1.it)('estimates fuel and emissions deterministically', async () => {
        const estimate = await new fuelProvider_1.LocalFuelProvider().estimate('A320', 1000);
        (0, vitest_1.expect)(estimate.fuelKg).toBe(2856);
        (0, vitest_1.expect)(estimate.co2Kg).toBe(9025);
    });
    (0, vitest_1.it)('increases route risk for low visibility and high wind', () => {
        (0, vitest_1.expect)((0, weatherProvider_1.weatherRisk)('thunderstorm', 3000, 14)).toBeGreaterThan((0, weatherProvider_1.weatherRisk)('clear sky', 10000, 4));
    });
});
