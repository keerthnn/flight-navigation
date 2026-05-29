import { Router } from 'express';
import { metricsController } from './monitoringController';

export function createMonitoringRoutes(): Router {
  const router = Router();

  router.get('/metrics', metricsController);

  return router;
}
