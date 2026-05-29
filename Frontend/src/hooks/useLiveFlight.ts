import { useEffect, useState } from 'react';
import { flightApi } from '../services/api/flightApi';
import { createLiveFlightSocket } from '../services/realtime/liveFlightClient';
import { LiveFlightDetail, LiveFlightProvider, SocketStatus } from '../types/domain';

export function useLiveFlight(provider?: LiveFlightProvider, flightId?: string, routeId?: string) {
  const [detail, setDetail] = useState<LiveFlightDetail>();
  const [status, setStatus] = useState<SocketStatus>('closed');

  useEffect(() => {
    if (!provider || !flightId) {
      setDetail(undefined);
      setStatus('closed');
      return;
    }

    let pollingTimer: number | undefined;
    let socketFailed = false;
    setStatus('connecting');

    const startPolling = () => {
      if (pollingTimer) return;
      setStatus('fallback');
      const poll = () => {
        flightApi.getLiveFlight(provider, flightId, routeId).then(setDetail).catch(() => undefined);
      };
      poll();
      pollingTimer = window.setInterval(poll, 10_000);
    };

    const socket = createLiveFlightSocket(provider, flightId, routeId, {
      onFrame: (nextDetail) => {
        setDetail(nextDetail);
        setStatus('live');
      },
      onError: () => {
        socketFailed = true;
        startPolling();
      },
      onClose: () => {
        if (socketFailed) return;
        startPolling();
      },
    });

    const fallbackTimer = window.setTimeout(() => {
      if (socket.readyState !== WebSocket.OPEN) {
        socketFailed = true;
        startPolling();
      }
    }, 2500);

    return () => {
      window.clearTimeout(fallbackTimer);
      if (pollingTimer) window.clearInterval(pollingTimer);
      socket.close();
    };
  }, [flightId, provider, routeId]);

  return { detail, status };
}
