"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const compression_1 = __importDefault(require("compression"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));
const pino_http_1 = __importDefault(require("pino-http"));
const env_1 = require("./config/env");
const logger_1 = require("./config/logger");
const errorHandler_1 = require("./middlewares/errorHandler");
const metricsMiddleware_1 = require("./middlewares/metricsMiddleware");
const requestContext_1 = require("./middlewares/requestContext");
const routes_1 = require("./routes");
const serviceContainer_1 = require("./services/serviceContainer");
function createApp(container = (0, serviceContainer_1.createServiceContainer)()) {
    const app = (0, express_1.default)();
    app.use(requestContext_1.requestContext);
    app.use(metricsMiddleware_1.metricsMiddleware);
    app.use((0, pino_http_1.default)({ logger: logger_1.logger }));
    app.use((0, helmet_1.default)());
    app.use((0, compression_1.default)());
    app.use((0, cors_1.default)({
        origin: (origin, callback) => {
            if (!origin || env_1.corsOrigins.includes(origin)) {
                callback(null, true);
                return;
            }
            callback(new Error(`Origin ${origin} is not allowed by CORS`));
        },
    }));
    app.use(express_1.default.json({ limit: '1mb' }));
    app.use((0, express_rate_limit_1.default)({
        windowMs: env_1.env.RATE_LIMIT_WINDOW_MS,
        limit: env_1.env.RATE_LIMIT_MAX,
        standardHeaders: true,
        legacyHeaders: false,
    }));
    app.get('/', (_req, res) => res.json({ service: 'flight-navigation-backend', status: 'running' }));
    app.use('/api', (0, routes_1.createApiRoutes)(container.flightController));
    app.use(errorHandler_1.notFoundHandler);
    app.use(errorHandler_1.errorHandler);
    return app;
}
