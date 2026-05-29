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

export interface RouteIntelligence {
  flight: FlightPlanDetail;
  weather: WeatherPoint[];
  fuel: FuelEstimate;
  routeWeight: number;
  generatedAt: string;
}

export interface SimulationFrame {
  type: 'simulation-frame';
  flightPlanId: string;
  aircraft: string;
  position: {
    lat: number;
    lon: number;
  };
  heading: number;
  progress: number;
  riskWeight: number;
  status: 'taxi' | 'enroute' | 'arrived';
  timestamp: string;
}

export type SocketStatus = 'connecting' | 'live' | 'fallback' | 'closed';
