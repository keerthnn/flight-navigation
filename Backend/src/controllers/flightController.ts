import { Request, Response } from 'express';
import { FlightService } from '../services/flightService';
import { LiveFlightProvider } from '../types/domain';

export class FlightController {
  constructor(private readonly service: FlightService) {}

  searchAirports = async (req: Request, res: Response): Promise<void> => {
    const q = String(req.query.q);
    const limit = Number(req.query.limit ?? 8);
    res.json(await this.service.searchAirports(q, limit));
  };

  searchFlightPlans = async (req: Request, res: Response): Promise<void> => {
    const fromICAO = String(req.query.fromICAO).toUpperCase();
    const toICAO = String(req.query.toICAO).toUpperCase();
    const limit = Number(req.query.limit ?? 10);
    res.json(await this.service.searchFlightPlans(fromICAO, toICAO, limit));
  };

  createRoute = async (req: Request, res: Response): Promise<void> => {
    const fromICAO = String(req.body.fromICAO).toUpperCase();
    const toICAO = String(req.body.toICAO).toUpperCase();
    res.status(201).json(await this.service.createRoute(fromICAO, toICAO));
  };

  getFlightPlan = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.getFlightPlan(req.params.id));
  };

  getRouteIntelligence = async (req: Request, res: Response): Promise<void> => {
    const aircraft = String(req.query.aircraft ?? 'A320');
    res.json(await this.service.getRouteIntelligence(req.params.id, aircraft));
  };

  getActiveFlights = async (req: Request, res: Response): Promise<void> => {
    const radiusKm = Number(req.query.radiusKm ?? 150);
    const limit = Number(req.query.limit ?? 25);
    res.json(await this.service.getActiveFlightsNearRoute(req.params.id, radiusKm, limit));
  };

  getLiveFlight = async (req: Request, res: Response): Promise<void> => {
    const provider = req.params.provider as LiveFlightProvider;
    const routeId = req.query.routeId ? String(req.query.routeId) : undefined;
    res.json(await this.service.getLiveFlight(provider, req.params.flightId, routeId));
  };

  getFlightTrack = async (req: Request, res: Response): Promise<void> => {
    const provider = req.params.provider as LiveFlightProvider;
    res.json(await this.service.getFlightTrack(provider, req.params.flightId));
  };

  getFuelEstimate = async (req: Request, res: Response): Promise<void> => {
    const aircraft = String(req.query.aircraft ?? 'A320');
    const distance = Number(req.query.distance);
    res.json(await this.service.getFuelEstimate(aircraft, distance));
  };
}
