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
    expect(response.body.realtime.path).toContain('/ws/simulation');
  });

  it('returns monitoring metrics', async () => {
    const response = await request(app).get('/api/monitoring/metrics').expect(200);

    expect(response.body.requests.total).toBeGreaterThanOrEqual(1);
    expect(response.body.cache).toEqual(expect.objectContaining({ hits: expect.any(Number), misses: expect.any(Number) }));
  });
});
