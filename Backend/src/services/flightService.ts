import { cache } from '../cache/memoryCache';
import { env } from '../config/env';
import { AirportRepository } from '../repositories/airportRepository';
import { FlightPlanProvider } from '../providers/flightPlanProvider';
import { FlightTrackingProvider } from '../providers/flightTrackingProvider';
import { FuelProvider } from '../providers/fuelProvider';
import { WeatherProvider } from '../providers/weatherProvider';
import { LiveFlightProvider, RouteIntelligence } from '../types/domain';
import { routeContextForPoint } from '../utils/geo';

type FlightCategory = 'VFR' | 'MVFR' | 'IFR' | 'LIFR';

function hasCBOrThunderstorm(description: string): boolean {
  const desc = (description || '').toUpperCase();
  const cbKeywords = ['CB', 'TS', 'TSRA', 'TSGR', 'TSSN', 'TSPE', 'VCTS'];
  return cbKeywords.some((kw) => desc.includes(kw));
}

function extractCeilingFt(metarDescription: string): number | null {
  const match = metarDescription.toUpperCase().match(/(?:BKN|OVC)(\d{3})/);
  return match ? Number.parseInt(match[1], 10) * 100 : null;
}

function deriveFlightCategory(visibilityMeters: number, ceilingFt: number | null): FlightCategory {
  const visKm = visibilityMeters / 1000;
  const ceil = ceilingFt ?? 99999;
  if (visKm < 1.6 || ceil < 500) return 'LIFR';
  if (visKm < 5.0 || ceil < 1000) return 'IFR';
  if (visKm < 8.0 || ceil < 3000) return 'MVFR';
  return 'VFR';
}

async function getSunriseSunsetWindow(lat: number, lon: number): Promise<{ sunriseUtc: string; sunsetUtc: string } | null> {
  try {
    const response = await fetch(
      `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&formatted=0&date=today`,
    );
    if (!response.ok) return null;
    const payload = await response.json() as { results?: { sunrise?: string; sunset?: string } };
    const sunriseUtc = String(payload.results?.sunrise ?? '');
    const sunsetUtc = String(payload.results?.sunset ?? '');
    if (!sunriseUtc || !sunsetUtc) return null;
    return { sunriseUtc, sunsetUtc };
  } catch {
    return null;
  }
}

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
      const [weatherRaw, fuel] = await Promise.all([
        this.weather.getRouteWeather(flight.route.nodes),
        this.getFuelEstimate(aircraft, flight.distance),
      ]);
      const weather = weatherRaw.map((point) => {
        const cbDetected = hasCBOrThunderstorm(point.description);
        const ceilingFt = extractCeilingFt(point.description);
        const flightCategory = deriveFlightCategory(point.visibilityMeters, ceilingFt);
        return {
          ...point,
          cbDetected,
          flightCategory,
          riskWeight: cbDetected ? Math.max(point.riskWeight, 4) : point.riskWeight,
        };
      });

      const nodes = flight.route.nodes;
      const midpoint = nodes.length
        ? {
          lat: nodes.reduce((sum, node) => sum + node.lat, 0) / nodes.length,
          lon: nodes.reduce((sum, node) => sum + node.lon, 0) / nodes.length,
        }
        : null;
      const sunriseSunsetWindow = midpoint ? await getSunriseSunsetWindow(midpoint.lat, midpoint.lon) : null;
      const now = new Date();
      const sunrise = sunriseSunsetWindow ? new Date(sunriseSunsetWindow.sunriseUtc) : null;
      const sunset = sunriseSunsetWindow ? new Date(sunriseSunsetWindow.sunsetUtc) : null;
      const isNightOperation = sunrise && sunset
        ? now < sunrise || now > sunset
        : false;

      const routeWeight = Number(
        (weather.reduce((total, point) => total + point.riskWeight, 0) / Math.max(weather.length, 1)).toFixed(3),
      );
      const routeRisk = routeWeight >= 7 ? 'severe' : routeWeight >= 4 ? 'high' : routeWeight >= 2 ? 'moderate' : 'low';
      const hasLIFR = weather.some((w) => w.flightCategory === 'LIFR');
      const hasIFR = weather.some((w) => w.flightCategory === 'IFR');
      const hasCB = weather.some((w) => w.cbDetected);
      const pilotDecision: 'GO' | 'CAUTION' | 'NO-GO' =
        routeRisk === 'high' || routeRisk === 'severe' || hasLIFR || hasCB
          ? 'NO-GO'
          : routeRisk === 'moderate' || hasIFR || isNightOperation
            ? 'CAUTION'
            : 'GO';

      return {
        flight,
        weather,
        fuel,
        routeWeight,
        pilotDecision,
        isNightOperation,
        sunriseSunsetWindow,
        generatedAt: new Date().toISOString(),
      };
    });
  }
}
