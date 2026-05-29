"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.haversineKm = haversineKm;
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
