export const Units = {
  kmToNm: (km: number) => +(km * 0.539957).toFixed(1),
  msToKnots: (ms: number) => +(ms * 1.944).toFixed(0),
  metersToFeet: (m: number) => +(m * 3.28084).toFixed(0),
  feetToMeters: (ft: number) => +(ft / 3.28084).toFixed(0),
  kgToCo2: (kg: number) => +(kg * 3.16).toFixed(0),
  hoursToHHMM: (h: number) => {
    const hh = Math.floor(h);
    const mm = Math.round((h - hh) * 60);
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  },
  formatUtcTime: (iso: string) => `${new Date(iso).toUTCString().slice(17, 22)}Z`,
  formatAlt: (ft: number) => (ft >= 1000 ? `FL${Math.round(ft / 100)}` : `${Math.round(ft).toLocaleString()}ft`),
};

export function isaDeviation(actualTempC: number, altitudeFt = 0): number {
  const isaStandard = 15 - (altitudeFt / 1000) * 2;
  return Math.round(actualTempC - isaStandard);
}

export function convectivePotential(
  tempC: number,
  humidityPct: number,
): { score: number; level: 'low' | 'moderate' | 'high' | 'extreme' } {
  const dewpointC = tempC - ((100 - humidityPct) / 5);
  const kIndex = tempC - dewpointC + humidityPct / 10;
  return {
    score: Math.round(kIndex * 10) / 10,
    level: kIndex < 15 ? 'low' : kIndex < 25 ? 'moderate' : kIndex < 35 ? 'high' : 'extreme',
  };
}

export function computeWindComponents(
  windSpeedKt: number,
  windDirectionDeg: number,
  routeBearingDeg: number,
  distanceNm: number,
): {
  headwindKt: number;
  crosswindKt: number;
  tailwindKt: number;
  component: 'headwind' | 'tailwind' | 'crosswind';
  correctedSpeedKt: number;
  correctedEteMins: number;
  distanceNm: number;
} {
  const angleDiff = ((windDirectionDeg - routeBearingDeg) + 360) % 360;
  const angleRad = (angleDiff * Math.PI) / 180;
  const headwind = windSpeedKt * Math.cos(angleRad);
  const crosswind = Math.abs(windSpeedKt * Math.sin(angleRad));
  const correctedSpeedKt = Math.max(50, Math.round(480 - headwind));
  return {
    headwindKt: Math.round(headwind),
    crosswindKt: Math.round(crosswind),
    tailwindKt: Math.max(0, Math.round(-headwind)),
    component: Math.abs(headwind) > crosswind ? (headwind > 0 ? 'headwind' : 'tailwind') : 'crosswind',
    correctedSpeedKt,
    correctedEteMins: Math.round((distanceNm / correctedSpeedKt) * 60),
    distanceNm,
  };
}
