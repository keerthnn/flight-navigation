import { useEffect, useState } from 'react';
import { config } from '../config/env';
import { flightApi } from '../services/api/flightApi';
import { createLiveFlightSocket } from '../services/realtime/liveFlightClient';
import { LiveFlightDetail, LiveFlightProvider, SocketStatus } from '../types/domain';

const WS_MAX_RETRIES = 5;
const WS_BACKOFF_BASE_MS = 1000;
const WS_TIMEOUT_MS = 5000;
const POLL_INTERVAL_MS = 10000;

export function useLiveFlight(provider?: LiveFlightProvider, flightId?: string, routeId?: string) {
  const [detail, setDetail] = useState<LiveFlightDetail>();
  const [status, setStatus] = useState<SocketStatus>('closed');
  const [connectionStatus, setConnectionStatus] = useState<'live' | 'degraded' | 'offline'>('degraded');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!provider || !flightId) {
      setDetail(undefined);
      setStatus('closed');
      setConnectionStatus('offline');
      setRetryCount(0);
      return;
    }

    let pollTimer: number | undefined;
    let staleTimer: number | undefined;
    let reconnectTimer: number | undefined;
    let socket: WebSocket | undefined;
    let stopped = false;

    const startPolling = () => {
      if (pollTimer) return;
      setStatus('fallback');
      setConnectionStatus('degraded');
      const poll = () => {
        flightApi
          .getLiveFlight(provider, flightId, routeId)
          .then((next) => {
            setDetail(next);
          })
          .catch(() => setConnectionStatus('offline'));
      };
      poll();
      pollTimer = window.setInterval(poll, POLL_INTERVAL_MS);
    };

    const clearPolling = () => {
      if (pollTimer) window.clearInterval(pollTimer);
      pollTimer = undefined;
    };

    if (!config.liveWsEnabled) {
      startPolling();
      return () => {
        stopped = true;
        clearPolling();
      };
    }

    const connect = () => {
      if (stopped) return;
      setStatus('connecting');
      socket = createLiveFlightSocket(provider, flightId, routeId, {
        onFrame: (nextDetail) => {
          setDetail(nextDetail);
          setStatus('live');
          setConnectionStatus('live');
          setRetryCount(0);
          clearPolling();
          if (staleTimer) window.clearTimeout(staleTimer);
          staleTimer = window.setTimeout(() => {
            setConnectionStatus('degraded');
            startPolling();
          }, WS_TIMEOUT_MS);
        },
        onError: () => {
          setConnectionStatus('degraded');
          startPolling();
        },
        onClose: () => {
          if (stopped) return;
          setRetryCount((count) => {
            const next = count + 1;
            if (next > WS_MAX_RETRIES) {
              setConnectionStatus('offline');
              setStatus('fallback');
              startPolling();
              return next;
            }
            const waitMs = WS_BACKOFF_BASE_MS * 2 ** (next - 1);
            reconnectTimer = window.setTimeout(connect, waitMs);
            return next;
          });
        },
      });
    };

    connect();

    return () => {
      stopped = true;
      clearPolling();
      if (staleTimer) window.clearTimeout(staleTimer);
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [flightId, provider, routeId]);

  return { detail, status, connectionStatus, retryCount };
}
