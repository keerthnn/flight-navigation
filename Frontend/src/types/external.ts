export interface MidpointWeatherData {
  latitude: number;
  longitude: number;
  windspeedKnots: number;
  windDirectionDeg: number;
  pressureHpa: number;
  cloudCoverPct: number;
  fetchedAtUtc: string;
}

export interface SunriseSunsetData {
  sunriseUtc: string;
  sunsetUtc: string;
  dayLengthSeconds: number;
  fetchedAtUtc: string;
}

export interface ADSBAircraft {
  icao: string;
  callsign: string;
  altitudeFt: number;
  groundspeedKt: number;
  trackDeg: number;
  lat: number;
  lon: number;
  lastSeenUtc: string;
}
