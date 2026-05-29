import { IncomingMessage, Server as HttpServer } from 'node:http';
import { URL } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';
import { metrics } from '../monitoring/metrics';
import { routeSimulationQuerySchema } from '../schemas/routeSimulationSchema';
import { FlightService } from '../services/flightService';
import { RouteNode } from '../types/domain';
import { logger } from '../config/logger';

export interface SimulationFrame {
  type: 'simulation-frame';
  flightPlanId: string;
  aircraft: string;
  position: {
    lat: number;
    lon: number;
  };
  heading: number;
  progress: number;
  riskWeight: number;
  status: 'taxi' | 'enroute' | 'arrived';
  timestamp: string;
}

export function attachRouteSimulationWebSocket(server: HttpServer, flightService: FlightService): WebSocketServer {
  const socketServer = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
    if (url.pathname !== '/ws/simulation') return;

    socketServer.handleUpgrade(request, socket, head, (client) => {
      socketServer.emit('connection', client, request);
    });
  });

  socketServer.on('connection', (client, request) => {
    metrics.recordWebSocketConnect();
    void startSimulation(client, request, flightService);
  });

  return socketServer;
}

async function startSimulation(client: WebSocket, request: IncomingMessage, flightService: FlightService): Promise<void> {
  let timer: NodeJS.Timeout | undefined;

  try {
    const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
    const parsed = routeSimulationQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));
    const intelligence = await flightService.getRouteIntelligence(parsed.flightPlanId, parsed.aircraft);
    const path = intelligence.flight.route.nodes;
    const totalFrames = Math.max((path.length - 1) * 24, 1);
    let frameIndex = 0;

    const sendFrame = () => {
      if (client.readyState !== WebSocket.OPEN) return;

      const progress = Math.min(frameIndex / totalFrames, 1);
      const frame = buildFrame(path, {
        flightPlanId: parsed.flightPlanId,
        aircraft: parsed.aircraft,
        progress,
        riskWeight: intelligence.routeWeight,
      });

      client.send(JSON.stringify(frame));
      metrics.recordWebSocketMessage();
      frameIndex += 1;

      if (progress >= 1) {
        client.close(1000, 'simulation-complete');
      }
    };

    sendFrame();
    timer = setInterval(sendFrame, parsed.intervalMs);
  } catch (error) {
    logger.warn({ err: error }, 'Route simulation socket failed to start');
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'simulation-error', message: 'Unable to start route simulation' }));
      client.close(1011, 'simulation-error');
    }
  }

  client.on('close', () => {
    if (timer) clearInterval(timer);
    metrics.recordWebSocketDisconnect();
  });
}

function buildFrame(
  path: RouteNode[],
  input: { flightPlanId: string; aircraft: string; progress: number; riskWeight: number },
): SimulationFrame {
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

function calculateHeading(start: RouteNode, end: RouteNode): number {
  const dLon = toRadians(end.lon - start.lon);
  const lat1 = toRadians(start.lat);
  const lat2 = toRadians(end.lat);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return Number(((toDegrees(Math.atan2(y, x)) + 360) % 360).toFixed(1));
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function toDegrees(value: number): number {
  return (value * 180) / Math.PI;
}
