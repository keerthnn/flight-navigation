import { useMemo, useState } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Box, IconButton, Stack } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import FitScreenIcon from '@mui/icons-material/FitScreen';
import FlightIcon from '@mui/icons-material/Flight';
import { FlightTrackPoint, LiveFlight, RouteNode } from '../../types/domain';
import { useThemeMode } from '../../context/ThemeContext';
import { interpolateGreatCircle } from '../../utils/geodesic';
import { Units } from '../../utils/units';
import { getFlightStableId, hasValidCoordinates } from '../../utils/flightIdentity';
import { MinimapControl } from './MinimapControl';

interface RouteMapProps {
  nodes: RouteNode[];
  activeFlights?: LiveFlight[];
  selectedFlight?: LiveFlight;
  trackPoints?: FlightTrackPoint[];
  onSelectFlight?: (flight: LiveFlight) => void;
  selectedWaypointIndex?: number | null;
  onSelectWaypoint?: (index: number) => void;
}

function createNodeIcon(color: string, symbol: string, size = 22) {
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:999px;background:${color};display:grid;place-items:center;color:white;font-size:11px">${symbol}</div>`,
  });
}

function createFlightIcon(heading = 0, selected = false) {
  const size = selected ? 30 : 24;
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="position:relative;width:${size}px;height:${size}px;display:grid;place-items:center;transform:rotate(${heading}deg);transition:transform 300ms ease-out">${selected ? '<span style="position:absolute;inset:0;border-radius:999px;border:1px solid #FF833A;animation:pulse-ring 1.5s infinite"></span>' : ''}<svg viewBox="0 0 64 64" width="${size}" height="${size}"><path d="M31 3l8 18 19 7v8l-20-3-2 24 7 4v3l-11-2-11 2v-3l7-4-2-24-20 3v-8l19-7z" fill="#E65100" stroke="#0f172a" stroke-width="2"/></svg></div>`,
  });
}

function Controls({ path, showTraffic, setShowTraffic }: { path: [number, number][]; showTraffic: boolean; setShowTraffic: (value: boolean) => void }) {
  const map = useMap();

  return (
    <Stack className="map-controls" spacing={0.6} sx={{ position: 'absolute', right: 12, top: 12, zIndex: 1000, bgcolor: 'background.paper', p: 0.5, borderRadius: 1 }}>
      <IconButton size="small" aria-label="Zoom in" onClick={() => map.zoomIn()}><AddIcon fontSize="small" /></IconButton>
      <IconButton size="small" aria-label="Zoom out" onClick={() => map.zoomOut()}><RemoveIcon fontSize="small" /></IconButton>
      <IconButton size="small" aria-label="Fit route to view" onClick={() => map.fitBounds(path, { padding: [40, 40] })}><FitScreenIcon fontSize="small" /></IconButton>
      <IconButton size="small" aria-label="Toggle traffic layer" color={showTraffic ? 'primary' : 'default'} onClick={() => setShowTraffic(!showTraffic)}><FlightIcon fontSize="small" /></IconButton>
    </Stack>
  );
}

export function RouteMap({
  nodes,
  activeFlights = [],
  selectedFlight,
  trackPoints = [],
  onSelectFlight,
  selectedWaypointIndex,
  onSelectWaypoint,
}: RouteMapProps) {
  const { mode } = useThemeMode();
  const [showTraffic, setShowTraffic] = useState(true);
  const flights = useMemo(() => activeFlights.filter(hasValidCoordinates), [activeFlights]);
  const selectedStableId = selectedFlight ? getFlightStableId(selectedFlight) : null;

  const path = useMemo(() => {
    if (nodes.length < 2) return nodes.map((n) => [n.lat, n.lon] as [number, number]);
    const departure = nodes[0];
    const arrival = nodes[nodes.length - 1];
    return interpolateGreatCircle([departure.lat, departure.lon], [arrival.lat, arrival.lon], 80);
  }, [nodes]);

  const trackPath = useMemo(
    () => trackPoints.map((point) => [point.latitude, point.longitude] as [number, number]),
    [trackPoints],
  );

  const tileUrl = mode === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapContainer className="route-map map-2d" center={path[0] ?? [20, 0]} zoom={5} scrollWheelZoom>
        <TileLayer url={tileUrl} attribution="© OpenStreetMap contributors © CARTO" />
        <Polyline positions={path} color={mode === 'dark' ? '#26C6DA' : '#1565C0'} weight={3} opacity={0.9} />
        {trackPath.length > 1 ? <Polyline positions={trackPath} color="#FFA726" weight={2} dashArray="5 6" /> : null}

        {nodes.map((node, index) => {
          const isSelectedWaypoint = selectedWaypointIndex === index;
          const icon = node.type === 'departure'
            ? createNodeIcon('#2E7D32', '▲', isSelectedWaypoint ? 38 : 32)
            : node.type === 'arrival'
              ? createNodeIcon('#B71C1C', '⚑', isSelectedWaypoint ? 38 : 32)
              : createNodeIcon('#26C6DA', '◆', isSelectedWaypoint ? 22 : 16);
          return (
            <Marker key={`${node.ident}-${node.lat}-${node.lon}`} position={[node.lat, node.lon]} icon={icon} eventHandlers={{ click: () => onSelectWaypoint?.(index) }}>
              <Popup>{node.ident} · {node.name}<br />Lat {node.lat.toFixed(2)} Lon {node.lon.toFixed(2)}</Popup>
            </Marker>
          );
        })}

        {showTraffic ? flights.map((flight) => {
          const stableId = getFlightStableId(flight);
          const isSelected = selectedStableId === stableId;
          return (
            <Marker key={stableId} position={[flight.latitude, flight.longitude]} icon={createFlightIcon(flight.headingDegrees, isSelected)} eventHandlers={{ click: () => onSelectFlight?.(flight) }}>
              <Popup>
                {flight.callsign ?? flight.id}<br />
                {flight.aircraftType ?? 'Unknown'}<br />
                Alt: {flight.altitudeMeters ? Units.metersToFeet(flight.altitudeMeters) : '-'} ft
              </Popup>
            </Marker>
          );
        }) : null}

        <Controls path={path} showTraffic={showTraffic} setShowTraffic={setShowTraffic} />
      </MapContainer>
      <MinimapControl path={path} />
    </Box>
  );
}
