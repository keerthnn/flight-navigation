import { Airport } from '../types/domain';

export function haversineNm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const r = 3440.065;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findAlternates(
  destinationLat: number,
  destinationLon: number,
  airports: Airport[],
  maxRangeNm: number = 150,
): Airport[] {
  return airports
    .filter((airport) => {
      const distNm = haversineNm(destinationLat, destinationLon, airport.latitude, airport.longitude);
      return distNm > 10 && distNm <= maxRangeNm;
    })
    .sort(
      (a, b) =>
        haversineNm(destinationLat, destinationLon, a.latitude, a.longitude)
        - haversineNm(destinationLat, destinationLon, b.latitude, b.longitude),
    )
    .slice(0, 4);
}
