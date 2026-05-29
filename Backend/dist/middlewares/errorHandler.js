"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = notFoundHandler;
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
const logger_1 = require("../config/logger");
const httpError_1 = require("../utils/httpError");
function notFoundHandler(req, _res, next) {
    next(new httpError_1.HttpError(404, `Route not found: ${req.method} ${req.path}`));
}
function errorHandler(error, _req, res, _next) {
    if (error instanceof zod_1.ZodError) {
        res.status(400).json({ error: 'Invalid request', details: error.flatten() });
        return;
    }
    if (error instanceof httpError_1.HttpError) {
        res.status(error.statusCode).json({ error: error.message, details: error.details });
        return;
    }
    logger_1.logger.error({ err: error }, 'Unhandled API error');
    res.status(500).json({ error: 'Unexpected server error' });
}
