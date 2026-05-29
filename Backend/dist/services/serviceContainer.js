"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServiceContainer = createServiceContainer;
const flightController_1 = require("../controllers/flightController");
const env_1 = require("../config/env");
const mockProviders_1 = require("../mocks/mockProviders");
const flightPlanProvider_1 = require("../providers/flightPlanProvider");
const fuelProvider_1 = require("../providers/fuelProvider");
const weatherProvider_1 = require("../providers/weatherProvider");
const airportRepository_1 = require("../repositories/airportRepository");
const flightService_1 = require("./flightService");
function createServiceContainer() {
    if (env_1.env.MOCK_PROVIDERS) {
        const airports = new mockProviders_1.MockAirportRepository();
        const flightService = new flightService_1.FlightService(airports, (0, mockProviders_1.createMockFlightPlanProvider)(), (0, mockProviders_1.createMockWeatherProvider)(), (0, mockProviders_1.createMockFuelProvider)());
        return {
            flightService,
            flightController: new flightController_1.FlightController(flightService),
        };
    }
    const airports = new airportRepository_1.AirportRepository();
    const generatedFlightPlans = new flightPlanProvider_1.GeneratedFlightPlanProvider(airports);
    const flightPlans = new flightPlanProvider_1.FlightPlanDatabaseProvider(generatedFlightPlans);
    const weather = new weatherProvider_1.CompositeWeatherProvider();
    const fuel = new fuelProvider_1.LocalFuelProvider();
    const flightService = new flightService_1.FlightService(airports, flightPlans, weather, fuel);
    return {
        flightService,
        flightController: new flightController_1.FlightController(flightService),
    };
}
