"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockAirportRepository = void 0;
exports.createMockFlightPlanProvider = createMockFlightPlanProvider;
exports.createMockWeatherProvider = createMockWeatherProvider;
exports.createMockFuelProvider = createMockFuelProvider;
const flightPlanProvider_1 = require("../providers/flightPlanProvider");
const fuelProvider_1 = require("../providers/fuelProvider");
const airportRepository_1 = require("../repositories/airportRepository");
class MockAirportRepository extends airportRepository_1.AirportRepository {
    mockAirports = [
        {
            countryCode: 'IN',
            regionName: 'Delhi',
            iata: 'DEL',
            icao: 'VIDP',
            name: 'Indira Gandhi International Airport',
            latitude: 28.5665,
            longitude: 77.1031,
        },
        {
            countryCode: 'IN',
            regionName: 'Karnataka',
            iata: 'BLR',
            icao: 'VOBL',
            name: 'Kempegowda International Airport',
            latitude: 13.1979,
            longitude: 77.7063,
        },
    ];
    async search(query, limit = 8) {
        const normalized = query.toLowerCase();
        return this.mockAirports
            .filter((airport) => airport.name.toLowerCase().includes(normalized) || airport.icao.toLowerCase().includes(normalized))
            .slice(0, limit);
    }
    async findByIcao(icao) {
        return this.mockAirports.find((airport) => airport.icao === icao.toUpperCase());
    }
}
exports.MockAirportRepository = MockAirportRepository;
function createMockFlightPlanProvider() {
    return new flightPlanProvider_1.GeneratedFlightPlanProvider(new MockAirportRepository());
}
function createMockWeatherProvider() {
    return {
        async getRouteWeather(nodes) {
            return nodes.map((node, index) => ({
                ident: node.ident,
                description: index % 2 === 0 ? 'clear sky' : 'scattered clouds',
                temperatureC: 24 + index,
                humidity: 58,
                visibilityMeters: 10_000,
                windSpeedMps: 6 + index,
                riskWeight: index % 2 === 0 ? 1 : 3,
                source: 'synthetic',
            }));
        },
    };
}
function createMockFuelProvider() {
    return new fuelProvider_1.LocalFuelProvider();
}
