"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestContext = requestContext;
const node_crypto_1 = require("node:crypto");
function requestContext(req, res, next) {
    const requestId = req.header('x-request-id') ?? (0, node_crypto_1.randomUUID)();
    res.setHeader('x-request-id', requestId);
    next();
}
