import { FuelEstimate } from '../types/domain';
import { metrics } from '../monitoring/metrics';

export interface FuelProvider {
  estimate(aircraft: string, distanceKm: number): Promise<FuelEstimate>;
}

const fuelBurnByAircraft: Record<string, number> = {
  A320: 2.55,
  B738: 2.65,
  B789: 5.4,
  A359: 5.8,
};

export class LocalFuelProvider implements FuelProvider {
  async estimate(aircraft: string, distanceKm: number): Promise<FuelEstimate> {
    metrics.recordProviderEvent('localFuelEstimate');
    const normalized = aircraft.toUpperCase();
    const burnKgPerKm = fuelBurnByAircraft[normalized] ?? 2.75;
    const reserveMultiplier = 1.12;
    const fuelKg = Math.round(distanceKm * burnKgPerKm * reserveMultiplier);

    return {
      aircraft: normalized,
      distanceKm: Number(distanceKm.toFixed(2)),
      fuelKg,
      co2Kg: Math.round(fuelKg * 3.16),
      model: fuelBurnByAircraft[normalized] ? `${normalized} nominal burn` : 'generic narrow-body estimate',
      source: 'local-estimator',
    };
  }
}
