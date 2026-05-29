import axios, { AxiosInstance } from 'axios';
import { env } from '../config/env';
import { metrics } from '../monitoring/metrics';
import {
  ActiveFlightsResult,
  FlightTrackResult,
  LiveFlight,
  LiveFlightDetail,
  LiveFlightProvider,
  RouteContext,
  RouteNode,
} from '../types/domain';
import { retry } from '../utils/retry';

export interface FlightTrackingProvider {
  getFlightsNearRoute(nodes: RouteNode[], radiusKm: number, limit: number): Promise<ActiveFlightsResult>;
  getFlight(provider: LiveFlightProvider, flightId: string, routeContext?: RouteContext): Promise<LiveFlightDetail>;
  getTrack(provider: LiveFlightProvider, flightId: string): Promise<FlightTrackResult>;
}

export class CompositeFlightTrackingProvider implements FlightTrackingProvider {
  private readonly openSkyClient: AxiosInstance;
  private readonly adsbLolClient: AxiosInstance;
  private readonly mockProvider = new MockFlightTrackingProvider();

  constructor() {
    this.openSkyClient = axios.create({ baseURL: env.OPENSKY_BASE_URL, timeout: 6000 });
    this.adsbLolClient = axios.create({ baseURL: env.ADSB_LOL_BASE_URL, timeout: 6000 });
  }

  async getFlightsNearRoute(nodes: RouteNode[], radiusKm: number, limit: number): Promise<ActiveFlightsResult> {
    if (env.FLIGHT_TRACKING_MODE === 'mock') {
      return this.mockProvider.getFlightsNearRoute(nodes, radiusKm, limit);
    }

    const openSkyFlights = await this.tryOpenSkyNearRoute(nodes, radiusKm, limit);
    if (openSkyFlights) return openSkyFlights;

    const adsbFlights = await this.tryAdsbLolNearRoute(nodes, radiusKm, limit);
    if (adsbFlights) return adsbFlights;

    return this.mockProvider.getFlightsNearRoute(nodes, radiusKm, limit);
  }

  async getFlight(provider: LiveFlightProvider, flightId: string, routeContext?: RouteContext): Promise<LiveFlightDetail> {
    if (provider === 'mock' || env.FLIGHT_TRACKING_MODE === 'mock') {
      return this.mockProvider.getFlight('mock', flightId, routeContext);
    }

    const flight =
      provider === 'opensky'
        ? await this.getOpenSkyFlight(flightId)
        : await this.getAdsbLolFlight(flightId);

    if (!flight) return this.mockProvider.getFlight('mock', flightId, routeContext);

    return {
      flight,
      routeContext,
      generatedAt: new Date().toISOString(),
    };
  }

  async getTrack(provider: LiveFlightProvider, flightId: string): Promise<FlightTrackResult> {
    if (provider === 'mock' || env.FLIGHT_TRACKING_MODE === 'mock') {
      return this.mockProvider.getTrack('mock', flightId);
    }

    if (provider === 'adsblol') {
      try {
        const response = await retry(() => this.adsbLolClient.get(`/v2/trace/${flightId}`));
        const points = Array.isArray(response.data?.trace)
          ? response.data.trace
              .map((item: unknown[]) => ({
                latitude: Number(item[1]),
                longitude: Number(item[2]),
                altitudeMeters: typeof item[3] === 'number' ? item[3] * 0.3048 : undefined,
                timestamp: new Date(Date.now() - Number(item[0] ?? 0) * 1000).toISOString(),
              }))
              .filter((point: { latitude: number; longitude: number }) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude))
          : [];

        return {
          provider,
          flightId,
          points,
          available: points.length > 0,
          message: points.length ? undefined : 'Historical track unavailable from provider.',
        };
      } catch {
        return unavailableTrack(provider, flightId);
      }
    }

    return unavailableTrack(provider, flightId);
  }

  private async tryOpenSkyNearRoute(nodes: RouteNode[], radiusKm: number, limit: number): Promise<ActiveFlightsResult | undefined> {
    try {
      const bounds = routeBounds(nodes, radiusKm);
      const response = await retry(() =>
        this.openSkyClient.get('/states/all', {
          params: {
            lamin: bounds.minLat,
            lamax: bounds.maxLat,
            lomin: bounds.minLon,
            lomax: bounds.maxLon,
          },
        }),
      );
      const states = Array.isArray(response.data?.states) ? response.data.states : [];
      const flights = states
        .map(mapOpenSkyState)
        .filter((flight: LiveFlight | undefined): flight is LiveFlight => Boolean(flight))
        .slice(0, limit);

      if (!flights.length) return undefined;
      metrics.recordProviderEvent('openSkySuccess');
      return { flights, source: 'opensky', generatedAt: new Date().toISOString(), demo: false };
    } catch {
      return undefined;
    }
  }

  private async tryAdsbLolNearRoute(nodes: RouteNode[], radiusKm: number, limit: number): Promise<ActiveFlightsResult | undefined> {
    try {
      const midpoint = nodes[Math.floor(nodes.length / 2)] ?? nodes[0];
      const radiusNm = Math.min(Math.max(Math.round(radiusKm * 0.539957), 25), 250);
      const response = await retry(() => this.adsbLolClient.get(`/v2/point/${midpoint.lat}/${midpoint.lon}/${radiusNm}`));
      const aircraft = Array.isArray(response.data?.ac) ? response.data.ac : [];
      const flights = aircraft
        .map(mapAdsbLolAircraft)
        .filter((flight: LiveFlight | undefined): flight is LiveFlight => Boolean(flight))
        .slice(0, limit);

      if (!flights.length) return undefined;
      metrics.recordProviderEvent('adsbLolSuccess');
      return { flights, source: 'adsblol', generatedAt: new Date().toISOString(), demo: false };
    } catch {
      return undefined;
    }
  }

  private async getOpenSkyFlight(flightId: string): Promise<LiveFlight | undefined> {
    try {
      const response = await retry(() => this.openSkyClient.get('/states/all', { params: { icao24: flightId } }));
      const state = Array.isArray(response.data?.states) ? response.data.states[0] : undefined;
      return Array.isArray(state) ? mapOpenSkyState(state) : undefined;
    } catch {
      return undefined;
    }
  }

  private async getAdsbLolFlight(flightId: string): Promise<LiveFlight | undefined> {
    try {
      const response = await retry(() => this.adsbLolClient.get(`/v2/hex/${flightId}`));
      const aircraft = Array.isArray(response.data?.ac) ? response.data.ac[0] : undefined;
      return aircraft ? mapAdsbLolAircraft(aircraft) : undefined;
    } catch {
      return undefined;
    }
  }
}

export class MockFlightTrackingProvider implements FlightTrackingProvider {
  async getFlightsNearRoute(nodes: RouteNode[], _radiusKm: number, limit: number): Promise<ActiveFlightsResult> {
    metrics.recordProviderEvent('flightTrackingMockFallback');
    const generated = nodes.slice(0, Math.max(1, Math.min(limit, 8))).map((node, index) => mockFlightFromNode(node, index));

    return { flights: generated, source: 'mock', generatedAt: new Date().toISOString(), demo: true };
  }

  async getFlight(_provider: LiveFlightProvider, flightId: string, routeContext?: RouteContext): Promise<LiveFlightDetail> {
    metrics.recordProviderEvent('flightTrackingMockFallback');
    const index = Number(flightId.match(/(\d+)$/)?.[1] ?? 0);
    return {
      flight: {
        id: flightId,
        provider: 'mock',
        callsign: `DEMO${100 + index}`,
        icao24: flightId.replace('mock-', '').slice(0, 6).toLowerCase(),
        registration: `VT-D${index}MO`,
        aircraftType: index % 2 ? 'B738' : 'A320',
        operator: 'Demo Air',
        originCountry: 'Demo Network',
        latitude: 20 + index,
        longitude: 77 + index * 0.1,
        altitudeMeters: 9000 + index * 300,
        geoAltitudeMeters: 9200 + index * 300,
        speedKnots: 430 + index * 8,
        headingDegrees: 120 + index * 12,
        verticalRate: index % 2 ? -1.2 : 0.8,
        squawk: '1200',
        onGround: false,
        lastSeen: new Date().toISOString(),
        sourceUpdatedAt: new Date().toISOString(),
        demo: true,
      },
      routeContext,
      generatedAt: new Date().toISOString(),
    };
  }

  async getTrack(provider: LiveFlightProvider, flightId: string): Promise<FlightTrackResult> {
    const base = await this.getFlight(provider, flightId);
    return {
      provider: 'mock',
      flightId,
      available: true,
      points: [0, 1, 2, 3].map((offset) => ({
        latitude: base.flight.latitude - 0.4 + offset * 0.12,
        longitude: base.flight.longitude - 0.4 + offset * 0.12,
        altitudeMeters: (base.flight.altitudeMeters ?? 9000) - 300 + offset * 80,
        timestamp: new Date(Date.now() - (4 - offset) * 60_000).toISOString(),
      })),
    };
  }
}

function routeBounds(nodes: RouteNode[], radiusKm: number) {
  const latitudes = nodes.map((node) => node.lat);
  const longitudes = nodes.map((node) => node.lon);
  const padding = Math.min(Math.max(radiusKm / 111, 0.5), 5);
  return {
    minLat: Math.min(...latitudes) - padding,
    maxLat: Math.max(...latitudes) + padding,
    minLon: Math.min(...longitudes) - padding,
    maxLon: Math.max(...longitudes) + padding,
  };
}

function mapOpenSkyState(state: unknown[]): LiveFlight | undefined {
  const [
    icao24,
    callsign,
    originCountry,
    _timePosition,
    lastContact,
    longitude,
    latitude,
    baroAltitude,
    onGround,
    velocityMps,
    heading,
    verticalRate,
    _sensors,
    geoAltitude,
    squawk,
  ] = state;
  if (typeof latitude !== 'number' || typeof longitude !== 'number' || typeof icao24 !== 'string') return undefined;
  return {
    id: icao24,
    provider: 'opensky',
    callsign: typeof callsign === 'string' ? callsign.trim() || undefined : undefined,
    icao24,
    originCountry: typeof originCountry === 'string' ? originCountry : undefined,
    latitude,
    longitude,
    altitudeMeters: typeof baroAltitude === 'number' ? baroAltitude : undefined,
    geoAltitudeMeters: typeof geoAltitude === 'number' ? geoAltitude : undefined,
    speedKnots: typeof velocityMps === 'number' ? velocityMps * 1.94384 : undefined,
    headingDegrees: typeof heading === 'number' ? heading : undefined,
    verticalRate: typeof verticalRate === 'number' ? verticalRate : undefined,
    squawk: typeof squawk === 'string' ? squawk : undefined,
    onGround: Boolean(onGround),
    lastSeen: typeof lastContact === 'number' ? new Date(lastContact * 1000).toISOString() : new Date().toISOString(),
    sourceUpdatedAt: new Date().toISOString(),
    demo: false,
  };
}

function mapAdsbLolAircraft(aircraft: Record<string, unknown>): LiveFlight | undefined {
  const latitude = Number(aircraft.lat);
  const longitude = Number(aircraft.lon);
  const id = String(aircraft.hex ?? '');
  if (!id || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return undefined;

  return {
    id,
    provider: 'adsblol',
    callsign: typeof aircraft.flight === 'string' ? aircraft.flight.trim() || undefined : undefined,
    icao24: id,
    registration: typeof aircraft.r === 'string' ? aircraft.r : undefined,
    aircraftType: typeof aircraft.t === 'string' ? aircraft.t : undefined,
    operator: typeof aircraft.op === 'string' ? aircraft.op : undefined,
    originCountry: typeof aircraft.country === 'string' ? aircraft.country : undefined,
    latitude,
    longitude,
    altitudeMeters: typeof aircraft.alt_baro === 'number' ? aircraft.alt_baro * 0.3048 : undefined,
    geoAltitudeMeters: typeof aircraft.alt_geom === 'number' ? aircraft.alt_geom * 0.3048 : undefined,
    speedKnots: typeof aircraft.gs === 'number' ? aircraft.gs : undefined,
    headingDegrees: typeof aircraft.track === 'number' ? aircraft.track : undefined,
    verticalRate: typeof aircraft.baro_rate === 'number' ? aircraft.baro_rate * 0.00508 : undefined,
    squawk: typeof aircraft.squawk === 'string' ? aircraft.squawk : undefined,
    onGround: aircraft.alt_baro === 'ground',
    lastSeen: new Date(Date.now() - Number(aircraft.seen ?? 0) * 1000).toISOString(),
    sourceUpdatedAt: new Date().toISOString(),
    demo: false,
  };
}

function mockFlightFromNode(node: RouteNode, index: number): LiveFlight {
  return {
    id: `mock-${node.ident}-${index}`,
    provider: 'mock',
    callsign: `DEMO${100 + index}`,
    icao24: `demo${index}`,
    registration: `VT-D${index}MO`,
    aircraftType: index % 2 ? 'B738' : 'A320',
    operator: 'Demo Air',
    originCountry: 'Demo Network',
    latitude: node.lat + 0.35 + index * 0.05,
    longitude: node.lon - 0.35 + index * 0.04,
    altitudeMeters: 9000 + index * 300,
    geoAltitudeMeters: 9200 + index * 300,
    speedKnots: 418 + index * 8,
    headingDegrees: 120 + index * 12,
    verticalRate: index % 2 ? -1.2 : 0.8,
    squawk: '1200',
    onGround: false,
    lastSeen: new Date().toISOString(),
    sourceUpdatedAt: new Date().toISOString(),
    demo: true,
  };
}

function unavailableTrack(provider: LiveFlightProvider, flightId: string): FlightTrackResult {
  return {
    provider,
    flightId,
    points: [],
    available: false,
    message: 'Historical track unavailable from this provider.',
  };
}
