import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  LOG_LEVEL: z.string().default('info'),
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:3000'),
  FLIGHT_PLAN_DB_API_KEY: z.string().optional(),
  FLIGHT_PLAN_DB_BASE_URL: z.string().url().default('https://api.flightplandatabase.com'),
  AVIATION_WEATHER_BASE_URL: z.string().url().default('https://aviationweather.gov/api/data'),
  OPEN_METEO_BASE_URL: z.string().url().default('https://api.open-meteo.com/v1'),
  OPENSKY_BASE_URL: z.string().url().default('https://opensky-network.org/api'),
  CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
  MOCK_PROVIDERS: z
    .string()
    .optional()
    .transform((value) => value === 'true'),
});

export const env = envSchema.parse(process.env);

export const corsOrigins = env.CORS_ORIGINS.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
