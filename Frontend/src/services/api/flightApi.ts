import {
  ActiveFlightsResult,
  Airport,
  FlightPlanDetail,
  FlightPlanSummary,
  FlightTrackResult,
  FuelEstimate,
  LiveFlightDetail,
  LiveFlightProvider,
  RouteIntelligence,
} from '../../types/domain';
import { getJson, postJson } from './httpClient';

export const flightApi = {
  getProviders: () => getJson<Record<string, unknown>>('/providers'),
  searchAirports: (query: string, limit = 8) => getJson<Airport[]>('/airports', { q: query, limit }),
  createRoute: (fromICAO: string, toICAO: string) => postJson<FlightPlanDetail>('/routes', { fromICAO, toICAO }),
  searchFlightPlans: (fromICAO: string, toICAO: string, limit = 10) =>
    getJson<FlightPlanSummary[]>('/flightplans', { fromICAO, toICAO, limit }),
  getFlightPlan: (id: string) => getJson<FlightPlanDetail>(`/flightplan/${id}`),
  getRouteIntelligence: (id: string, aircraft = 'A320') =>
    getJson<RouteIntelligence>(`/flightplan/${id}/intelligence`, { aircraft }),
  getActiveFlights: (id: string, radiusKm = 150, limit = 25) =>
    getJson<ActiveFlightsResult>(`/routes/${id}/active-flights`, { radiusKm, limit }),
  getLiveFlight: (provider: LiveFlightProvider, flightId: string, routeId?: string) =>
    getJson<LiveFlightDetail>(`/flights/${provider}/${flightId}`, { routeId }),
  getFlightTrack: (provider: LiveFlightProvider, flightId: string) =>
    getJson<FlightTrackResult>(`/flights/${provider}/${flightId}/track`),
  getFuelEstimate: (aircraft: string, distance: number) => getJson<FuelEstimate>('/fuel-data', { aircraft, distance }),
};
