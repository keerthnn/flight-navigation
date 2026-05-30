"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServiceContainer = createServiceContainer;
const flightController_1 = require("../controllers/flightController");
const flightPlanProvider_1 = require("../providers/flightPlanProvider");
const flightTrackingProvider_1 = require("../providers/flightTrackingProvider");
const fuelProvider_1 = require("../providers/fuelProvider");
const weatherProvider_1 = require("../providers/weatherProvider");
const airportRepository_1 = require("../repositories/airportRepository");
const flightService_1 = require("./flightService");
function createServiceContainer() {
    const airports = new airportRepository_1.AirportRepository();
    const generatedFlightPlans = new flightPlanProvider_1.GeneratedFlightPlanProvider(airports);
    const flightPlans = new flightPlanProvider_1.FlightPlanDatabaseProvider(generatedFlightPlans);
    const weather = new weatherProvider_1.CompositeWeatherProvider();
    const fuel = new fuelProvider_1.LocalFuelProvider();
    const tracking = new flightTrackingProvider_1.CompositeFlightTrackingProvider();
    const flightService = new flightService_1.FlightService(airports, flightPlans, weather, fuel, tracking);
    return {
        flightService,
        flightController: new flightController_1.FlightController(flightService),
    };
}
