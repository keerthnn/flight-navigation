"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AirportRepository = void 0;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
function parseCsvLine(line) {
    const values = [];
    let current = '';
    let quoted = false;
    for (const char of line) {
        if (char === '"') {
            quoted = !quoted;
        }
        else if (char === ',' && !quoted) {
            values.push(current);
            current = '';
        }
        else {
            current += char;
        }
    }
    values.push(current);
    return values.map((value) => value.trim());
}
class AirportRepository {
    airports = null;
    async search(query, limit = 8) {
        const normalized = query.toLowerCase();
        const airports = await this.findAll();
        return airports
            .filter((airport) => [airport.name, airport.icao, airport.iata, airport.regionName, airport.countryCode]
            .filter(Boolean)
            .some((value) => value?.toLowerCase().includes(normalized)))
            .slice(0, limit);
    }
    async findByIcao(icao) {
        const airports = await this.findAll();
        return airports.find((airport) => airport.icao === icao.toUpperCase());
    }
    async findAll() {
        if (this.airports)
            return this.airports;
        const csvPath = process.env.AIRPORT_CSV_PATH ?? node_path_1.default.resolve(process.cwd(), '../Frontend/public/iata-icao.csv');
        const raw = await promises_1.default.readFile(csvPath, 'utf8');
        const [, ...rows] = raw.split(/\r?\n/).filter(Boolean);
        this.airports = rows
            .map((row) => {
            const [countryCode, regionName, iata, icao, airport, latitude, longitude] = parseCsvLine(row);
            return {
                countryCode,
                regionName,
                iata: iata || undefined,
                icao,
                name: airport,
                latitude: Number(latitude),
                longitude: Number(longitude),
            };
        })
            .filter((airport) => airport.icao && Number.isFinite(airport.latitude) && Number.isFinite(airport.longitude));
        return this.airports;
    }
}
exports.AirportRepository = AirportRepository;
