import { cache } from '../cache/memoryCache';
import { env } from '../config/env';
import { AirportRepository } from '../repositories/airportRepository';
import { FlightPlanProvider } from '../providers/flightPlanProvider';
import { FlightTrackingProvider } from '../providers/flightTrackingProvider';
import { FuelProvider } from '../providers/fuelProvider';
import { WeatherProvider } from '../providers/weatherProvider';
import { LiveFlightProvider, RouteIntelligence } from '../types/domain';
import { routeContextForPoint } from '../utils/geo';

export class FlightService {
  constructor(
    private readonly airports: AirportRepository,
    private readonly flights: FlightPlanProvider,
    private readonly weather: WeatherProvider,
    private readonly fuel: FuelProvider,
    private readonly tracking: FlightTrackingProvider,
  ) {}

  searchAirports(q: string, limit: number) {
    return cache.wrap(`airports:${q}:${limit}`, env.CACHE_TTL_SECONDS, () => this.airports.search(q, limit));
  }

  searchFlightPlans(fromICAO: string, toICAO: string, limit: number) {
    return cache.wrap(`plans:${fromICAO}:${toICAO}:${limit}`, env.CACHE_TTL_SECONDS, () =>
      this.flights.search(fromICAO, toICAO, limit),
    );
  }

  async createRoute(fromICAO: string, toICAO: string) {
    const [route] = await this.searchFlightPlans(fromICAO, toICAO, 1);
    return this.getFlightPlan(route.id);
  }

  getFlightPlan(id: string) {
    return cache.wrap(`plan:${id}`, env.CACHE_TTL_SECONDS, () => this.flights.getById(id));
  }

  getFuelEstimate(aircraft: string, distanceKm: number) {
    return cache.wrap(`fuel:${aircraft}:${distanceKm}`, env.CACHE_TTL_SECONDS, () =>
      this.fuel.estimate(aircraft, distanceKm),
    );
  }

  async getActiveFlightsNearRoute(id: string, radiusKm: number, limit: number) {
    return cache.wrap(`active-flights:${id}:${radiusKm}:${limit}`, 30, async () => {
      const flight = await this.getFlightPlan(id);
      return this.tracking.getFlightsNearRoute(flight.route.nodes, radiusKm, limit);
    });
  }

  async getLiveFlight(provider: LiveFlightProvider, flightId: string, routeId?: string) {
    const latest = await this.tracking.getFlight(provider, flightId);
    if (!routeId) return latest;

    const route = await this.getFlightPlan(routeId);
    const routeContext = routeContextForPoint(route.route.nodes, {
      latitude: latest.flight.latitude,
      longitude: latest.flight.longitude,
    });
    return this.tracking.getFlight(provider, flightId, routeContext);
  }

  getFlightTrack(provider: LiveFlightProvider, flightId: string) {
    return cache.wrap(`track:${provider}:${flightId}`, 30, () => this.tracking.getTrack(provider, flightId));
  }

  async getRouteIntelligence(id: string, aircraft: string): Promise<RouteIntelligence> {
    return cache.wrap(`intel:${id}:${aircraft}`, env.CACHE_TTL_SECONDS, async () => {
      const flight = await this.getFlightPlan(id);
      const [weather, fuel] = await Promise.all([
        this.weather.getRouteWeather(flight.route.nodes),
        this.getFuelEstimate(aircraft, flight.distance),
      ]);
      const routeWeight = Number(
        (weather.reduce((total, point) => total + point.riskWeight, 0) / Math.max(weather.length, 1)).toFixed(3),
      );

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
