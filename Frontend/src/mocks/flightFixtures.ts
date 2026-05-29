import { ActiveFlightsResult, Airport, FlightPlanSummary, RouteIntelligence } from '../types/domain';

export const mockAirports: Airport[] = [
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

export const mockFlightPlans: FlightPlanSummary[] = [
  {
    id: 'generated-VIDP-VOBL',
    fromICAO: 'VIDP',
    toICAO: 'VOBL',
    fromName: 'Indira Gandhi International Airport',
    toName: 'Kempegowda International Airport',
    distance: 1710.05,
    waypoints: 'VIDP, WPT1, WPT2, VOBL',
    source: 'generated',
  },
];

export const mockRouteIntelligence: RouteIntelligence = {
  flight: {
    ...mockFlightPlans[0],
    route: {
      nodes: [
        { ident: 'VIDP', name: 'Indira Gandhi International Airport', lat: 28.5665, lon: 77.1031, type: 'departure' },
        { ident: 'WPT1', name: 'Navigation waypoint 1', lat: 23, lon: 77.3, type: 'waypoint' },
        { ident: 'VOBL', name: 'Kempegowda International Airport', lat: 13.1979, lon: 77.7063, type: 'arrival' },
      ],
    },
  },
  weather: [
    {
      ident: 'VIDP',
      description: 'clear sky',
      temperatureC: 26,
      humidity: 55,
      visibilityMeters: 10_000,
      windSpeedMps: 4,
      riskWeight: 1,
      source: 'synthetic',
    },
    {
      ident: 'WPT1',
      description: 'scattered clouds',
      temperatureC: 28,
      humidity: 62,
      visibilityMeters: 9000,
      windSpeedMps: 7,
      riskWeight: 3,
      source: 'synthetic',
    },
    {
      ident: 'VOBL',
      description: 'rain',
      temperatureC: 22,
      humidity: 78,
      visibilityMeters: 7000,
      windSpeedMps: 9,
      riskWeight: 5,
      source: 'synthetic',
    },
  ],
  fuel: {
    aircraft: 'A320',
    distanceKm: 1710.05,
    fuelKg: 4884,
    co2Kg: 15433,
    model: 'A320 nominal burn',
    source: 'local-estimator',
  },
  routeWeight: 3,
  generatedAt: '2026-05-29T00:00:00.000Z',
};

export const mockActiveFlights: ActiveFlightsResult = {
  source: 'mock',
  generatedAt: '2026-05-29T00:00:00.000Z',
  demo: true,
  flights: [
    {
      id: 'mock-VIDP-1',
      provider: 'mock',
      callsign: 'DEMO101',
      icao24: 'demo01',
      registration: 'VT-DMO',
      aircraftType: 'A320',
      operator: 'Demo Air',
      originCountry: 'Demo Network',
      latitude: 28.9,
      longitude: 76.9,
      altitudeMeters: 9300,
      geoAltitudeMeters: 9400,
      speedKnots: 431,
      headingDegrees: 168,
      verticalRate: 0.8,
      squawk: '1200',
      onGround: false,
      lastSeen: '2026-05-29T00:00:00.000Z',
      sourceUpdatedAt: '2026-05-29T00:00:00.000Z',
      demo: true,
    },
  ],
};
