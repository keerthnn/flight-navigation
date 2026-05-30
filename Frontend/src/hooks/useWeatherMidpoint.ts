import { useEffect, useMemo, useState } from 'react';
import { MidpointWeatherData } from '../types/external';
import { RouteNode } from '../types/domain';

const cache = new Map<string, { data: MidpointWeatherData; at: number }>();

export function useWeatherMidpoint(nodes: RouteNode[]) {
  const [data, setData] = useState<MidpointWeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const midpoint = useMemo(() => {
    if (!nodes.length) return null;
    const lat = nodes.reduce((sum, node) => sum + node.lat, 0) / nodes.length;
    const lon = nodes.reduce((sum, node) => sum + node.lon, 0) / nodes.length;
    return { lat, lon };
  }, [nodes]);

  useEffect(() => {
    if (!midpoint) return;
    const key = `${midpoint.lat.toFixed(2)},${midpoint.lon.toFixed(2)}`;
    const cached = cache.get(key);
    if (cached && Date.now() - cached.at < 10 * 60 * 1000) {
      setData(cached.data);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${midpoint.lat}&longitude=${midpoint.lon}&hourly=windspeed_10m,winddirection_10m,surface_pressure,cloudcover&forecast_days=1&timezone=UTC`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`API_ERROR (${response.status})`);
        return response.json();
      })
      .then((payload) => {
        const currentHour = new Date().getUTCHours();
        const result: MidpointWeatherData = {
          latitude: midpoint.lat,
          longitude: midpoint.lon,
          windspeedKnots: Number(((payload.hourly.windspeed_10m[currentHour] ?? 0) * 1.944).toFixed(0)),
          windDirectionDeg: Number(payload.hourly.winddirection_10m[currentHour] ?? 0),
          pressureHpa: Number(payload.hourly.surface_pressure[currentHour] ?? 0),
          cloudCoverPct: Number(payload.hourly.cloudcover[currentHour] ?? 0),
          fetchedAtUtc: new Date().toISOString(),
        };
        cache.set(key, { data: result, at: Date.now() });
        setData(result);
        setError(null);
      })
      .catch((err: Error) => {
        if (err.name === 'AbortError') return;
        setError(err.message);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [midpoint]);

  return { data, loading, error, refreshedAt: data?.fetchedAtUtc ?? null };
}
