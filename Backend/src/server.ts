import { createServer } from 'node:http';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { createServiceContainer } from './services/serviceContainer';
import { attachLiveFlightWebSocket } from './websocket/liveFlightStream';
import { attachRouteSimulationWebSocket } from './websocket/routeSimulation';

const container = createServiceContainer();
const app = createApp(container);
const server = createServer(app);

attachRouteSimulationWebSocket(server, container.flightService);
attachLiveFlightWebSocket(server, container.flightService);

server.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'Flight navigation API is running');
});
