import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_AIRCRAFT } from '../constants/aircraft';
import { useADSBLive } from '../hooks/useADSBLive';
import { useAsync } from '../hooks/useAsync';
import { useLiveFlight } from '../hooks/useLiveFlight';
import { useSunriseSunset } from '../hooks/useSunriseSunset';
import { useWeatherMidpoint } from '../hooks/useWeatherMidpoint';
import { flightApi } from '../services/api/flightApi';
import { ActiveFlightsResult, LiveFlight, RouteIntelligence } from '../types/domain';
import { MidpointWeatherData, SunriseSunsetData } from '../types/external';
import { getFlightStableId } from '../utils/flightIdentity';

interface FlightDetailState {
  intelligence: RouteIntelligence | null;
  intelligenceLoading: boolean;
  intelligenceError: string | null;
  activeFlights: LiveFlight[];
  activeFlightsLoading: boolean;
  activeFlightsError: string | null;
  activeFlightsFreshnessMs: number | null;
  selectedFlightId: string | null;
  setSelectedFlightId: (id: string | null) => void;
  selectedWaypointIndex: number | null;
  setSelectedWaypointIndex: (index: number | null) => void;
  liveFlight: LiveFlight | null;
  connectionStatus: 'live' | 'degraded' | 'offline';
  midpointWeather: MidpointWeatherData | null;
  midpointWeatherLoading: boolean;
  sunriseSunset: SunriseSunsetData | null;
  sunriseSunsetLoading: boolean;
  pilotDecision: 'GO' | 'CAUTION' | 'NO-GO';
  hasCB: boolean;
  cbNodes: string[];
  isNightOperation: boolean;
  alternatesTriggered: boolean;
  routeId: string;
}

const FlightDetailContext = createContext<FlightDetailState | undefined>(undefined);

export function FlightDetailProvider({ routeId, children }: PropsWithChildren<{ routeId: string }>) {
  const intelligenceAsync = useAsync<RouteIntelligence>();
  const activeFlightsAsync = useAsync<ActiveFlightsResult>();
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
  const [selectedWaypointIndex, setSelectedWaypointIndex] = useState<number | null>(null);

  useEffect(() => {
    void intelligenceAsync.run(() => flightApi.getRouteIntelligence(routeId, DEFAULT_AIRCRAFT));
    void activeFlightsAsync.run(() => flightApi.getActiveFlights(routeId));
  }, [routeId]);

  const nodes = intelligenceAsync.data?.flight.route.nodes ?? [];
  const weather = useWeatherMidpoint(nodes);
  const lat = nodes.length ? nodes.reduce((sum, n) => sum + n.lat, 0) / nodes.length : undefined;
  const lon = nodes.length ? nodes.reduce((sum, n) => sum + n.lon, 0) / nodes.length : undefined;
  const sunrise = useSunriseSunset(lat, lon);
  const adsb = useADSBLive(lat, lon);

  const backendFlights = activeFlightsAsync.data?.flights ?? [];
  const selectedFlight = selectedFlightId
    ? backendFlights.find((flight) => getFlightStableId(flight) === selectedFlightId)
    : undefined;

  const fallbackFlights: LiveFlight[] = adsb.enabled && (!backendFlights.length || !!activeFlightsAsync.error)
    ? adsb.aircraft.map((ac) => ({
      id: ac.icao,
      provider: 'adsblol',
      latitude: ac.lat,
      longitude: ac.lon,
      speedKnots: ac.groundspeedKt,
      headingDegrees: ac.trackDeg,
      altitudeMeters: ac.altitudeFt * 0.3048,
      onGround: false,
      lastSeen: ac.lastSeenUtc,
      sourceUpdatedAt: ac.lastSeenUtc,
      callsign: ac.callsign,
      demo: false,
    }))
    : [];

  const activeFlights = backendFlights.length ? backendFlights : fallbackFlights;
  const live = useLiveFlight(selectedFlight?.provider, selectedFlight?.id, routeId);

  const hasCB = intelligenceAsync.data?.weather.some((point) => point.cbDetected) ?? false;
  const cbNodes = intelligenceAsync.data?.weather.filter((point) => point.cbDetected).map((point) => point.ident) ?? [];
  const isNightOperation = intelligenceAsync.data?.isNightOperation ?? false;
  const destinationWeather = intelligenceAsync.data?.weather[intelligenceAsync.data.weather.length - 1] ?? null;
  const alternatesTriggered = Boolean(
    hasCB
      || destinationWeather?.flightCategory === 'IFR'
      || destinationWeather?.flightCategory === 'LIFR'
      || intelligenceAsync.data?.pilotDecision === 'NO-GO'
      || intelligenceAsync.data?.pilotDecision === 'CAUTION',
  );

  const pilotDecision = useMemo<'GO' | 'CAUTION' | 'NO-GO'>(() => {
    if (intelligenceAsync.data?.pilotDecision) return intelligenceAsync.data.pilotDecision;
    const risk = intelligenceAsync.data?.routeWeight ?? 0;
    const closeTraffic = activeFlights.filter((flight) => {
      if (!nodes.length) return false;
      const anchor = nodes[Math.floor(nodes.length / 2)] ?? nodes[0];
      const delta = Math.hypot(flight.latitude - anchor.lat, flight.longitude - anchor.lon);
      return delta < 0.2;
    }).length;
    const categories = intelligenceAsync.data?.weather.map((point) => point.flightCategory) ?? [];
    if (risk >= 6 || categories.includes('LIFR') || closeTraffic > 5 || hasCB) return 'NO-GO';
    if (risk >= 3 || categories.includes('IFR') || (weather.data?.windspeedKnots ?? 0) > 50 || isNightOperation) return 'CAUTION';
    return 'GO';
  }, [activeFlights, hasCB, intelligenceAsync.data, isNightOperation, nodes, weather.data?.windspeedKnots]);

  const value: FlightDetailState = {
    intelligence: intelligenceAsync.data ?? null,
    intelligenceLoading: intelligenceAsync.loading,
    intelligenceError: intelligenceAsync.error ?? null,
    activeFlights,
    activeFlightsLoading: activeFlightsAsync.loading,
    activeFlightsError: activeFlightsAsync.error ?? null,
    activeFlightsFreshnessMs: activeFlightsAsync.data ? Date.now() - new Date(activeFlightsAsync.data.generatedAt).getTime() : null,
    selectedFlightId,
    setSelectedFlightId,
    selectedWaypointIndex,
    setSelectedWaypointIndex,
    liveFlight: live.detail?.flight ?? selectedFlight ?? null,
    connectionStatus: live.connectionStatus,
    midpointWeather: weather.data,
    midpointWeatherLoading: weather.loading,
    sunriseSunset: sunrise.sunriseUtc && sunrise.sunsetUtc
      ? { sunriseUtc: sunrise.sunriseUtc, sunsetUtc: sunrise.sunsetUtc, dayLengthSeconds: sunrise.dayLengthSeconds ?? 0, fetchedAtUtc: new Date().toISOString() }
      : null,
    sunriseSunsetLoading: sunrise.loading,
    pilotDecision,
    hasCB,
    cbNodes,
    isNightOperation,
    alternatesTriggered,
    routeId,
  };

  return <FlightDetailContext.Provider value={value}>{children}</FlightDetailContext.Provider>;
}

export function useFlightDetail() {
  const context = useContext(FlightDetailContext);
  if (!context) throw new Error('useFlightDetail must be used inside FlightDetailProvider');
  return context;
}
