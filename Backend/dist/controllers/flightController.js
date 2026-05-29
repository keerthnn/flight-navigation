"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlightController = void 0;
class FlightController {
    service;
    constructor(service) {
        this.service = service;
    }
    searchAirports = async (req, res) => {
        const q = String(req.query.q);
        const limit = Number(req.query.limit ?? 8);
        res.json(await this.service.searchAirports(q, limit));
    };
    searchFlightPlans = async (req, res) => {
        const fromICAO = String(req.query.fromICAO).toUpperCase();
        const toICAO = String(req.query.toICAO).toUpperCase();
        const limit = Number(req.query.limit ?? 10);
        res.json(await this.service.searchFlightPlans(fromICAO, toICAO, limit));
    };
    createRoute = async (req, res) => {
        const fromICAO = String(req.body.fromICAO).toUpperCase();
        const toICAO = String(req.body.toICAO).toUpperCase();
        res.status(201).json(await this.service.createRoute(fromICAO, toICAO));
    };
    getFlightPlan = async (req, res) => {
        res.json(await this.service.getFlightPlan(req.params.id));
    };
    getRouteIntelligence = async (req, res) => {
        const aircraft = String(req.query.aircraft ?? 'A320');
        res.json(await this.service.getRouteIntelligence(req.params.id, aircraft));
    };
    getActiveFlights = async (req, res) => {
        const radiusKm = Number(req.query.radiusKm ?? 150);
        const limit = Number(req.query.limit ?? 25);
        res.json(await this.service.getActiveFlightsNearRoute(req.params.id, radiusKm, limit));
    };
    getLiveFlight = async (req, res) => {
        const provider = req.params.provider;
        const routeId = req.query.routeId ? String(req.query.routeId) : undefined;
        res.json(await this.service.getLiveFlight(provider, req.params.flightId, routeId));
    };
    getFlightTrack = async (req, res) => {
        const provider = req.params.provider;
        res.json(await this.service.getFlightTrack(provider, req.params.flightId));
    };
    getFuelEstimate = async (req, res) => {
        const aircraft = String(req.query.aircraft ?? 'A320');
        const distance = Number(req.query.distance);
        res.json(await this.service.getFuelEstimate(aircraft, distance));
    };
}
exports.FlightController = FlightController;
