import { FormEvent, useState } from 'react';
import { ArrowRightLeft, RadioTower, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../../components/feedback/EmptyState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { MetricCard } from '../../components/ui/MetricCard';
import { useAsync } from '../../hooks/useAsync';
import { flightApi } from '../../services/api/flightApi';
import { useAppStore } from '../../store/appStore';
import { Airport, FlightPlanSummary } from '../../types/domain';
import { formatNumber } from '../../utils/format';
import { AirportAutocomplete } from './AirportAutocomplete';

export default function RouteSearchPage() {
  const navigate = useNavigate();
  const store = useAppStore();
  const [from, setFrom] = useState<Airport | undefined>(store.selectedFrom);
  const [to, setTo] = useState<Airport | undefined>(store.selectedTo);
  const { data: flights = [], error, loading, run } = useAsync<FlightPlanSummary[]>();

  function swapAirports() {
    setFrom(to);
    setTo(from);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!from || !to) return;
    store.selectFrom(from);
    store.selectTo(to);
    store.recordSearch(from.icao, to.icao);
    await run(() => flightApi.searchFlightPlans(from.icao, to.icao));
  }

  return (
    <div className="dashboard-grid">
      <section className="search-panel">
        <div className="panel-heading">
          <span className="eyebrow">
            <RadioTower size={14} /> Aviation intelligence
          </span>
          <h1>Plan resilient routes with weather and fuel awareness.</h1>
          <p>Search airport pairs, compare generated fallback plans, and inspect route risk without exposing provider keys in the browser.</p>
        </div>

        <form className="route-form" onSubmit={handleSubmit}>
          <AirportAutocomplete label="Departure" placeholder="Search airport or ICAO" value={from} onSelect={setFrom} />
          <button className="swap-button" type="button" onClick={swapAirports} aria-label="Swap route endpoints">
            <ArrowRightLeft size={18} />
          </button>
          <AirportAutocomplete label="Arrival" placeholder="Search airport or ICAO" value={to} onSelect={setTo} />
          <button className="primary-button" type="submit" disabled={!from || !to || loading}>
            <Search size={18} />
            {loading ? 'Searching' : 'Search routes'}
          </button>
        </form>

        {error ? <p className="inline-error">{error}</p> : null}
      </section>

      <section className="results-panel">
        <div className="section-title">
          <h2>Candidate Flight Plans</h2>
          <span>{flights.length} routes</span>
        </div>
        {loading ? <LoadingState label="Searching route providers" /> : null}
        {!loading && !flights.length ? (
          <EmptyState title="No route selected" description="Choose departure and arrival airports to generate route intelligence." />
        ) : null}
        <div className="flight-list">
          {flights.map((flight) => (
            <button
              className="flight-row"
              type="button"
              key={flight.id}
              onClick={() => {
                store.setActiveRoute(flight.id);
                navigate(`/flight/${flight.id}`);
              }}
            >
              <span>
                <strong>{flight.fromICAO}</strong>
                <i />
                <strong>{flight.toICAO}</strong>
              </span>
              <p>{flight.fromName} to {flight.toName}</p>
              <div className="flight-row-metrics">
                <MetricCard label="Distance" value={`${formatNumber(flight.distance)} km`} detail={flight.source} />
                <MetricCard label="Waypoints" value={flight.waypoints.split(',').length} detail={flight.id} />
              </div>
            </button>
          ))}
        </div>
        {store.recentSearches.length ? (
          <div className="recent-searches" aria-label="Recent route searches">
            <span>Recent</span>
            {store.recentSearches.map((search) => (
              <button
                type="button"
                key={`${search.fromICAO}-${search.toICAO}`}
                onClick={() => void run(() => flightApi.searchFlightPlans(search.fromICAO, search.toICAO))}
              >
                {search.fromICAO} to {search.toICAO}
              </button>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
