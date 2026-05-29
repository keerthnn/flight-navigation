"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalFuelProvider = void 0;
const metrics_1 = require("../monitoring/metrics");
const fuelBurnByAircraft = {
    A320: 2.55,
    B738: 2.65,
    B789: 5.4,
    A359: 5.8,
};
class LocalFuelProvider {
    async estimate(aircraft, distanceKm) {
        metrics_1.metrics.recordProviderEvent('localFuelEstimate');
        const normalized = aircraft.toUpperCase();
        const burnKgPerKm = fuelBurnByAircraft[normalized] ?? 2.75;
        const reserveMultiplier = 1.12;
        const fuelKg = Math.round(distanceKm * burnKgPerKm * reserveMultiplier);
        return {
            aircraft: normalized,
            distanceKm: Number(distanceKm.toFixed(2)),
            fuelKg,
            co2Kg: Math.round(fuelKg * 3.16),
            model: fuelBurnByAircraft[normalized] ? `${normalized} nominal burn` : 'generic narrow-body estimate',
            source: 'local-estimator',
        };
    }
}
exports.LocalFuelProvider = LocalFuelProvider;
