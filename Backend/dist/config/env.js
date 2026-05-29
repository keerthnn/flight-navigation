"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsOrigins = exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'test', 'production']).default('development'),
    PORT: zod_1.z.coerce.number().int().positive().default(5000),
    LOG_LEVEL: zod_1.z.string().default('info'),
    CORS_ORIGINS: zod_1.z.string().default('http://localhost:5173,http://localhost:3000'),
    FLIGHT_PLAN_DB_API_KEY: zod_1.z.string().optional(),
    FLIGHT_PLAN_DB_BASE_URL: zod_1.z.string().url().default('https://api.flightplandatabase.com'),
    AVIATION_WEATHER_BASE_URL: zod_1.z.string().url().default('https://aviationweather.gov/api/data'),
    OPEN_METEO_BASE_URL: zod_1.z.string().url().default('https://api.open-meteo.com/v1'),
    OPENSKY_BASE_URL: zod_1.z.string().url().default('https://opensky-network.org/api'),
    ADSB_LOL_BASE_URL: zod_1.z.string().url().default('https://api.adsb.lol'),
    FLIGHT_TRACKING_MODE: zod_1.z.enum(['auto', 'mock']).default('auto'),
    CACHE_TTL_SECONDS: zod_1.z.coerce.number().int().positive().default(300),
    RATE_LIMIT_WINDOW_MS: zod_1.z.coerce.number().int().positive().default(60_000),
    RATE_LIMIT_MAX: zod_1.z.coerce.number().int().positive().default(120),
    MOCK_PROVIDERS: zod_1.z
        .string()
        .optional()
        .transform((value) => value === 'true'),
});
exports.env = envSchema.parse(process.env);
exports.corsOrigins = exports.env.CORS_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
