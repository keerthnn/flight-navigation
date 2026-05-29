import { mockAirports, mockFlightPlans, mockRouteIntelligence } from './flightFixtures';

export const mockFlightApi = {
  getProviders: async () => ({ flightPlans: { mode: 'generated-fallback' } }),
  searchAirports: async (query: string) =>
    mockAirports.filter((airport) => airport.name.toLowerCase().includes(query.toLowerCase()) || airport.icao.includes(query.toUpperCase())),
  searchFlightPlans: async () => mockFlightPlans,
  getRouteIntelligence: async () => mockRouteIntelligence,
};
