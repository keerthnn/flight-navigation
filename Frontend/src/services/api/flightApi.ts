import { Airport, FlightPlanDetail, FlightPlanSummary, FuelEstimate, RouteIntelligence } from '../../types/domain';
import { getJson } from './httpClient';

export const flightApi = {
  getProviders: () => getJson<Record<string, unknown>>('/providers'),
  searchAirports: (query: string, limit = 8) => getJson<Airport[]>('/airports', { q: query, limit }),
  searchFlightPlans: (fromICAO: string, toICAO: string, limit = 10) =>
    getJson<FlightPlanSummary[]>('/flightplans', { fromICAO, toICAO, limit }),
  getFlightPlan: (id: string) => getJson<FlightPlanDetail>(`/flightplan/${id}`),
  getRouteIntelligence: (id: string, aircraft = 'A320') =>
    getJson<RouteIntelligence>(`/flightplan/${id}/intelligence`, { aircraft }),
  getFuelEstimate: (aircraft: string, distance: number) => getJson<FuelEstimate>('/fuel-data', { aircraft, distance }),
};
