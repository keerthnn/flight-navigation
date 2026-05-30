import { LiveFlight } from '../types/domain';

export function getFlightStableId(flight: LiveFlight): string {
  return `${flight.provider}:${flight.icao24 ?? flight.id}`;
}

export function hasValidCoordinates(flight: LiveFlight): boolean {
  return Number.isFinite(flight.latitude) && Number.isFinite(flight.longitude);
}
