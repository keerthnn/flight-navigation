import { NextFunction, Request, Response } from 'express';
import { metrics } from '../monitoring/metrics';

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  res.on('finish', () => metrics.recordRequest(req.method, res.statusCode));
  next();
}
