import { describe, expect, it } from 'vitest';
import { AirportRepository } from '../repositories/airportRepository';
import { GeneratedFlightPlanProvider } from '../providers/flightPlanProvider';
import { LocalFuelProvider } from '../providers/fuelProvider';
import { weatherRisk } from '../providers/weatherProvider';

describe('core aviation utilities', () => {
  it('generates fallback flight plans from seeded airports', async () => {
    const provider = new GeneratedFlightPlanProvider(new AirportRepository());
    const plans = await provider.search('VIDP', 'VOBL', 2);

    expect(plans).toHaveLength(2);
    expect(plans[0].fromICAO).toBe('VIDP');
    expect(plans[0].toICAO).toBe('VOBL');
    expect(plans[0].distance).toBeGreaterThan(1000);
  });

  it('estimates fuel and emissions deterministically', async () => {
    const estimate = await new LocalFuelProvider().estimate('A320', 1000);

    expect(estimate.fuelKg).toBe(2856);
    expect(estimate.co2Kg).toBe(9025);
  });

  it('increases route risk for low visibility and high wind', () => {
    expect(weatherRisk('thunderstorm', 3000, 14)).toBeGreaterThan(weatherRisk('clear sky', 10000, 4));
  });
});
