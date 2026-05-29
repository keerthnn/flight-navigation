import fs from 'node:fs/promises';
import path from 'node:path';
import { Airport } from '../types/domain';

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let quoted = false;

  for (const char of line) {
    if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);
  return values.map((value) => value.trim());
}

export class AirportRepository {
  private airports: Airport[] | null = null;

  async search(query: string, limit = 8): Promise<Airport[]> {
    const normalized = query.toLowerCase();
    const airports = await this.findAll();
    return airports
      .filter((airport) =>
        [airport.name, airport.icao, airport.iata, airport.regionName, airport.countryCode]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(normalized)),
      )
      .slice(0, limit);
  }

  async findByIcao(icao: string): Promise<Airport | undefined> {
    const airports = await this.findAll();
    return airports.find((airport) => airport.icao === icao.toUpperCase());
  }

  async findAll(): Promise<Airport[]> {
    if (this.airports) return this.airports;

    const csvPath = process.env.AIRPORT_CSV_PATH ?? path.resolve(process.cwd(), '../Frontend/public/iata-icao.csv');
    const raw = await fs.readFile(csvPath, 'utf8');
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
