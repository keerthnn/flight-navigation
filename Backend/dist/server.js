"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_http_1 = require("node:http");
const app_1 = require("./app");
const env_1 = require("./config/env");
const logger_1 = require("./config/logger");
const serviceContainer_1 = require("./services/serviceContainer");
const liveFlightStream_1 = require("./websocket/liveFlightStream");
const routeSimulation_1 = require("./websocket/routeSimulation");
const container = (0, serviceContainer_1.createServiceContainer)();
const app = (0, app_1.createApp)(container);
const server = (0, node_http_1.createServer)(app);
(0, routeSimulation_1.attachRouteSimulationWebSocket)(server, container.flightService);
(0, liveFlightStream_1.attachLiveFlightWebSocket)(server, container.flightService);
server.listen(env_1.env.PORT, () => {
    logger_1.logger.info({ port: env_1.env.PORT }, 'Flight navigation API is running');
});
