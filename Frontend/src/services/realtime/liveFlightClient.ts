import { config } from '../../config/env';
import { LiveFlightDetail, LiveFlightProvider } from '../../types/domain';

export function createLiveFlightSocket(
  provider: LiveFlightProvider,
  flightId: string,
  routeId: string | undefined,
  handlers: {
    onFrame: (detail: LiveFlightDetail) => void;
    onError: () => void;
    onClose: () => void;
  },
): WebSocket {
  const url = new URL(config.wsBaseUrl);
  url.pathname = `/ws/flights/${provider}/${flightId}/live`;
  if (routeId) url.searchParams.set('routeId', routeId);
  url.searchParams.set('intervalMs', '10000');

  const socket = new WebSocket(url);
  socket.addEventListener('message', (event) => {
    const payload = JSON.parse(String(event.data));
    if (payload.type === 'live-flight') {
      handlers.onFrame(payload as LiveFlightDetail);
    }
  });
  socket.addEventListener('error', handlers.onError);
  socket.addEventListener('close', handlers.onClose);
  return socket;
}
