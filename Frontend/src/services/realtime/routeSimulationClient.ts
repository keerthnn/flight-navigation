import { config } from '../../config/env';
import { SimulationFrame } from '../../types/domain';

export function createRouteSimulationSocket(
  flightPlanId: string,
  handlers: {
    onFrame: (frame: SimulationFrame) => void;
    onError: () => void;
    onClose: () => void;
  },
): WebSocket {
  const url = new URL(config.wsBaseUrl);
  url.searchParams.set('flightPlanId', flightPlanId);
  url.searchParams.set('intervalMs', '750');

  const socket = new WebSocket(url);
  socket.addEventListener('message', (event) => {
    const payload = JSON.parse(String(event.data));
    if (payload.type === 'simulation-frame') {
      handlers.onFrame(payload as SimulationFrame);
    }
  });
  socket.addEventListener('error', handlers.onError);
  socket.addEventListener('close', handlers.onClose);
  return socket;
}
