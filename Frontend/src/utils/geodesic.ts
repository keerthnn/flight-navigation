function toRad(degrees: number) {
  return degrees * (Math.PI / 180);
}

function toDeg(radians: number) {
  return radians * (180 / Math.PI);
}

function normalizeLon(lon: number) {
  if (lon > 180) return lon - 360;
  if (lon < -180) return lon + 360;
  return lon;
}

export function interpolateGreatCircle(
  from: [number, number],
  to: [number, number],
  steps = 80,
): [number, number][] {
  const [lat1, lon1] = from.map(toRad) as [number, number];
  const [lat2, lon2] = to.map(toRad) as [number, number];

  const a =
    Math.sin((lat2 - lat1) / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2;
  const d = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  if (d === 0) return [from, to];

  const points: [number, number][] = [];
  for (let i = 0; i <= steps; i += 1) {
    const f = i / steps;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);

    const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
    const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);

    const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
    const lon = Math.atan2(y, x);

    points.push([toDeg(lat), normalizeLon(toDeg(lon))]);
  }

  return points;
}

export function computeBearing(
  from: [number, number],
  to: [number, number],
): number {
  const toRadians = (d: number) => d * (Math.PI / 180);
  const dLon = toRadians(to[1] - from[1]);
  const lat1 = toRadians(from[0]);
  const lat2 = toRadians(to[0]);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2)
    - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
