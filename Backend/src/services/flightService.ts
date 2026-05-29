import { cache } from '../cache/memoryCache';
import { env } from '../config/env';
import { AirportRepository } from '../repositories/airportRepository';
import { FlightPlanProvider } from '../providers/flightPlanProvider';
import { FuelProvider } from '../providers/fuelProvider';
import { WeatherProvider } from '../providers/weatherProvider';
import { RouteIntelligence } from '../types/domain';

export class FlightService {
  constructor(
    private readonly airports: AirportRepository,
    private readonly flights: FlightPlanProvider,
    private readonly weather: WeatherProvider,
    private readonly fuel: FuelProvider,
  ) {}

  searchAirports(q: string, limit: number) {
    return cache.wrap(`airports:${q}:${limit}`, env.CACHE_TTL_SECONDS, () => this.airports.search(q, limit));
  }

  searchFlightPlans(fromICAO: string, toICAO: string, limit: number) {
    return cache.wrap(`plans:${fromICAO}:${toICAO}:${limit}`, env.CACHE_TTL_SECONDS, () =>
      this.flights.search(fromICAO, toICAO, limit),
    );
  }

  getFlightPlan(id: string) {
    return cache.wrap(`plan:${id}`, env.CACHE_TTL_SECONDS, () => this.flights.getById(id));
  }

  getFuelEstimate(aircraft: string, distanceKm: number) {
    return cache.wrap(`fuel:${aircraft}:${distanceKm}`, env.CACHE_TTL_SECONDS, () =>
      this.fuel.estimate(aircraft, distanceKm),
    );
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
