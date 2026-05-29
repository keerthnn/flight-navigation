import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useRouteSimulation } from './useRouteSimulation';

class MockWebSocket extends EventTarget {
  static OPEN = 1;
  readyState = MockWebSocket.OPEN;

  constructor() {
    super();
    window.setTimeout(() => {
      this.dispatchEvent(
        new MessageEvent('message', {
          data: JSON.stringify({
            type: 'simulation-frame',
            flightPlanId: 'generated-VIDP-VOBL',
            aircraft: 'A320',
            position: { lat: 28.5, lon: 77.1 },
            heading: 180,
            progress: 0.25,
            riskWeight: 3,
            status: 'enroute',
            timestamp: new Date().toISOString(),
          }),
        }),
      );
    }, 0);
  }

  close() {
    this.readyState = 3;
    this.dispatchEvent(new Event('close'));
  }
}

describe('useRouteSimulation', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('moves to live when a socket frame arrives', async () => {
    vi.stubGlobal('WebSocket', MockWebSocket);

    const { result } = renderHook(() => useRouteSimulation('generated-VIDP-VOBL'));

    await waitFor(() => expect(result.current.status).toBe('live'));
    expect(result.current.frame?.progress).toBe(0.25);
  });
});
