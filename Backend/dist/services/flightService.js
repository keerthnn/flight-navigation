"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlightService = void 0;
const memoryCache_1 = require("../cache/memoryCache");
const env_1 = require("../config/env");
class FlightService {
    airports;
    flights;
    weather;
    fuel;
    constructor(airports, flights, weather, fuel) {
        this.airports = airports;
        this.flights = flights;
        this.weather = weather;
        this.fuel = fuel;
    }
    searchAirports(q, limit) {
        return memoryCache_1.cache.wrap(`airports:${q}:${limit}`, env_1.env.CACHE_TTL_SECONDS, () => this.airports.search(q, limit));
    }
    searchFlightPlans(fromICAO, toICAO, limit) {
        return memoryCache_1.cache.wrap(`plans:${fromICAO}:${toICAO}:${limit}`, env_1.env.CACHE_TTL_SECONDS, () => this.flights.search(fromICAO, toICAO, limit));
    }
    getFlightPlan(id) {
        return memoryCache_1.cache.wrap(`plan:${id}`, env_1.env.CACHE_TTL_SECONDS, () => this.flights.getById(id));
    }
    getFuelEstimate(aircraft, distanceKm) {
        return memoryCache_1.cache.wrap(`fuel:${aircraft}:${distanceKm}`, env_1.env.CACHE_TTL_SECONDS, () => this.fuel.estimate(aircraft, distanceKm));
    }
    async getRouteIntelligence(id, aircraft) {
        return memoryCache_1.cache.wrap(`intel:${id}:${aircraft}`, env_1.env.CACHE_TTL_SECONDS, async () => {
            const flight = await this.getFlightPlan(id);
            const [weather, fuel] = await Promise.all([
                this.weather.getRouteWeather(flight.route.nodes),
                this.getFuelEstimate(aircraft, flight.distance),
            ]);
            const routeWeight = Number((weather.reduce((total, point) => total + point.riskWeight, 0) / Math.max(weather.length, 1)).toFixed(3));
            return {
                flight,
                weather,
                fuel,
                routeWeight,
                generatedAt: new Date().toISOString(),
            };
        });
    }
}
exports.FlightService = FlightService;
