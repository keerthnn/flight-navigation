"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompositeWeatherProvider = void 0;
exports.weatherRisk = weatherRisk;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
const metrics_1 = require("../monitoring/metrics");
const retry_1 = require("../utils/retry");
class CompositeWeatherProvider {
    aviationClient;
    openMeteoClient;
    constructor() {
        this.aviationClient = axios_1.default.create({ baseURL: env_1.env.AVIATION_WEATHER_BASE_URL, timeout: 5000 });
        this.openMeteoClient = axios_1.default.create({ baseURL: env_1.env.OPEN_METEO_BASE_URL, timeout: 5000 });
    }
    async getRouteWeather(nodes) {
        return Promise.all(nodes.map((node) => this.getWeatherForNode(node)));
    }
    async getWeatherForNode(node) {
        if (node.ident.length === 4 && node.type !== 'waypoint') {
            const aviationWeather = await this.getAviationWeather(node);
            if (aviationWeather)
                return aviationWeather;
        }
        try {
            const response = await (0, retry_1.retry)(() => this.openMeteoClient.get('/forecast', {
                params: {
                    latitude: node.lat,
                    longitude: node.lon,
                    current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,visibility,weather_code',
                },
            }));
            const current = response.data.current ?? {};
            const description = weatherCodeToDescription(Number(current.weather_code));
            metrics_1.metrics.recordProviderEvent('openMeteoSuccess');
            return {
                ident: node.ident,
                description,
                temperatureC: Number(current.temperature_2m ?? 20),
                humidity: Number(current.relative_humidity_2m ?? 55),
                visibilityMeters: Number(current.visibility ?? 10_000),
                windSpeedMps: Number(current.wind_speed_10m ?? 18) / 3.6,
                riskWeight: weatherRisk(description, Number(current.visibility ?? 10_000), Number(current.wind_speed_10m ?? 18) / 3.6),
                source: 'openmeteo',
            };
        }
        catch {
            return syntheticWeather(node);
        }
    }
    async getAviationWeather(node) {
        try {
            const response = await (0, retry_1.retry)(() => this.aviationClient.get('/metar', {
                params: { ids: node.ident, format: 'json' },
            }));
            const observation = Array.isArray(response.data) ? response.data[0] : undefined;
            if (!observation)
                return undefined;
            metrics_1.metrics.recordProviderEvent('aviationWeatherSuccess');
            const description = String(observation.wxString || observation.rawOb || 'VFR conditions');
            const visibilityMeters = Number(observation.visib ?? 10) * 1609.34;
            const windSpeedMps = Number(observation.wspd ?? 8) * 0.514444;
            return {
                ident: node.ident,
                description,
                temperatureC: Number(observation.temp ?? 20),
                humidity: Number(observation.humidity ?? 55),
                visibilityMeters,
                windSpeedMps,
                riskWeight: weatherRisk(description, visibilityMeters, windSpeedMps),
                source: 'aviationweather',
            };
        }
        catch {
            return undefined;
        }
    }
}
exports.CompositeWeatherProvider = CompositeWeatherProvider;
function syntheticWeather(node) {
    metrics_1.metrics.recordProviderEvent('syntheticWeatherFallback');
    const seed = Math.abs(Math.sin(node.lat + node.lon));
    const wind = 5 + seed * 12;
    const visibility = 7000 + seed * 6000;
    const description = seed > 0.72 ? 'convective clouds' : seed > 0.45 ? 'scattered clouds' : 'clear sky';
    return {
        ident: node.ident,
        description,
        temperatureC: Number((16 + seed * 18).toFixed(1)),
        humidity: Math.round(45 + seed * 40),
        visibilityMeters: Math.round(visibility),
        windSpeedMps: Number(wind.toFixed(1)),
        riskWeight: weatherRisk(description, visibility, wind),
        source: 'synthetic',
    };
}
function weatherCodeToDescription(code) {
    if ([95, 96, 99].includes(code))
        return 'thunderstorm';
    if (code >= 71)
        return 'snow';
    if (code >= 51)
        return 'rain';
    if (code >= 45)
        return 'mist';
    if (code >= 1)
        return 'scattered clouds';
    return 'clear sky';
}
function weatherRisk(description, visibilityMeters, windSpeedMps) {
    const text = description.toLowerCase();
    let risk = 1;
    if (text.includes('cloud'))
        risk += 2;
    if (text.includes('rain'))
        risk += 4;
    if (text.includes('thunder'))
        risk += 6;
    if (text.includes('snow'))
        risk += 6;
    if (text.includes('mist') || text.includes('fog'))
        risk += 4;
    if (visibilityMeters < 5000)
        risk += 2;
    if (windSpeedMps > 10)
        risk += 3;
    return Math.min(10, Number(risk.toFixed(2)));
}
