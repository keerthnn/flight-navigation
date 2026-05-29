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
    getFlightPlan = async (req, res) => {
        res.json(await this.service.getFlightPlan(req.params.id));
    };
    getRouteIntelligence = async (req, res) => {
        const aircraft = String(req.query.aircraft ?? 'A320');
        res.json(await this.service.getRouteIntelligence(req.params.id, aircraft));
    };
    getFuelEstimate = async (req, res) => {
        const aircraft = String(req.query.aircraft ?? 'A320');
        const distance = Number(req.query.distance);
        res.json(await this.service.getFuelEstimate(aircraft, distance));
    };
}
exports.FlightController = FlightController;
