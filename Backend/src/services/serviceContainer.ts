import { FlightController } from '../controllers/flightController';
import { FlightPlanDatabaseProvider, GeneratedFlightPlanProvider } from '../providers/flightPlanProvider';
import { CompositeFlightTrackingProvider } from '../providers/flightTrackingProvider';
import { LocalFuelProvider } from '../providers/fuelProvider';
import { CompositeWeatherProvider } from '../providers/weatherProvider';
import { AirportRepository } from '../repositories/airportRepository';
import { FlightService } from './flightService';

export interface ServiceContainer {
  flightService: FlightService;
  flightController: FlightController;
}

export function createServiceContainer(): ServiceContainer {
  const airports = new AirportRepository();
  const generatedFlightPlans = new GeneratedFlightPlanProvider(airports);
  const flightPlans = new FlightPlanDatabaseProvider(generatedFlightPlans);
  const weather = new CompositeWeatherProvider();
  const fuel = new LocalFuelProvider();
  const tracking = new CompositeFlightTrackingProvider();
  const flightService = new FlightService(airports, flightPlans, weather, fuel, tracking);

  return {
    flightService,
    flightController: new FlightController(flightService),
  };
}
