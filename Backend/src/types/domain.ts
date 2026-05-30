export interface Airport {
  countryCode: string;
  regionName: string;
  iata?: string;
  icao: string;
  name: string;
  latitude: number;
  longitude: number;
}

export interface FlightPlanSummary {
  id: string;
  fromICAO: string;
  toICAO: string;
  fromName: string;
  toName: string;
  distance: number;
  waypoints: string;
  source: 'flightplandb' | 'generated';
}

export interface RouteNode {
  ident: string;
  name: string;
  lat: number;
  lon: number;
  type: 'departure' | 'waypoint' | 'arrival';
}

export interface FlightPlanDetail extends FlightPlanSummary {
  route: {
    nodes: RouteNode[];
  };
}

export interface WeatherPoint {
  ident: string;
  description: string;
  temperatureC: number;
  humidity: number;
  visibilityMeters: number;
  windSpeedMps: number;
  riskWeight: number;
  cbDetected: boolean;
  flightCategory: 'VFR' | 'MVFR' | 'IFR' | 'LIFR';
  source: 'aviationweather' | 'openmeteo' | 'synthetic';
}

export interface FuelEstimate {
  aircraft: string;
  distanceKm: number;
  fuelKg: number;
  co2Kg: number;
  model: string;
  source: 'local-estimator';
}

export type LiveFlightProvider = 'opensky' | 'adsblol' | 'mock';

export interface LiveFlight {
  id: string;
  provider: LiveFlightProvider;
  callsign?: string;
  icao24?: string;
  registration?: string;
  aircraftType?: string;
  operator?: string;
  originCountry?: string;
  latitude: number;
  longitude: number;
  altitudeMeters?: number;
  geoAltitudeMeters?: number;
  speedKnots?: number;
  headingDegrees?: number;
  verticalRate?: number;
  squawk?: string;
  onGround: boolean;
  lastSeen: string;
  sourceUpdatedAt: string;
  demo: boolean;
}

export interface ActiveFlightsResult {
  flights: LiveFlight[];
  source: LiveFlightProvider;
  generatedAt: string;
  demo: boolean;
}

export interface FlightTrackPoint {
  latitude: number;
  longitude: number;
  altitudeMeters?: number;
  timestamp: string;
}

export interface FlightTrackResult {
  provider: LiveFlightProvider;
  flightId: string;
  points: FlightTrackPoint[];
  available: boolean;
  message?: string;
}

export interface RouteContext {
  distanceFromRouteKm: number;
  progressPercent: number;
  remainingDistanceKm: number;
}

export interface LiveFlightDetail {
  flight: LiveFlight;
  routeContext?: RouteContext;
  weather?: WeatherPoint;
  generatedAt: string;
}

export interface RouteIntelligence {
  flight: FlightPlanDetail;
  weather: WeatherPoint[];
  fuel: FuelEstimate;
  routeWeight: number;
  pilotDecision: 'GO' | 'CAUTION' | 'NO-GO';
  isNightOperation: boolean;
  sunriseSunsetWindow: {
    sunriseUtc: string;
    sunsetUtc: string;
  } | null;
  generatedAt: string;
}
