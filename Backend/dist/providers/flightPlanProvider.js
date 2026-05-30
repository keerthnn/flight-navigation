"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeneratedFlightPlanProvider = exports.FlightPlanDatabaseProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
const geo_1 = require("../utils/geo");
const retry_1 = require("../utils/retry");
const metrics_1 = require("../monitoring/metrics");
class FlightPlanDatabaseProvider {
    fallback;
    client;
    constructor(fallback) {
        this.fallback = fallback;
        const auth = env_1.env.FLIGHT_PLAN_DB_API_KEY
            ? {
                Authorization: `Basic ${Buffer.from(`${env_1.env.FLIGHT_PLAN_DB_API_KEY}:`).toString('base64')}`,
            }
            : undefined;
        this.client = axios_1.default.create({
            baseURL: env_1.env.FLIGHT_PLAN_DB_BASE_URL,
            timeout: 6000,
            headers: auth,
        });
    }
    async search(fromICAO, toICAO, limit) {
        if (!env_1.env.FLIGHT_PLAN_DB_API_KEY)
            return this.fallback.search(fromICAO, toICAO, limit);
        try {
            const response = await (0, retry_1.retry)(() => this.client.get('/search/plans', { params: { fromICAO, toICAO } }));
            metrics_1.metrics.recordProviderEvent('flightPlanDbSuccess');
            const plans = Array.isArray(response.data) ? response.data : [];
            return plans.slice(0, limit).map((plan) => ({
                id: String(plan.id),
                fromICAO: String(plan.fromICAO ?? fromICAO),
                toICAO: String(plan.toICAO ?? toICAO),
                fromName: String(plan.fromName ?? fromICAO),
                toName: String(plan.toName ?? toICAO),
                distance: Number(plan.distance ?? 0),
                waypoints: String(plan.waypoints ?? ''),
                source: 'flightplandb',
            }));
        }
        catch {
            return this.fallback.search(fromICAO, toICAO, limit);
        }
    }
    async getById(id) {
        if (!env_1.env.FLIGHT_PLAN_DB_API_KEY || id.startsWith('generated-'))
            return this.fallback.getById(id);
        try {
            const response = await (0, retry_1.retry)(() => this.client.get(`/plan/${id}`));
            metrics_1.metrics.recordProviderEvent('flightPlanDbSuccess');
            return { ...response.data, id: String(response.data.id), source: 'flightplandb' };
        }
        catch {
            return this.fallback.getById(id);
        }
    }
}
exports.FlightPlanDatabaseProvider = FlightPlanDatabaseProvider;
class GeneratedFlightPlanProvider {
    airports;
    constructor(airports) {
        this.airports = airports;
    }
    async search(fromICAO, toICAO, limit) {
        metrics_1.metrics.recordProviderEvent('generatedFallback');
        const detail = await this.buildGeneratedDetail(fromICAO, toICAO);
        return [
            detail,
            {
                ...detail,
                id: `${detail.id}-eco`,
                distance: Number((detail.distance * 1.04).toFixed(2)),
                waypoints: `${detail.waypoints}, ECO`,
            },
            {
                ...detail,
                id: `${detail.id}-weather`,
                distance: Number((detail.distance * 1.08).toFixed(2)),
                waypoints: `${detail.waypoints}, WX`,
            },
        ].slice(0, limit);
    }
    async getById(id) {
        metrics_1.metrics.recordProviderEvent('generatedFallback');
        const [, fromICAO, toICAO] = id.match(/^generated-([A-Z0-9]{3,4})-([A-Z0-9]{3,4})/) ?? [];
        return this.buildGeneratedDetail(fromICAO ?? 'VIDP', toICAO ?? 'VOBL', id);
    }
    async buildGeneratedDetail(fromICAO, toICAO, id = `${fromICAO}-${toICAO}`) {
        const from = await this.airports.findByIcao(fromICAO);
        const to = await this.airports.findByIcao(toICAO);
        if (!from || !to) {
            throw new Error(`Unable to generate route for ${fromICAO} to ${toICAO}`);
        }
        const departure = {
            ident: from.icao,
            name: from.name,
            lat: from.latitude,
            lon: from.longitude,
            type: 'departure',
        };
        const arrival = {
            ident: to.icao,
            name: to.name,
            lat: to.latitude,
            lon: to.longitude,
            type: 'arrival',
        };
        const nodes = (0, geo_1.interpolateRoute)(departure, arrival);
        return {
            id,
            fromICAO,
            toICAO,
            fromName: from.name,
            toName: to.name,
            distance: Number((0, geo_1.haversineKm)(from, to).toFixed(2)),
            waypoints: nodes.map((node) => node.ident).join(', '),
            source: 'generated',
            route: { nodes },
        };
    }
}
exports.GeneratedFlightPlanProvider = GeneratedFlightPlanProvider;
