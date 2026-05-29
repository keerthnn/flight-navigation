import { useEffect, useMemo, useRef, useState } from 'react';
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { config } from '../../config/env';
import airplane from '../../assets/airplane1.png';
import airport from '../../assets/airport.png';
import { RouteNode } from '../../types/domain';

interface RouteMapProps {
  nodes: RouteNode[];
  livePosition?: [number, number];
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

export function RouteMap({ nodes, livePosition }: RouteMapProps) {
  const path = useMemo(() => nodes.map((node) => [node.lat, node.lon] as [number, number]), [nodes]);
  const [position, setPosition] = useState(path[0]);
  const frameRef = useRef<number>();

  useEffect(() => {
    if (livePosition) {
      setPosition(livePosition);
      return;
    }

    let step = 0;
    const stepsPerSegment = 160;

    function animate() {
      const segment = Math.floor(step / stepsPerSegment);
      if (segment >= path.length - 1) {
        setPosition(path[path.length - 1]);
        return;
      }

      const start = path[segment];
      const end = path[segment + 1];
      const factor = (step % stepsPerSegment) / stepsPerSegment;
      setPosition([start[0] + (end[0] - start[0]) * factor, start[1] + (end[1] - start[1]) * factor]);
      step += 1;
      frameRef.current = window.requestAnimationFrame(animate);
    }

    frameRef.current = window.requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    };
  }, [livePosition, path]);

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
      <Marker position={livePosition ?? position} icon={aircraftIcon}>
        <Popup>Simulated aircraft position</Popup>
      </Marker>
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
