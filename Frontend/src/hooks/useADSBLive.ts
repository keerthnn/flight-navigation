import { useEffect, useMemo, useState } from 'react';
import { ADSBAircraft } from '../types/external';

export function useADSBLive(lat?: number, lon?: number) {
  const enabled = useMemo(() => import.meta.env.VITE_ENABLE_ADSB_DIRECT === 'true', []);
  const [aircraft, setAircraft] = useState<ADSBAircraft[]>([]);
  const [status, setStatus] = useState<'disabled' | 'live' | 'error'>(enabled ? 'live' : 'disabled');
  const [lastPollUtc, setLastPollUtc] = useState<string>();

  useEffect(() => {
    if (!enabled || lat === undefined || lon === undefined) return;
    let timer: number | undefined;
    const poll = () => {
      fetch(`https://api.adsb.lol/v2/lat/${lat}/lon/${lon}/dist/50`)
        .then((response) => response.json())
        .then((payload) => {
          const next = (Array.isArray(payload?.ac) ? payload.ac : []).map((ac: Record<string, unknown>) => ({
            icao: String(ac.hex ?? ''),
            callsign: String(ac.flight ?? '').trim(),
            altitudeFt: typeof ac.alt_baro === 'number' ? ac.alt_baro : 0,
            groundspeedKt: Number(ac.gs ?? 0),
            trackDeg: Number(ac.track ?? 0),
            lat: Number(ac.lat ?? 0),
            lon: Number(ac.lon ?? 0),
            lastSeenUtc: new Date().toISOString(),
          }));
          setAircraft(next);
          setStatus('live');
          setLastPollUtc(new Date().toISOString());
        })
        .catch(() => setStatus('error'));
    };

    poll();
    timer = window.setInterval(poll, 15_000);
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [enabled, lat, lon]);

  return { enabled, aircraft, status, lastPollUtc };
}
