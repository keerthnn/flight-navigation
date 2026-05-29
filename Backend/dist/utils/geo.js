"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.haversineKm = haversineKm;
exports.routeContextForPoint = routeContextForPoint;
exports.interpolateRoute = interpolateRoute;
const EARTH_RADIUS_KM = 6371;
function haversineKm(a, b) {
    const dLat = toRad(b.latitude - a.latitude);
    const dLon = toRad(b.longitude - a.longitude);
    const lat1 = toRad(a.latitude);
    const lat2 = toRad(b.latitude);
    const h = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}
function routeContextForPoint(nodes, point) {
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
function routeDistance(nodes) {
    return nodes.slice(0, -1).reduce((total, node, index) => total + haversineKm(nodeToPoint(node), nodeToPoint(nodes[index + 1])), 0);
}
function projectPointToSegment(start, end, point) {
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
function nodeToPoint(node) {
    return { latitude: node.lat, longitude: node.lon };
}
function interpolateRoute(from, to, waypointCount = 4) {
    const nodes = [from];
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
function toRad(value) {
    return (value * Math.PI) / 180;
}
