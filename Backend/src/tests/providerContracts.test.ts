import { describe, expect, it } from 'vitest';
import {
  createMockFlightPlanProvider,
  createMockFuelProvider,
  createMockFlightTrackingProvider,
  createMockWeatherProvider,
  MockAirportRepository,
} from '../mocks/mockProviders';

describe('mock provider contracts', () => {
  it('returns airport, route, weather, and fuel data using provider interfaces', async () => {
    const airports = new MockAirportRepository();
    const flightPlans = createMockFlightPlanProvider();
    const weather = createMockWeatherProvider();
    const fuel = createMockFuelProvider();
    const tracking = createMockFlightTrackingProvider();

    const [departure] = await airports.search('Indira');
    const [plan] = await flightPlans.search('VIDP', 'VOBL', 1);
    const detail = await flightPlans.getById(plan.id);
    const routeWeather = await weather.getRouteWeather(detail.route.nodes);
    const estimate = await fuel.estimate('A320', detail.distance);
    const activeFlights = await tracking.getFlightsNearRoute(detail.route.nodes, 150, 10);

    expect(departure.icao).toBe('VIDP');
    expect(detail.route.nodes.length).toBeGreaterThan(2);
    expect(routeWeather).toHaveLength(detail.route.nodes.length);
    expect(estimate.fuelKg).toBeGreaterThan(0);
    expect(activeFlights.flights[0].provider).toBe('mock');
  });
});
