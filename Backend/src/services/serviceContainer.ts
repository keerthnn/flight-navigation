import { FlightController } from '../controllers/flightController';
import { env } from '../config/env';
import {
  createMockFlightPlanProvider,
  createMockFuelProvider,
  createMockWeatherProvider,
  MockAirportRepository,
} from '../mocks/mockProviders';
import { FlightPlanDatabaseProvider, GeneratedFlightPlanProvider } from '../providers/flightPlanProvider';
import { LocalFuelProvider } from '../providers/fuelProvider';
import { CompositeWeatherProvider } from '../providers/weatherProvider';
import { AirportRepository } from '../repositories/airportRepository';
import { FlightService } from './flightService';

export interface ServiceContainer {
  flightService: FlightService;
  flightController: FlightController;
}

export function createServiceContainer(): ServiceContainer {
  if (env.MOCK_PROVIDERS) {
    const airports = new MockAirportRepository();
    const flightService = new FlightService(
      airports,
      createMockFlightPlanProvider(),
      createMockWeatherProvider(),
      createMockFuelProvider(),
    );
    return {
      flightService,
      flightController: new FlightController(flightService),
    };
  }

  const airports = new AirportRepository();
  const generatedFlightPlans = new GeneratedFlightPlanProvider(airports);
  const flightPlans = new FlightPlanDatabaseProvider(generatedFlightPlans);
  const weather = new CompositeWeatherProvider();
  const fuel = new LocalFuelProvider();
  const flightService = new FlightService(airports, flightPlans, weather, fuel);

  return {
    flightService,
    flightController: new FlightController(flightService),
  };
}
