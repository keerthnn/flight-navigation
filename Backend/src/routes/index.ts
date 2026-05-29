import { Router } from 'express';
import { healthController, providersController } from '../controllers/healthController';
import { FlightController } from '../controllers/flightController';
import { createMonitoringRoutes } from '../monitoring/monitoringRoutes';
import { createFlightRoutes } from './flightRoutes';

export function createApiRoutes(flightController: FlightController): Router {
  const router = Router();

  router.get('/health', healthController);
  router.get('/providers', providersController);
  router.use('/monitoring', createMonitoringRoutes());
  router.use('/', createFlightRoutes(flightController));

  return router;
}
