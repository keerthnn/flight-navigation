import { useEffect, useState } from 'react';
import { createRouteSimulationSocket } from '../services/realtime/routeSimulationClient';
import { SimulationFrame, SocketStatus } from '../types/domain';

export function useRouteSimulation(flightPlanId?: string) {
  const [frame, setFrame] = useState<SimulationFrame>();
  const [status, setStatus] = useState<SocketStatus>(flightPlanId ? 'connecting' : 'fallback');

  useEffect(() => {
    if (!flightPlanId) {
      setStatus('fallback');
      return;
    }

    setStatus('connecting');
    const socket = createRouteSimulationSocket(flightPlanId, {
      onFrame: (nextFrame) => {
        setFrame(nextFrame);
        setStatus('live');
      },
      onError: () => setStatus('fallback'),
      onClose: () => setStatus((current) => (current === 'live' ? 'closed' : 'fallback')),
    });

    const fallbackTimer = window.setTimeout(() => {
      if (socket.readyState !== WebSocket.OPEN) {
        setStatus('fallback');
      }
    }, 2500);

    return () => {
      window.clearTimeout(fallbackTimer);
      socket.close();
    };
  }, [flightPlanId]);

  return { frame, status };
}
