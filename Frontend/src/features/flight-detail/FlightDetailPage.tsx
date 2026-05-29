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
import { formatNumber, riskLabel } from '../../utils/format';

export default function FlightDetailPage() {
  const { id } = useParams();
  const { data, error, loading, run } = useAsync<RouteIntelligence>();
  const activeFlights = useAsync<ActiveFlightsResult>();
  const selectedFlightDetail = useAsync<FlightTrackResult>();
  const [selectedFlight, setSelectedFlight] = useState<LiveFlight>();
  const liveFlight = useLiveFlight(selectedFlight?.provider, selectedFlight?.id, id);
  const store = useAppStore();

  useEffect(() => {
    if (id) {
      store.setActiveRoute(id);
      void run(() => flightApi.getRouteIntelligence(id, DEFAULT_AIRCRAFT));
      void activeFlights.run(() => flightApi.getActiveFlights(id));
    }
  }, [activeFlights.run, id, run, store.setActiveRoute]);

  useEffect(() => {
    const firstFlight = activeFlights.data?.flights[0];
    if (!selectedFlight && firstFlight) setSelectedFlight(firstFlight);
  }, [activeFlights.data?.flights, selectedFlight]);

  useEffect(() => {
    if (selectedFlight) {
      void selectedFlightDetail.run(() => flightApi.getFlightTrack(selectedFlight.provider, selectedFlight.id));
    }
  }, [selectedFlight, selectedFlightDetail.run]);

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
          <small>{selectedFlight ? `${selectedFlight.callsign ?? selectedFlight.id} · provider ${selectedFlight.provider}` : 'Select an active aircraft'}</small>
        </div>
        <button className="secondary-button" type="button" onClick={exportSummary}>
          <Download size={18} /> Export JSON
        </button>
      </section>

      <section className="map-panel">
        <RouteMap
          nodes={flight.route.nodes}
          activeFlights={activeFlights.data?.flights}
          selectedFlight={liveFlight.detail?.flight ?? selectedFlight}
          trackPoints={selectedFlightDetail.data?.points}
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
          {(activeFlights.data?.flights ?? []).slice(0, 6).map((traffic) => (
            <button
              className={selectedFlight?.id === traffic.id ? 'traffic-row selected' : 'traffic-row'}
              type="button"
              key={traffic.id}
              onClick={() => setSelectedFlight(traffic)}
            >
              <strong>{traffic.callsign ?? traffic.id}</strong>
              <span>{traffic.registration ?? traffic.icao24 ?? traffic.provider}</span>
              <small>
                {traffic.aircraftType ?? 'type unknown'} · {traffic.altitudeMeters ? `${formatNumber(traffic.altitudeMeters)} m` : 'alt unknown'} ·{' '}
                {traffic.speedKnots ? `${formatNumber(traffic.speedKnots)} kt` : 'speed unknown'}
              </small>
            </button>
          ))}
        </div>
        {(liveFlight.detail || selectedFlight) ? (
          <div className="flight-detail-panel">
            <div className="section-title compact-title">
              <h3>Selected Aircraft</h3>
              <span><RadioTower size={14} /> {liveFlight.detail?.flight.provider ?? selectedFlight?.provider}</span>
            </div>
            {liveFlight.detail?.flight.demo || selectedFlight?.demo ? <div className="demo-badge">Demo Data · Simulated Flight</div> : null}
            <dl>
              <dt>Callsign</dt>
              <dd>{liveFlight.detail?.flight.callsign ?? selectedFlight?.callsign ?? 'Unknown'}</dd>
              <dt>ICAO24 / Hex</dt>
              <dd>{liveFlight.detail?.flight.icao24 ?? selectedFlight?.icao24 ?? selectedFlight?.id}</dd>
              <dt>Registration</dt>
              <dd>{liveFlight.detail?.flight.registration ?? selectedFlight?.registration ?? 'Unknown'}</dd>
              <dt>Aircraft Type</dt>
              <dd>{liveFlight.detail?.flight.aircraftType ?? selectedFlight?.aircraftType ?? 'Unknown'}</dd>
              <dt>Altitude</dt>
              <dd>{formatNumber(liveFlight.detail?.flight.altitudeMeters ?? selectedFlight?.altitudeMeters ?? 0)} m</dd>
              <dt>Ground Speed</dt>
              <dd>{formatNumber(liveFlight.detail?.flight.speedKnots ?? selectedFlight?.speedKnots ?? 0)} kt</dd>
              <dt>Heading</dt>
              <dd>{formatNumber(liveFlight.detail?.flight.headingDegrees ?? selectedFlight?.headingDegrees ?? 0)} deg</dd>
              <dt>Route Distance</dt>
              <dd>{liveFlight.detail?.routeContext ? `${liveFlight.detail.routeContext.distanceFromRouteKm} km` : 'Calculating'}</dd>
              <dt>Track</dt>
              <dd>{selectedFlightDetail.data?.available ? `${selectedFlightDetail.data.points.length} points` : 'Track unavailable'}</dd>
            </dl>
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
