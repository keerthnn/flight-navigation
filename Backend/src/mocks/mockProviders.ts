import { Airport } from '../types/domain';
import { FlightPlanProvider, GeneratedFlightPlanProvider } from '../providers/flightPlanProvider';
import { MockFlightTrackingProvider } from '../providers/flightTrackingProvider';
import { LocalFuelProvider } from '../providers/fuelProvider';
import { WeatherProvider } from '../providers/weatherProvider';
import { AirportRepository } from '../repositories/airportRepository';

export class MockAirportRepository extends AirportRepository {
  private readonly mockAirports: Airport[] = [
    {
      countryCode: 'IN',
      regionName: 'Delhi',
      iata: 'DEL',
      icao: 'VIDP',
      name: 'Indira Gandhi International Airport',
      latitude: 28.5665,
      longitude: 77.1031,
    },
    {
      countryCode: 'IN',
      regionName: 'Karnataka',
      iata: 'BLR',
      icao: 'VOBL',
      name: 'Kempegowda International Airport',
      latitude: 13.1979,
      longitude: 77.7063,
    },
  ];

  override async search(query: string, limit = 8): Promise<Airport[]> {
    const normalized = query.toLowerCase();
    return this.mockAirports
      .filter((airport) => airport.name.toLowerCase().includes(normalized) || airport.icao.toLowerCase().includes(normalized))
      .slice(0, limit);
  }

  override async findByIcao(icao: string): Promise<Airport | undefined> {
    return this.mockAirports.find((airport) => airport.icao === icao.toUpperCase());
  }
}

export function createMockFlightPlanProvider(): FlightPlanProvider {
  return new GeneratedFlightPlanProvider(new MockAirportRepository());
}

export function createMockWeatherProvider(): WeatherProvider {
  return {
    async getRouteWeather(nodes) {
      return nodes.map((node, index) => ({
        ident: node.ident,
        description: index % 2 === 0 ? 'clear sky' : 'scattered clouds',
        temperatureC: 24 + index,
        humidity: 58,
        visibilityMeters: 10_000,
        windSpeedMps: 6 + index,
        riskWeight: index % 2 === 0 ? 1 : 3,
        source: 'synthetic',
      }));
    },
  };
}

export function createMockFuelProvider(): LocalFuelProvider {
  return new LocalFuelProvider();
}

export function createMockFlightTrackingProvider(): MockFlightTrackingProvider {
  return new MockFlightTrackingProvider();
}
