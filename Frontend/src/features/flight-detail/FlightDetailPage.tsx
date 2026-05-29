import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Gauge, PlaneTakeoff } from 'lucide-react';
import { RiskBars } from '../../components/charts/RiskBars';
import { EmptyState } from '../../components/feedback/EmptyState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { RouteMap } from '../../components/maps/RouteMap';
import { MetricCard } from '../../components/ui/MetricCard';
import { DEFAULT_AIRCRAFT } from '../../constants/aircraft';
import { useAsync } from '../../hooks/useAsync';
import { useRouteSimulation } from '../../hooks/useRouteSimulation';
import { flightApi } from '../../services/api/flightApi';
import { useAppStore } from '../../store/appStore';
import { RouteIntelligence } from '../../types/domain';
import { formatNumber, riskLabel } from '../../utils/format';

export default function FlightDetailPage() {
  const { id } = useParams();
  const { data, error, loading, run } = useAsync<RouteIntelligence>();
  const simulation = useRouteSimulation(id);
  const store = useAppStore();

  useEffect(() => {
    if (id) {
      store.setActiveRoute(id);
      void run(() => flightApi.getRouteIntelligence(id, DEFAULT_AIRCRAFT));
    }
  }, [id, run, store.setActiveRoute]);

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
          <span className={`status-dot ${simulation.status}`} />
          <strong>{simulation.status === 'live' ? 'Realtime stream' : 'Local fallback'}</strong>
          <small>
            {simulation.frame
              ? `${Math.round(simulation.frame.progress * 100)}% complete · heading ${simulation.frame.heading} deg · ${simulation.frame.status}`
              : 'Waiting for route simulation'}
          </small>
        </div>
        <button className="secondary-button" type="button" onClick={exportSummary}>
          <Download size={18} /> Export JSON
        </button>
      </section>

      <section className="map-panel">
        <RouteMap
          nodes={flight.route.nodes}
          livePosition={simulation.frame ? [simulation.frame.position.lat, simulation.frame.position.lon] : undefined}
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
