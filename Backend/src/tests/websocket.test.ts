import { createServer } from 'node:http';
import WebSocket from 'ws';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { attachRouteSimulationWebSocket } from '../websocket/routeSimulation';
import { attachLiveFlightWebSocket } from '../websocket/liveFlightStream';
import { FlightService } from '../services/flightService';
import {
  createMockFlightTrackingProvider,
  createMockFlightPlanProvider,
  createMockFuelProvider,
  createMockWeatherProvider,
  MockAirportRepository,
} from '../mocks/mockProviders';

describe('route simulation websocket', () => {
  const servers: Array<{ close: (callback?: () => void) => void }> = [];

  afterEach(async () => {
    await Promise.all(servers.map((server) => new Promise<void>((resolve) => server.close(() => resolve()))));
    servers.length = 0;
  });

  it('streams simulation frames for a route', async () => {
    const flightService = new FlightService(
      new MockAirportRepository(),
      createMockFlightPlanProvider(),
      createMockWeatherProvider(),
      createMockFuelProvider(),
      createMockFlightTrackingProvider(),
    );
    const server = createServer(createApp());
    servers.push(server);
    const socketServer = attachRouteSimulationWebSocket(server, flightService);
    servers.push(socketServer);

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Expected server address');

    const frame = await new Promise<Record<string, unknown>>((resolve, reject) => {
      const client = new WebSocket(
        `ws://127.0.0.1:${address.port}/ws/simulation?flightPlanId=generated-VIDP-VOBL&intervalMs=100`,
      );
      client.on('message', (data) => {
        resolve(JSON.parse(String(data)));
        client.close();
      });
      client.on('error', reject);
    });

    expect(frame.type).toBe('simulation-frame');
    expect(frame.flightPlanId).toBe('generated-VIDP-VOBL');
    expect(frame.position).toEqual(expect.objectContaining({ lat: expect.any(Number), lon: expect.any(Number) }));
  });

  it('streams live flight frames for selected aircraft', async () => {
    const flightService = new FlightService(
      new MockAirportRepository(),
      createMockFlightPlanProvider(),
      createMockWeatherProvider(),
      createMockFuelProvider(),
      createMockFlightTrackingProvider(),
    );
    const server = createServer(createApp());
    servers.push(server);
    const socketServer = attachLiveFlightWebSocket(server, flightService);
    servers.push(socketServer);

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Expected server address');

    const frame = await new Promise<Record<string, unknown>>((resolve, reject) => {
      const client = new WebSocket(
        `ws://127.0.0.1:${address.port}/ws/flights/mock/mock-VIDP-0/live?routeId=generated-VIDP-VOBL&intervalMs=5000`,
      );
      client.on('message', (data) => {
        resolve(JSON.parse(String(data)));
        client.close();
      });
      client.on('error', reject);
    });

    expect(frame.type).toBe('live-flight');
    expect(frame.flight).toEqual(expect.objectContaining({ provider: 'mock', latitude: expect.any(Number) }));
  });
});
