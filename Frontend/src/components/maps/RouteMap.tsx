import { useEffect, useMemo } from 'react';
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet';
import L, { DivIcon } from 'leaflet';
import airportIconUrl from '../../assets/airport.png';
import { config } from '../../config/env';
import { FlightTrackPoint, LiveFlight, RouteNode } from '../../types/domain';
import { getFlightStableId, hasValidCoordinates } from '../../utils/flightIdentity';

interface RouteMapProps {
  nodes: RouteNode[];
  activeFlights?: LiveFlight[];
  selectedFlight?: LiveFlight;
  trackPoints?: FlightTrackPoint[];
  onSelectFlight?: (flight: LiveFlight) => void;
}

const airportIcon = new L.Icon({
  iconUrl: airportIconUrl,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function createAircraftIcon(heading: number | undefined, selected: boolean): DivIcon {
  const rotation = Number.isFinite(heading) ? heading : 0;
  const size = selected ? 28 : 22;
  const glow = selected ? '#ff8f3f' : '#56d364';
  return L.divIcon({
    className: 'aircraft-div-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;transform:rotate(${rotation}deg);display:grid;place-items:center;"><svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true"><path d="M31 3l8 18 19 7v8l-20-3-2 24 7 4v3l-11-2-11 2v-3l7-4-2-24-20 3v-8l19-7z" fill="${glow}" stroke="#0f172a" stroke-width="2"/></svg></div>`,
  });
}

export function RouteMap({ nodes, activeFlights = [], selectedFlight, trackPoints = [], onSelectFlight }: RouteMapProps) {
  const path = useMemo(() => nodes.map((node) => [node.lat, node.lon] as [number, number]), [nodes]);
  const trackPath = useMemo(
    () =>
      trackPoints
        .filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude))
        .map((point) => [point.latitude, point.longitude] as [number, number]),
    [trackPoints],
  );
  const flights = useMemo(() => activeFlights.filter(hasValidCoordinates), [activeFlights]);
  const selectedStableId = selectedFlight ? getFlightStableId(selectedFlight) : null;

  return (
    <MapContainer className="route-map map-2d" center={path[0] ?? [20, 0]} zoom={5} scrollWheelZoom>
      <FitRouteAndSelection path={path} selectedFlight={selectedFlight} />
      <TileLayer url={config.tileUrl} attribution={config.tileAttribution} />

      <Polyline positions={path} color="#38bdf8" weight={2} opacity={0.65} />
      {trackPath.length > 1 ? <Polyline positions={trackPath} color="#a78bfa" weight={2} dashArray="5 7" opacity={0.85} /> : null}

      {nodes.map((node) =>
        node.type === 'waypoint' ? (
          <CircleMarker key={node.ident} center={[node.lat, node.lon]} radius={4} color="#f59e0b" fillColor="#f59e0b" fillOpacity={0.85}>
            <Popup>{node.ident}: {node.name}</Popup>
          </CircleMarker>
        ) : (
          <Marker key={node.ident} position={[node.lat, node.lon]} icon={airportIcon}>
            <Popup>{node.name} ({node.ident})</Popup>
          </Marker>
        ),
      )}

      {flights.map((flight) => {
        const stableId = getFlightStableId(flight);
        const isSelected = selectedStableId === stableId;
        const demoLabel = flight.demo ? ' · Demo Data' : '';
        return (
          <Marker
            key={stableId}
            position={[flight.latitude, flight.longitude]}
            icon={createAircraftIcon(flight.headingDegrees, isSelected)}
            zIndexOffset={isSelected ? 1000 : 700}
            eventHandlers={{
              click: () => onSelectFlight?.(flight),
            }}
          >
            {isSelected ? (
              <Tooltip permanent direction="top" offset={[0, -16]}>
                {(flight.callsign ?? flight.icao24 ?? flight.id) + demoLabel}
              </Tooltip>
            ) : null}
            <Popup>
              <strong>{flight.callsign ?? flight.id}</strong>
              <br />
              Provider: {flight.provider}
              {flight.demo ? (
                <>
                  <br />
                  Demo Data
                </>
              ) : null}
              <br />
              Altitude: {flight.altitudeMeters ? `${Math.round(flight.altitudeMeters)} m` : 'unknown'}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

function FitRouteAndSelection({ path, selectedFlight }: { path: [number, number][]; selectedFlight?: LiveFlight }) {
  const map = useMap();

  useEffect(() => {
    if (selectedFlight && hasValidCoordinates(selectedFlight)) {
      map.flyTo([selectedFlight.latitude, selectedFlight.longitude], Math.max(map.getZoom(), 6), {
        duration: 0.6,
      });
      return;
    }

    if (path.length > 1) {
      map.fitBounds(path, { padding: [36, 36] });
    }
  }, [map, path, selectedFlight]);

  return null;
}
