import { Request, Response } from 'express';
import { FlightService } from '../services/flightService';

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

  getFlightPlan = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.getFlightPlan(req.params.id));
  };

  getRouteIntelligence = async (req: Request, res: Response): Promise<void> => {
    const aircraft = String(req.query.aircraft ?? 'A320');
    res.json(await this.service.getRouteIntelligence(req.params.id, aircraft));
  };

  getFuelEstimate = async (req: Request, res: Response): Promise<void> => {
    const aircraft = String(req.query.aircraft ?? 'A320');
    const distance = Number(req.query.distance);
    res.json(await this.service.getFuelEstimate(aircraft, distance));
  };
}
