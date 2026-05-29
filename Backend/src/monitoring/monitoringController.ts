import { Request, Response } from 'express';
import { cache } from '../cache/memoryCache';
import { metrics } from './metrics';

export function metricsController(_req: Request, res: Response): void {
  res.json(metrics.snapshot(cache.size()));
}
