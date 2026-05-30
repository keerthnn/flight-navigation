import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Gauge, PlaneTakeoff, RadioTower } from 'lucide-react';
import { RiskBars } from '../../components/charts/RiskBars';
import { EmptyState } from '../../components/feedback/EmptyState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { RouteMap } from '../../components/maps/RouteMap';
import { MetricCard } from '../../components/ui/MetricCard';
import { DEFAULT_AIRCRAFT } from '../../constants/aircraft';
import { useAsync } from '../../hooks/useAsync';
import { useLiveFlight } from '../../hooks/useLiveFlight';
import { flightApi } from '../../services/api/flightApi';
import { useAppStore } from '../../store/appStore';
import { ActiveFlightsResult, FlightTrackResult, LiveFlight, RouteIntelligence } from '../../types/domain';
import { getFlightStableId } from '../../utils/flightIdentity';
import { formatNumber, riskLabel } from '../../utils/format';

export default function FlightDetailPage() {
  const { id } = useParams();
  const { data, error, loading, run } = useAsync<RouteIntelligence>();
  const activeFlights = useAsync<ActiveFlightsResult>();
  const selectedFlightDetail = useAsync<FlightTrackResult>();
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
  const [selectedFlightSnapshot, setSelectedFlightSnapshot] = useState<LiveFlight>();
  const [selectedMissingSince, setSelectedMissingSince] = useState<number | null>(null);
  const flights = activeFlights.data?.flights ?? [];
  const selectedFromList = selectedFlightId
    ? flights.find((flight) => getFlightStableId(flight) === selectedFlightId)
    : undefined;
  const selectedFlight = selectedFromList ?? selectedFlightSnapshot;
  const liveFlight = useLiveFlight(selectedFlight?.provider, selectedFlight?.id, id);
  const selectedFlightForUi = liveFlight.detail?.flight ?? selectedFlight;
  const store = useAppStore();
  const selectFlight = (flight: LiveFlight) => {
    const stableId = getFlightStableId(flight);
    setSelectedFlightId(stableId);
    setSelectedFlightSnapshot(flight);
    setSelectedMissingSince(null);
  };

  useEffect(() => {
    if (id) {
      store.setActiveRoute(id);
      void run(() => flightApi.getRouteIntelligence(id, DEFAULT_AIRCRAFT));
      void activeFlights.run(() => flightApi.getActiveFlights(id));
    }
  }, [activeFlights.run, id, run, store.setActiveRoute]);

  useEffect(() => {
    if (!selectedFlightId) {
      setSelectedFlightSnapshot(undefined);
      setSelectedMissingSince(null);
      return;
    }

    if (selectedFromList) {
      setSelectedFlightSnapshot(selectedFromList);
      setSelectedMissingSince(null);
      return;
    }

    setSelectedMissingSince((value) => value ?? Date.now());
  }, [selectedFlightId, selectedFromList]);

  useEffect(() => {
    if (!selectedFlightId || selectedFromList || selectedMissingSince === null) return;
    const timeoutRemaining = Math.max(30_000 - (Date.now() - selectedMissingSince), 0);
    const timer = window.setTimeout(() => {
      setSelectedFlightId(null);
      setSelectedFlightSnapshot(undefined);
      setSelectedMissingSince(null);
    }, timeoutRemaining);
    return () => window.clearTimeout(timer);
  }, [selectedFlightId, selectedFromList, selectedMissingSince]);

  useEffect(() => {
    if (selectedFlightForUi) {
      void selectedFlightDetail.run(() => flightApi.getFlightTrack(selectedFlightForUi.provider, selectedFlightForUi.id));
    }
  }, [selectedFlightDetail.run, selectedFlightForUi]);

  useEffect(() => {
    flightApi.getProviders().then(store.setProviderStatus).catch(() => undefined);
  }, [store.setProviderStatus]);

  function exportSummary() {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${data.flight.id}-route-intelligence.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <LoadingState label="Loading route intelligence" />;
  if (error) return <EmptyState title="Unable to load route" description={error} />;
  if (!data) return <EmptyState title="Route not found" description="The selected flight plan could not be resolved." />;

  const { flight, weather, fuel, routeWeight } = data;

  return (
    <div className="detail-grid">
      <section className="detail-sidebar">
        <Link className="back-link" to="/">
          <ArrowLeft size={16} /> Routes
        </Link>
        <div className="panel-heading compact">
          <span className="eyebrow">
            <PlaneTakeoff size={14} /> {flight.source}
          </span>
          <h1>{flight.fromICAO} to {flight.toICAO}</h1>
          <p>{flight.fromName} to {flight.toName}</p>
        </div>
        <div className="metric-grid">
          <MetricCard label="Distance" value={`${formatNumber(flight.distance)} km`} detail="great-circle estimate" />
          <MetricCard label="Route risk" value={`${routeWeight.toFixed(1)} / 10`} detail={riskLabel(routeWeight)} />
          <MetricCard label="Fuel" value={`${formatNumber(fuel.fuelKg)} kg`} detail={fuel.model} />
          <MetricCard label="CO2" value={`${formatNumber(fuel.co2Kg)} kg`} detail="estimated emissions" />
        </div>
        <div className="realtime-status" aria-live="polite">
          <span className={`status-dot ${liveFlight.status}`} />
          <strong>{liveFlight.status === 'live' ? 'Live aircraft stream' : 'Polling fallback'}</strong>
          <small>{selectedFlightForUi ? `${selectedFlightForUi.callsign ?? selectedFlightForUi.id} · provider ${selectedFlightForUi.provider}` : 'Select an active aircraft'}</small>
        </div>
        <button className="secondary-button" type="button" onClick={exportSummary}>
          <Download size={18} /> Export JSON
        </button>
      </section>

      <section className="map-panel">
        <RouteMap
          nodes={flight.route.nodes}
          activeFlights={activeFlights.data?.flights}
          selectedFlight={selectedFlightForUi}
          trackPoints={selectedFlightDetail.data?.points}
          onSelectFlight={selectFlight}
        />
      </section>

      <aside className="intelligence-panel">
        <div className="section-title">
          <h2>Weather Impact</h2>
          <span><Gauge size={14} /> live-free fallback</span>
        </div>
        <div className="provider-badge">
          Provider mode: {store.providerStatus ? 'configured adapters ready' : 'checking adapters'}
        </div>
        <div className="traffic-panel">
          <div className="section-title compact-title">
            <h3>Active Flights</h3>
            <span>{activeFlights.data?.source ?? 'loading'}</span>
          </div>
          {activeFlights.data?.demo ? <div className="demo-badge">Demo Data · Simulated Flight</div> : null}
          {activeFlights.loading ? <small>Scanning live traffic near this route...</small> : null}
          {activeFlights.error ? <small>{activeFlights.error}</small> : null}
          {(activeFlights.data?.flights ?? []).slice(0, 6).map((traffic) => {
            const stableId = getFlightStableId(traffic);
            const isSelected = selectedFlightId === stableId;
            return (
              <button
                className={isSelected ? 'traffic-row selected' : 'traffic-row'}
                type="button"
                key={stableId}
                onClick={() => selectFlight(traffic)}
              >
              <strong>{traffic.callsign ?? traffic.id}</strong>
              <span>{traffic.registration ?? traffic.icao24 ?? traffic.provider}</span>
              <small>
                {traffic.aircraftType ?? 'type unknown'} · {traffic.altitudeMeters ? `${formatNumber(traffic.altitudeMeters)} m` : 'alt unknown'} ·{' '}
                {traffic.speedKnots ? `${formatNumber(traffic.speedKnots)} kt` : 'speed unknown'}
              </small>
              </button>
            );
          })}
        </div>
        {(liveFlight.detail || selectedFlightForUi) ? (
          <div className="flight-detail-panel">
            <div className="section-title compact-title">
              <h3>Selected Aircraft</h3>
              <span><RadioTower size={14} /> {liveFlight.detail?.flight.provider ?? selectedFlightForUi?.provider}</span>
            </div>
            {liveFlight.detail?.flight.demo || selectedFlightForUi?.demo ? <div className="demo-badge">Demo Data · Simulated Flight</div> : null}
            <dl>
              <dt>Callsign</dt>
              <dd>{liveFlight.detail?.flight.callsign ?? selectedFlightForUi?.callsign ?? 'Unknown'}</dd>
              <dt>ICAO24 / Hex</dt>
              <dd>{liveFlight.detail?.flight.icao24 ?? selectedFlightForUi?.icao24 ?? selectedFlightForUi?.id}</dd>
              <dt>Registration</dt>
              <dd>{liveFlight.detail?.flight.registration ?? selectedFlightForUi?.registration ?? 'Unknown'}</dd>
              <dt>Aircraft Type</dt>
              <dd>{liveFlight.detail?.flight.aircraftType ?? selectedFlightForUi?.aircraftType ?? 'Unknown'}</dd>
              <dt>Altitude</dt>
              <dd>{formatNumber(liveFlight.detail?.flight.altitudeMeters ?? selectedFlightForUi?.altitudeMeters ?? 0)} m</dd>
              <dt>Ground Speed</dt>
              <dd>{formatNumber(liveFlight.detail?.flight.speedKnots ?? selectedFlightForUi?.speedKnots ?? 0)} kt</dd>
              <dt>Heading</dt>
              <dd>{formatNumber(liveFlight.detail?.flight.headingDegrees ?? selectedFlightForUi?.headingDegrees ?? 0)} deg</dd>
              <dt>Route Distance</dt>
              <dd>{liveFlight.detail?.routeContext ? `${liveFlight.detail.routeContext.distanceFromRouteKm} km` : 'Calculating'}</dd>
              <dt>Track</dt>
              <dd>{selectedFlightDetail.data?.available ? `${selectedFlightDetail.data.points.length} points` : 'Track unavailable'}</dd>
            </dl>
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                setSelectedFlightId(null);
                setSelectedFlightSnapshot(undefined);
                setSelectedMissingSince(null);
              }}
            >
              Clear selection
            </button>
          </div>
        ) : null}
        <RiskBars weather={weather} />
        <div className="weather-list">
          {weather.map((point) => (
            <article key={point.ident}>
              <strong>{point.ident}</strong>
              <span>{point.description}</span>
              <small>
                {point.temperatureC.toFixed(1)} C · wind {point.windSpeedMps.toFixed(1)} m/s · visibility {formatNumber(point.visibilityMeters)} m
              </small>
            </article>
          ))}
        </div>
      </aside>
    </div>
  );
}
