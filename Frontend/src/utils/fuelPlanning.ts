export interface FuelBreakdown {
  taxiKg: number;
  tripKg: number;
  contingencyKg: number;
  alternateKg: number;
  finalReserveKg: number;
  totalKg: number;
  marginPct: number;
}

export function computeFuelBreakdown(
  totalFuelKg: number,
  distanceNm: number,
  aircraftType: string = 'A320',
): FuelBreakdown {
  void aircraftType;
  const TAXI = 150;
  const FINAL_RESERVE = 600;
  const ALTERNATE = 800;
  void (totalFuelKg / Math.max(distanceNm, 1));

  const tripKg = Math.max(0, Math.round(totalFuelKg - TAXI - FINAL_RESERVE - ALTERNATE));
  const contingencyKg = Math.round(tripKg * 0.05);

  return {
    taxiKg: TAXI,
    tripKg,
    contingencyKg,
    alternateKg: ALTERNATE,
    finalReserveKg: FINAL_RESERVE,
    totalKg: totalFuelKg,
    marginPct: tripKg > 0 ? Math.round(((totalFuelKg - tripKg) / tripKg) * 100) : 0,
  };
}
