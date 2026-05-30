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
