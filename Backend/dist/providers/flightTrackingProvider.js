"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmptyFlightTrackingFallbackProvider = exports.CompositeFlightTrackingProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
const metrics_1 = require("../monitoring/metrics");
const httpError_1 = require("../utils/httpError");
const retry_1 = require("../utils/retry");
class CompositeFlightTrackingProvider {
    openSkyClient;
    adsbLolClient;
    emptyFallbackProvider = new EmptyFlightTrackingFallbackProvider();
    constructor() {
        this.openSkyClient = axios_1.default.create({ baseURL: env_1.env.OPENSKY_BASE_URL, timeout: 6000 });
        this.adsbLolClient = axios_1.default.create({ baseURL: env_1.env.ADSB_LOL_BASE_URL, timeout: 6000 });
    }
    async getFlightsNearRoute(nodes, radiusKm, limit) {
        if (env_1.env.FLIGHT_TRACKING_MODE === 'mock') {
            return this.emptyFallbackProvider.getFlightsNearRoute(nodes, radiusKm, limit);
        }
        const openSkyFlights = await this.tryOpenSkyNearRoute(nodes, radiusKm, limit);
        if (openSkyFlights)
            return openSkyFlights;
        const adsbFlights = await this.tryAdsbLolNearRoute(nodes, radiusKm, limit);
        if (adsbFlights)
            return adsbFlights;
        return this.emptyFallbackProvider.getFlightsNearRoute(nodes, radiusKm, limit);
    }
    async getFlight(provider, flightId, routeContext) {
        if (provider === 'mock' || env_1.env.FLIGHT_TRACKING_MODE === 'mock') {
            return this.emptyFallbackProvider.getFlight('mock', flightId, routeContext);
        }
        const flight = provider === 'opensky'
            ? await this.getOpenSkyFlight(flightId)
            : await this.getAdsbLolFlight(flightId);
        if (!flight) {
            throw new httpError_1.HttpError(404, `Live flight ${flightId} was not found from ${provider}.`);
        }
        return {
            flight,
            routeContext,
            generatedAt: new Date().toISOString(),
        };
    }
    async getTrack(provider, flightId) {
        if (provider === 'mock' || env_1.env.FLIGHT_TRACKING_MODE === 'mock') {
            return this.emptyFallbackProvider.getTrack('mock', flightId);
        }
        if (provider === 'adsblol') {
            try {
                const response = await (0, retry_1.retry)(() => this.adsbLolClient.get(`/v2/trace/${flightId}`));
                const points = Array.isArray(response.data?.trace)
                    ? response.data.trace
                        .map((item) => ({
                        latitude: Number(item[1]),
                        longitude: Number(item[2]),
                        altitudeMeters: typeof item[3] === 'number' ? item[3] * 0.3048 : undefined,
                        timestamp: new Date(Date.now() - Number(item[0] ?? 0) * 1000).toISOString(),
                    }))
                        .filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude))
                    : [];
                return {
                    provider,
                    flightId,
                    points,
                    available: points.length > 0,
                    message: points.length ? undefined : 'Historical track unavailable from provider.',
                };
            }
            catch {
                return unavailableTrack(provider, flightId);
            }
        }
        return unavailableTrack(provider, flightId);
    }
    async tryOpenSkyNearRoute(nodes, radiusKm, limit) {
        try {
            const bounds = routeBounds(nodes, radiusKm);
            const response = await (0, retry_1.retry)(() => this.openSkyClient.get('/states/all', {
                params: {
                    lamin: bounds.minLat,
                    lamax: bounds.maxLat,
                    lomin: bounds.minLon,
                    lomax: bounds.maxLon,
                },
            }));
            const states = Array.isArray(response.data?.states) ? response.data.states : [];
            const flights = states
                .map(mapOpenSkyState)
                .filter((flight) => Boolean(flight))
                .slice(0, limit);
            if (!flights.length)
                return undefined;
            metrics_1.metrics.recordProviderEvent('openSkySuccess');
            return { flights, source: 'opensky', generatedAt: new Date().toISOString(), demo: false };
        }
        catch {
            return undefined;
        }
    }
    async tryAdsbLolNearRoute(nodes, radiusKm, limit) {
        try {
            const midpoint = nodes[Math.floor(nodes.length / 2)] ?? nodes[0];
            const radiusNm = Math.min(Math.max(Math.round(radiusKm * 0.539957), 25), 250);
            const response = await (0, retry_1.retry)(() => this.adsbLolClient.get(`/v2/point/${midpoint.lat}/${midpoint.lon}/${radiusNm}`));
            const aircraft = Array.isArray(response.data?.ac) ? response.data.ac : [];
            const flights = aircraft
                .map(mapAdsbLolAircraft)
                .filter((flight) => Boolean(flight))
                .slice(0, limit);
            if (!flights.length)
                return undefined;
            metrics_1.metrics.recordProviderEvent('adsbLolSuccess');
            return { flights, source: 'adsblol', generatedAt: new Date().toISOString(), demo: false };
        }
        catch {
            return undefined;
        }
    }
    async getOpenSkyFlight(flightId) {
        try {
            const response = await (0, retry_1.retry)(() => this.openSkyClient.get('/states/all', { params: { icao24: flightId } }));
            const state = Array.isArray(response.data?.states) ? response.data.states[0] : undefined;
            return Array.isArray(state) ? mapOpenSkyState(state) : undefined;
        }
        catch {
            return undefined;
        }
    }
    async getAdsbLolFlight(flightId) {
        try {
            const response = await (0, retry_1.retry)(() => this.adsbLolClient.get(`/v2/hex/${flightId}`));
            const aircraft = Array.isArray(response.data?.ac) ? response.data.ac[0] : undefined;
            return aircraft ? mapAdsbLolAircraft(aircraft) : undefined;
        }
        catch {
            return undefined;
        }
    }
}
exports.CompositeFlightTrackingProvider = CompositeFlightTrackingProvider;
class EmptyFlightTrackingFallbackProvider {
    async getFlightsNearRoute(_nodes, _radiusKm, _limit) {
        metrics_1.metrics.recordProviderEvent('flightTrackingMockFallback');
        return { flights: [], source: 'mock', generatedAt: new Date().toISOString(), demo: true };
    }
    async getFlight(_provider, flightId, routeContext) {
        metrics_1.metrics.recordProviderEvent('flightTrackingMockFallback');
        throw new httpError_1.HttpError(404, `No demo flight data is configured for ${flightId}.`, { routeContext });
    }
    async getTrack(provider, flightId) {
        return unavailableTrack(provider, flightId);
    }
}
exports.EmptyFlightTrackingFallbackProvider = EmptyFlightTrackingFallbackProvider;
function routeBounds(nodes, radiusKm) {
    const latitudes = nodes.map((node) => node.lat);
    const longitudes = nodes.map((node) => node.lon);
    const padding = Math.min(Math.max(radiusKm / 111, 0.5), 5);
    return {
        minLat: Math.min(...latitudes) - padding,
        maxLat: Math.max(...latitudes) + padding,
        minLon: Math.min(...longitudes) - padding,
        maxLon: Math.max(...longitudes) + padding,
    };
}
function mapOpenSkyState(state) {
    const [icao24, callsign, originCountry, _timePosition, lastContact, longitude, latitude, baroAltitude, onGround, velocityMps, heading, verticalRate, _sensors, geoAltitude, squawk,] = state;
    if (typeof latitude !== 'number' || typeof longitude !== 'number' || typeof icao24 !== 'string')
        return undefined;
    return {
        id: icao24,
        provider: 'opensky',
        callsign: typeof callsign === 'string' ? callsign.trim() || undefined : undefined,
        icao24,
        originCountry: typeof originCountry === 'string' ? originCountry : undefined,
        latitude,
        longitude,
        altitudeMeters: typeof baroAltitude === 'number' ? baroAltitude : undefined,
        geoAltitudeMeters: typeof geoAltitude === 'number' ? geoAltitude : undefined,
        speedKnots: typeof velocityMps === 'number' ? velocityMps * 1.94384 : undefined,
        headingDegrees: typeof heading === 'number' ? heading : undefined,
        verticalRate: typeof verticalRate === 'number' ? verticalRate : undefined,
        squawk: typeof squawk === 'string' ? squawk : undefined,
        onGround: Boolean(onGround),
        lastSeen: typeof lastContact === 'number' ? new Date(lastContact * 1000).toISOString() : new Date().toISOString(),
        sourceUpdatedAt: new Date().toISOString(),
        demo: false,
    };
}
function mapAdsbLolAircraft(aircraft) {
    const latitude = Number(aircraft.lat);
    const longitude = Number(aircraft.lon);
    const id = String(aircraft.hex ?? '');
    if (!id || !Number.isFinite(latitude) || !Number.isFinite(longitude))
        return undefined;
    return {
        id,
        provider: 'adsblol',
        callsign: typeof aircraft.flight === 'string' ? aircraft.flight.trim() || undefined : undefined,
        icao24: id,
        registration: typeof aircraft.r === 'string' ? aircraft.r : undefined,
        aircraftType: typeof aircraft.t === 'string' ? aircraft.t : undefined,
        operator: typeof aircraft.op === 'string' ? aircraft.op : undefined,
        originCountry: typeof aircraft.country === 'string' ? aircraft.country : undefined,
        latitude,
        longitude,
        altitudeMeters: typeof aircraft.alt_baro === 'number' ? aircraft.alt_baro * 0.3048 : undefined,
        geoAltitudeMeters: typeof aircraft.alt_geom === 'number' ? aircraft.alt_geom * 0.3048 : undefined,
        speedKnots: typeof aircraft.gs === 'number' ? aircraft.gs : undefined,
        headingDegrees: typeof aircraft.track === 'number' ? aircraft.track : undefined,
        verticalRate: typeof aircraft.baro_rate === 'number' ? aircraft.baro_rate * 0.00508 : undefined,
        squawk: typeof aircraft.squawk === 'string' ? aircraft.squawk : undefined,
        onGround: aircraft.alt_baro === 'ground',
        lastSeen: new Date(Date.now() - Number(aircraft.seen ?? 0) * 1000).toISOString(),
        sourceUpdatedAt: new Date().toISOString(),
        demo: false,
    };
}
function unavailableTrack(provider, flightId) {
    return {
        provider,
        flightId,
        points: [],
        available: false,
        message: 'Historical track unavailable from this provider.',
    };
}
