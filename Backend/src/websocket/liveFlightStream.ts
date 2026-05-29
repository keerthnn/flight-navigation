import { IncomingMessage, Server as HttpServer } from 'node:http';
import { URL } from 'node:url';
import { WebSocket, WebSocketServer } from 'ws';
import { logger } from '../config/logger';
import { metrics } from '../monitoring/metrics';
import { liveFlightStreamParamsSchema, liveFlightStreamQuerySchema } from '../schemas/liveFlightStreamSchema';
import { FlightService } from '../services/flightService';

export function attachLiveFlightWebSocket(server: HttpServer, flightService: FlightService): WebSocketServer {
  const socketServer = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
    const match = url.pathname.match(/^\/ws\/flights\/([^/]+)\/([^/]+)\/live$/);
    if (!match) return;

    socketServer.handleUpgrade(request, socket, head, (client) => {
      socketServer.emit('connection', client, request);
    });
  });

  socketServer.on('connection', (client, request) => {
    metrics.recordWebSocketConnect();
    void streamLiveFlight(client, request, flightService);
  });

  return socketServer;
}

async function streamLiveFlight(client: WebSocket, request: IncomingMessage, flightService: FlightService): Promise<void> {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
  const match = url.pathname.match(/^\/ws\/flights\/([^/]+)\/([^/]+)\/live$/);
  let timer: NodeJS.Timeout | undefined;

  try {
    const params = liveFlightStreamParamsSchema.parse({ provider: match?.[1], flightId: match?.[2] });
    const query = liveFlightStreamQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));

    const send = async () => {
      if (client.readyState !== WebSocket.OPEN) return;
      const payload = await flightService.getLiveFlight(params.provider, params.flightId, query.routeId);
      client.send(JSON.stringify({ type: 'live-flight', ...payload }));
      metrics.recordWebSocketMessage();
    };

    await send();
    timer = setInterval(() => void send().catch((error) => logger.warn({ err: error }, 'Live flight stream update failed')), query.intervalMs);
  } catch (error) {
    logger.warn({ err: error }, 'Live flight stream failed to start');
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'live-flight-error', message: 'Unable to start live flight stream' }));
      client.close(1011, 'live-flight-error');
    }
  }

  client.on('close', () => {
    if (timer) clearInterval(timer);
    metrics.recordWebSocketDisconnect();
  });
}
