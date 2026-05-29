import { RouteNode } from '../types/domain';

const EARTH_RADIUS_KM = 6371;

export function haversineKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function interpolateRoute(from: RouteNode, to: RouteNode, waypointCount = 4): RouteNode[] {
  const nodes: RouteNode[] = [from];
  for (let index = 1; index <= waypointCount; index += 1) {
    const factor = index / (waypointCount + 1);
    nodes.push({
      ident: `WPT${index}`,
      name: `Navigation waypoint ${index}`,
      lat: from.lat + (to.lat - from.lat) * factor,
      lon: from.lon + (to.lon - from.lon) * factor,
      type: 'waypoint',
    });
  }
  nodes.push(to);
  return nodes;
}

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}
