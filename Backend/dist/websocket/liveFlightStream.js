"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachLiveFlightWebSocket = attachLiveFlightWebSocket;
const node_url_1 = require("node:url");
const ws_1 = require("ws");
const logger_1 = require("../config/logger");
const metrics_1 = require("../monitoring/metrics");
const liveFlightStreamSchema_1 = require("../schemas/liveFlightStreamSchema");
function attachLiveFlightWebSocket(server, flightService) {
    const socketServer = new ws_1.WebSocketServer({ noServer: true });
    server.on('upgrade', (request, socket, head) => {
        const url = new node_url_1.URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
        const match = url.pathname.match(/^\/ws\/flights\/([^/]+)\/([^/]+)\/live$/);
        if (!match)
            return;
        socketServer.handleUpgrade(request, socket, head, (client) => {
            socketServer.emit('connection', client, request);
        });
    });
    socketServer.on('connection', (client, request) => {
        metrics_1.metrics.recordWebSocketConnect();
        void streamLiveFlight(client, request, flightService);
    });
    return socketServer;
}
async function streamLiveFlight(client, request, flightService) {
    const url = new node_url_1.URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
    const match = url.pathname.match(/^\/ws\/flights\/([^/]+)\/([^/]+)\/live$/);
    let timer;
    try {
        const params = liveFlightStreamSchema_1.liveFlightStreamParamsSchema.parse({ provider: match?.[1], flightId: match?.[2] });
        const query = liveFlightStreamSchema_1.liveFlightStreamQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));
        const send = async () => {
            if (client.readyState !== ws_1.WebSocket.OPEN)
                return;
            const payload = await flightService.getLiveFlight(params.provider, params.flightId, query.routeId);
            client.send(JSON.stringify({ type: 'live-flight', ...payload }));
            metrics_1.metrics.recordWebSocketMessage();
        };
        await send();
        timer = setInterval(() => void send().catch((error) => logger_1.logger.warn({ err: error }, 'Live flight stream update failed')), query.intervalMs);
    }
    catch (error) {
        logger_1.logger.warn({ err: error }, 'Live flight stream failed to start');
        if (client.readyState === ws_1.WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'live-flight-error', message: 'Unable to start live flight stream' }));
            client.close(1011, 'live-flight-error');
        }
    }
    client.on('close', () => {
        if (timer)
            clearInterval(timer);
        metrics_1.metrics.recordWebSocketDisconnect();
    });
}
