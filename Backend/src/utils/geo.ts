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

export function routeContextForPoint(
  nodes: RouteNode[],
  point: { latitude: number; longitude: number },
): { distanceFromRouteKm: number; progressPercent: number; remainingDistanceKm: number } {
  if (nodes.length < 2) {
    return { distanceFromRouteKm: 0, progressPercent: 0, remainingDistanceKm: 0 };
  }

  const routeDistanceKm = routeDistance(nodes);
  let traveledBeforeSegment = 0;
  let best = {
    distanceFromRouteKm: Number.POSITIVE_INFINITY,
    progressKm: 0,
  };

  for (let index = 0; index < nodes.length - 1; index += 1) {
    const start = nodes[index];
    const end = nodes[index + 1];
    const segmentDistanceKm = haversineKm(nodeToPoint(start), nodeToPoint(end));
    const projection = projectPointToSegment(start, end, point);
    const distanceFromRouteKm = haversineKm(projection, point);
    if (distanceFromRouteKm < best.distanceFromRouteKm) {
      best = {
        distanceFromRouteKm,
        progressKm: traveledBeforeSegment + segmentDistanceKm * projection.factor,
      };
    }
    traveledBeforeSegment += segmentDistanceKm;
  }

  return {
    distanceFromRouteKm: Number(best.distanceFromRouteKm.toFixed(2)),
    progressPercent: Number(Math.min(100, Math.max(0, (best.progressKm / routeDistanceKm) * 100)).toFixed(1)),
    remainingDistanceKm: Number(Math.max(0, routeDistanceKm - best.progressKm).toFixed(2)),
  };
}

function routeDistance(nodes: RouteNode[]): number {
  return nodes.slice(0, -1).reduce((total, node, index) => total + haversineKm(nodeToPoint(node), nodeToPoint(nodes[index + 1])), 0);
}

function projectPointToSegment(
  start: RouteNode,
  end: RouteNode,
  point: { latitude: number; longitude: number },
): { latitude: number; longitude: number; factor: number } {
  const ax = start.lon;
  const ay = start.lat;
  const bx = end.lon;
  const by = end.lat;
  const px = point.longitude;
  const py = point.latitude;
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy || 1;
  const factor = Math.min(1, Math.max(0, ((px - ax) * dx + (py - ay) * dy) / lengthSquared));

  return {
    latitude: ay + dy * factor,
    longitude: ax + dx * factor,
    factor,
  };
}

function nodeToPoint(node: RouteNode): { latitude: number; longitude: number } {
  return { latitude: node.lat, longitude: node.lon };
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
