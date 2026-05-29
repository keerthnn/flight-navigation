import { logger } from '../config/logger';

export function scheduleAirportRefreshJob(): void {
  logger.info('Airport refresh job registered; production deployments should wire this to an external scheduler.');
}
