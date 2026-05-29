import { useEffect, useMemo } from 'react';
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { config } from '../../config/env';
import airplane from '../../assets/airplane1.png';
import airport from '../../assets/airport.png';
import { FlightTrackPoint, LiveFlight, RouteNode } from '../../types/domain';

interface RouteMapProps {
  nodes: RouteNode[];
  activeFlights?: LiveFlight[];
  selectedFlight?: LiveFlight;
  trackPoints?: FlightTrackPoint[];
}

const aircraftIcon = new L.Icon({
  iconUrl: airplane,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const airportIcon = new L.Icon({
  iconUrl: airport,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export function RouteMap({ nodes, activeFlights = [], selectedFlight, trackPoints = [] }: RouteMapProps) {
  const path = useMemo(() => nodes.map((node) => [node.lat, node.lon] as [number, number]), [nodes]);
  const trackPath = useMemo(() => trackPoints.map((point) => [point.latitude, point.longitude] as [number, number]), [trackPoints]);

  return (
    <MapContainer className="route-map" center={path[0]} zoom={5} scrollWheelZoom>
      <FitBounds path={path} />
      <TileLayer url={config.tileUrl} attribution={config.tileAttribution} />
      <Polyline positions={path} color="#38bdf8" weight={4} opacity={0.85} />
      {nodes.map((node) =>
        node.type === 'waypoint' ? (
          <CircleMarker key={node.ident} center={[node.lat, node.lon]} radius={5} color="#f59e0b">
            <Popup>
              {node.ident}: {node.name}
            </Popup>
          </CircleMarker>
        ) : (
          <Marker key={node.ident} position={[node.lat, node.lon]} icon={airportIcon}>
            <Popup>
              {node.name} ({node.ident})
            </Popup>
          </Marker>
        ),
      )}
      {trackPath.length > 1 ? <Polyline positions={trackPath} color="#a78bfa" weight={3} dashArray="6 8" opacity={0.9} /> : null}
      {activeFlights.map((flight) => (
        <CircleMarker
          key={flight.id}
          center={[flight.latitude, flight.longitude]}
          radius={7}
          color={flight.provider === 'mock' ? '#a78bfa' : '#22c55e'}
          fillColor={flight.provider === 'mock' ? '#a78bfa' : '#22c55e'}
          fillOpacity={0.72}
        >
          <Popup>
            <strong>{flight.callsign ?? flight.id}</strong>
            <br />
            Provider: {flight.provider}
            <br />
            Altitude: {flight.altitudeMeters ? `${Math.round(flight.altitudeMeters)} m` : 'unknown'}
          </Popup>
        </CircleMarker>
      ))}
      {selectedFlight ? (
        <Marker position={[selectedFlight.latitude, selectedFlight.longitude]} icon={aircraftIcon}>
          <Popup>
            <strong>{selectedFlight.callsign ?? selectedFlight.id}</strong>
            <br />
            Actual provider position
          </Popup>
        </Marker>
      ) : null}
    </MapContainer>
  );
}

function FitBounds({ path }: { path: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (path.length > 1) {
      map.fitBounds(path, { padding: [40, 40] });
    }
  }, [map, path]);

  return null;
}
