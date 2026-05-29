import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app';

describe('flight navigation API', () => {
  const app = createApp();

  it('returns health status', async () => {
    const response = await request(app).get('/api/health').expect(200);

    expect(response.body.status).toBe('ok');
  });

  it('searches airports from the seeded dataset', async () => {
    const response = await request(app).get('/api/airports?q=Indira&limit=3').expect(200);

    expect(response.body[0].icao).toBe('VIDP');
  });

  it('returns fallback flight plans without external keys', async () => {
    const response = await request(app).get('/api/flightplans?fromICAO=VIDP&toICAO=VOBL').expect(200);

    expect(response.body[0].id).toContain('generated-VIDP-VOBL');
  });

  it('returns provider status details', async () => {
    const response = await request(app).get('/api/providers').expect(200);

    expect(response.body.flightPlans.mode).toMatch(/flightplandb-live|generated-fallback/);
    expect(response.body.realtime.path).toContain('/ws/flights');
  });

  it('returns monitoring metrics', async () => {
    const response = await request(app).get('/api/monitoring/metrics').expect(200);

    expect(response.body.requests.total).toBeGreaterThanOrEqual(1);
    expect(response.body.cache).toEqual(expect.objectContaining({ hits: expect.any(Number), misses: expect.any(Number) }));
  });

  it('returns active flights near a route', async () => {
    const response = await request(app).get('/api/flightplan/generated-VIDP-VOBL/active-flights?radiusKm=150&limit=5').expect(200);

    expect(response.body.flights.length).toBeGreaterThan(0);
    expect(response.body.flights[0]).toEqual(expect.objectContaining({ latitude: expect.any(Number), longitude: expect.any(Number) }));
  });

  it('creates a route corridor with the route-first API', async () => {
    const response = await request(app).post('/api/routes').send({ fromICAO: 'VIDP', toICAO: 'VOBL' }).expect(201);

    expect(response.body.id).toContain('generated-VIDP-VOBL');
    expect(response.body.route.nodes.length).toBeGreaterThan(2);
  });

  it('returns selected flight detail and unavailable track metadata', async () => {
    const detail = await request(app).get('/api/flights/mock/mock-VIDP-0?routeId=generated-VIDP-VOBL').expect(200);
    const track = await request(app).get('/api/flights/mock/mock-VIDP-0/track').expect(200);

    expect(detail.body.flight.provider).toBe('mock');
    expect(detail.body.routeContext.progressPercent).toEqual(expect.any(Number));
    expect(track.body.available).toBe(true);
  });
});
