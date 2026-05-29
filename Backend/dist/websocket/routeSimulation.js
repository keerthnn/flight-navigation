"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachRouteSimulationWebSocket = attachRouteSimulationWebSocket;
const node_url_1 = require("node:url");
const ws_1 = require("ws");
const metrics_1 = require("../monitoring/metrics");
const routeSimulationSchema_1 = require("../schemas/routeSimulationSchema");
const logger_1 = require("../config/logger");
function attachRouteSimulationWebSocket(server, flightService) {
    const socketServer = new ws_1.WebSocketServer({ noServer: true });
    server.on('upgrade', (request, socket, head) => {
        const url = new node_url_1.URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
        if (url.pathname !== '/ws/simulation')
            return;
        socketServer.handleUpgrade(request, socket, head, (client) => {
            socketServer.emit('connection', client, request);
        });
    });
    socketServer.on('connection', (client, request) => {
        metrics_1.metrics.recordWebSocketConnect();
        void startSimulation(client, request, flightService);
    });
    return socketServer;
}
async function startSimulation(client, request, flightService) {
    let timer;
    try {
        const url = new node_url_1.URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
        const parsed = routeSimulationSchema_1.routeSimulationQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));
        const intelligence = await flightService.getRouteIntelligence(parsed.flightPlanId, parsed.aircraft);
        const path = intelligence.flight.route.nodes;
        const totalFrames = Math.max((path.length - 1) * 24, 1);
        let frameIndex = 0;
        const sendFrame = () => {
            if (client.readyState !== ws_1.WebSocket.OPEN)
                return;
            const progress = Math.min(frameIndex / totalFrames, 1);
            const frame = buildFrame(path, {
                flightPlanId: parsed.flightPlanId,
                aircraft: parsed.aircraft,
                progress,
                riskWeight: intelligence.routeWeight,
            });
            client.send(JSON.stringify(frame));
            metrics_1.metrics.recordWebSocketMessage();
            frameIndex += 1;
            if (progress >= 1) {
                client.close(1000, 'simulation-complete');
            }
        };
        sendFrame();
        timer = setInterval(sendFrame, parsed.intervalMs);
    }
    catch (error) {
        logger_1.logger.warn({ err: error }, 'Route simulation socket failed to start');
        if (client.readyState === ws_1.WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'simulation-error', message: 'Unable to start route simulation' }));
            client.close(1011, 'simulation-error');
        }
    }
    client.on('close', () => {
        if (timer)
            clearInterval(timer);
        metrics_1.metrics.recordWebSocketDisconnect();
    });
}
function buildFrame(path, input) {
    const segmentCount = Math.max(path.length - 1, 1);
    const exactSegment = input.progress * segmentCount;
    const segmentIndex = Math.min(Math.floor(exactSegment), segmentCount - 1);
    const factor = exactSegment - segmentIndex;
    const start = path[segmentIndex];
    const end = path[segmentIndex + 1] ?? start;
    const lat = start.lat + (end.lat - start.lat) * factor;
    const lon = start.lon + (end.lon - start.lon) * factor;
    return {
        type: 'simulation-frame',
        flightPlanId: input.flightPlanId,
        aircraft: input.aircraft,
        position: { lat, lon },
        heading: calculateHeading(start, end),
        progress: Number(input.progress.toFixed(3)),
        riskWeight: input.riskWeight,
        status: input.progress >= 1 ? 'arrived' : input.progress < 0.04 ? 'taxi' : 'enroute',
        timestamp: new Date().toISOString(),
    };
}
function calculateHeading(start, end) {
    const dLon = toRadians(end.lon - start.lon);
    const lat1 = toRadians(start.lat);
    const lat2 = toRadians(end.lat);
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    return Number(((toDegrees(Math.atan2(y, x)) + 360) % 360).toFixed(1));
}
function toRadians(value) {
    return (value * Math.PI) / 180;
}
function toDegrees(value) {
    return (value * 180) / Math.PI;
}
