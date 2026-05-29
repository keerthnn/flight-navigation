"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlightService = void 0;
const memoryCache_1 = require("../cache/memoryCache");
const env_1 = require("../config/env");
const geo_1 = require("../utils/geo");
class FlightService {
    airports;
    flights;
    weather;
    fuel;
    tracking;
    constructor(airports, flights, weather, fuel, tracking) {
        this.airports = airports;
        this.flights = flights;
        this.weather = weather;
        this.fuel = fuel;
        this.tracking = tracking;
    }
    searchAirports(q, limit) {
        return memoryCache_1.cache.wrap(`airports:${q}:${limit}`, env_1.env.CACHE_TTL_SECONDS, () => this.airports.search(q, limit));
    }
    searchFlightPlans(fromICAO, toICAO, limit) {
        return memoryCache_1.cache.wrap(`plans:${fromICAO}:${toICAO}:${limit}`, env_1.env.CACHE_TTL_SECONDS, () => this.flights.search(fromICAO, toICAO, limit));
    }
    async createRoute(fromICAO, toICAO) {
        const [route] = await this.searchFlightPlans(fromICAO, toICAO, 1);
        return this.getFlightPlan(route.id);
    }
    getFlightPlan(id) {
        return memoryCache_1.cache.wrap(`plan:${id}`, env_1.env.CACHE_TTL_SECONDS, () => this.flights.getById(id));
    }
    getFuelEstimate(aircraft, distanceKm) {
        return memoryCache_1.cache.wrap(`fuel:${aircraft}:${distanceKm}`, env_1.env.CACHE_TTL_SECONDS, () => this.fuel.estimate(aircraft, distanceKm));
    }
    async getActiveFlightsNearRoute(id, radiusKm, limit) {
        return memoryCache_1.cache.wrap(`active-flights:${id}:${radiusKm}:${limit}`, 30, async () => {
            const flight = await this.getFlightPlan(id);
            return this.tracking.getFlightsNearRoute(flight.route.nodes, radiusKm, limit);
        });
    }
    async getLiveFlight(provider, flightId, routeId) {
        const latest = await this.tracking.getFlight(provider, flightId);
        if (!routeId)
            return latest;
        const route = await this.getFlightPlan(routeId);
        const routeContext = (0, geo_1.routeContextForPoint)(route.route.nodes, {
            latitude: latest.flight.latitude,
            longitude: latest.flight.longitude,
        });
        return this.tracking.getFlight(provider, flightId, routeContext);
    }
    getFlightTrack(provider, flightId) {
        return memoryCache_1.cache.wrap(`track:${provider}:${flightId}`, 30, () => this.tracking.getTrack(provider, flightId));
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
