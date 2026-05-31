import axios, { AxiosInstance } from 'axios';
import { env } from '../config/env';
import { AirportRepository } from '../repositories/airportRepository';
import { FlightPlanDetail, FlightPlanSummary, RouteNode } from '../types/domain';
import { haversineKm, interpolateRoute } from '../utils/geo';
import { retry } from '../utils/retry';
import { metrics } from '../monitoring/metrics';

export interface FlightPlanProvider {
  search(fromICAO: string, toICAO: string, limit: number): Promise<FlightPlanSummary[]>;
  getById(id: string): Promise<FlightPlanDetail>;
}

export class FlightPlanDatabaseProvider implements FlightPlanProvider {
  private readonly client: AxiosInstance;

  constructor(private readonly fallback: GeneratedFlightPlanProvider) {
    const auth = env.FLIGHT_PLAN_DB_API_KEY
      ? {
          Authorization: `Basic ${Buffer.from(`${env.FLIGHT_PLAN_DB_API_KEY}:`).toString('base64')}`,
        }
      : undefined;

    this.client = axios.create({
      baseURL: env.FLIGHT_PLAN_DB_BASE_URL,
      timeout: 6000,
      headers: auth,
    });
  }

  async search(fromICAO: string, toICAO: string, limit: number): Promise<FlightPlanSummary[]> {
    if (!env.FLIGHT_PLAN_DB_API_KEY) return this.fallback.search(fromICAO, toICAO, limit);

    try {
      const response = await retry(() =>
        this.client.get('/search/plans', { params: { fromICAO, toICAO } }),
      );
      metrics.recordProviderEvent('flightPlanDbSuccess');
      const plans = Array.isArray(response.data) ? response.data : [];
      return plans.slice(0, limit).map((plan) => ({
        id: String(plan.id),
        fromICAO: String(plan.fromICAO ?? fromICAO),
        toICAO: String(plan.toICAO ?? toICAO),
        fromName: String(plan.fromName ?? fromICAO),
        toName: String(plan.toName ?? toICAO),
        distance: Number(plan.distance ?? 0),
        waypoints: String(plan.waypoints ?? ''),
        source: 'flightplandb',
      }));
    } catch {
      return this.fallback.search(fromICAO, toICAO, limit);
    }
  }

  async getById(id: string): Promise<FlightPlanDetail> {
    if (!env.FLIGHT_PLAN_DB_API_KEY || id.startsWith('generated-')) return this.fallback.getById(id);

    try {
      const response = await retry(() => this.client.get(`/plan/${id}`));
      metrics.recordProviderEvent('flightPlanDbSuccess');
      return { ...response.data, id: String(response.data.id), source: 'flightplandb' } as FlightPlanDetail;
    } catch {
      return this.fallback.getById(id);
    }
  }
}

export class GeneratedFlightPlanProvider implements FlightPlanProvider {
  constructor(private readonly airports: AirportRepository) {}

  async search(fromICAO: string, toICAO: string, limit: number): Promise<FlightPlanSummary[]> {
    metrics.recordProviderEvent('generatedFallback');
    const detail = await this.buildGeneratedDetail(fromICAO, toICAO);
    return [
      detail,
      {
        ...detail,
        id: `${detail.id}-eco`,
        distance: Number((detail.distance * 1.04).toFixed(2)),
        waypoints: `${detail.waypoints}, ECO`,
      },
      {
        ...detail,
        id: `${detail.id}-weather`,
        distance: Number((detail.distance * 1.08).toFixed(2)),
        waypoints: `${detail.waypoints}, WX`,
      },
    ].slice(0, limit);
  }

  async getById(id: string): Promise<FlightPlanDetail> {
    metrics.recordProviderEvent('generatedFallback');
    const [, fromICAO, toICAO] = id.match(/^(?:generated-)?([A-Z0-9]{3,4})-([A-Z0-9]{3,4})(?:-.+)?$/i) ?? [];
    return this.buildGeneratedDetail(fromICAO ?? 'VIDP', toICAO ?? 'VOBL', id);
  }

  private async buildGeneratedDetail(
    fromICAO: string,
    toICAO: string,
    id = `generated-${fromICAO}-${toICAO}`,
  ): Promise<FlightPlanDetail> {
    const from = await this.airports.findByIcao(fromICAO);
    const to = await this.airports.findByIcao(toICAO);
    if (!from || !to) {
      throw new Error(`Unable to generate route for ${fromICAO} to ${toICAO}`);
    }

    const departure: RouteNode = {
      ident: from.icao,
      name: from.name,
      lat: from.latitude,
      lon: from.longitude,
      type: 'departure',
    };
    const arrival: RouteNode = {
      ident: to.icao,
      name: to.name,
      lat: to.latitude,
      lon: to.longitude,
      type: 'arrival',
    };
    const nodes = interpolateRoute(departure, arrival);

    return {
      id,
      fromICAO,
      toICAO,
      fromName: from.name,
      toName: to.name,
      distance: Number(haversineKm(from, to).toFixed(2)),
      waypoints: nodes.map((node) => node.ident).join(', '),
      source: 'generated',
      route: { nodes },
    };
  }
}
