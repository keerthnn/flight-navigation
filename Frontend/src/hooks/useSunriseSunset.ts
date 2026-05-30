import { useEffect, useState } from 'react';
import { SunriseSunsetData } from '../types/external';

export function useSunriseSunset(lat?: number, lon?: number) {
  const [data, setData] = useState<SunriseSunsetData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lat === undefined || lon === undefined) return;
    const controller = new AbortController();
    setLoading(true);

    fetch(`https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&formatted=0&date=today`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`API_ERROR (${response.status})`);
        return response.json();
      })
      .then((payload) => {
        const result: SunriseSunsetData = {
          sunriseUtc: String(payload.results?.sunrise),
          sunsetUtc: String(payload.results?.sunset),
          dayLengthSeconds: Number(payload.results?.day_length ?? 0),
          fetchedAtUtc: new Date().toISOString(),
        };
        setData(result);
        setError(null);
      })
      .catch((err: Error) => {
        if (err.name === 'AbortError') return;
        setError(err.message);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [lat, lon]);

  return { sunriseUtc: data?.sunriseUtc ?? null, sunsetUtc: data?.sunsetUtc ?? null, dayLengthSeconds: data?.dayLengthSeconds ?? null, loading, error };
}
