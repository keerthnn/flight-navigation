import { Request, Response } from 'express';
import { env } from '../config/env';

export function healthController(_req: Request, res: Response): void {
  res.json({
    status: 'ok',
    service: 'flight-navigation-backend',
    timestamp: new Date().toISOString(),
  });
}

export function providersController(_req: Request, res: Response): void {
  res.json({
    flightPlans: {
      mode: env.FLIGHT_PLAN_DB_API_KEY ? 'flightplandb-live' : 'generated-fallback',
      configured: Boolean(env.FLIGHT_PLAN_DB_API_KEY),
      fallback: 'generated great-circle route provider',
    },
    aviationWeather: {
      mode: 'aviationweather.gov-primary',
      fallback: 'open-meteo, then deterministic synthetic weather',
      configured: true,
    },
    airports: {
      mode: 'bundled-csv',
      fallback: 'OurAirports-compatible CSV import boundary',
      configured: true,
    },
    fuel: {
      mode: 'local-estimator',
      fallback: 'provider interface ready for verified fuel APIs',
      configured: true,
    },
    realtime: {
      mode: 'websocket-route-simulation',
      path: '/ws/simulation?flightPlanId=<id>&aircraft=A320',
    },
  });
}
