import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useLiveFlight } from './useLiveFlight';

class MockWebSocket extends EventTarget {
  static OPEN = 1;
  readyState = MockWebSocket.OPEN;

  constructor() {
    super();
    window.setTimeout(() => {
      this.dispatchEvent(
        new MessageEvent('message', {
          data: JSON.stringify({
            type: 'live-flight',
            flight: {
              id: 'mock-VIDP-0',
              provider: 'mock',
              callsign: 'DEMO100',
              latitude: 28.9,
              longitude: 77.1,
              onGround: false,
              lastSeen: new Date().toISOString(),
              sourceUpdatedAt: new Date().toISOString(),
              demo: true,
            },
            generatedAt: new Date().toISOString(),
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

describe('useLiveFlight', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses live websocket frames for selected flights', async () => {
    vi.stubGlobal('WebSocket', MockWebSocket);

    const { result } = renderHook(() => useLiveFlight('mock', 'mock-VIDP-0', 'generated-VIDP-VOBL'));

    await waitFor(() => expect(result.current.status).toBe('live'));
    expect(result.current.detail?.flight.provider).toBe('mock');
  });
});
